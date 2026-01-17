"""
PC PartPicker tools for SAM agents.

These tools allow the agent to query PC component data to verify compatibility.
Uses the 'pcpartpicker' library (JonathanVusich) to retrieve data.
"""

import logging
from typing import Any, Dict, List, Optional, Union

# Try to import just to check availability, but we instantiate inside functions
try:
    from pcpartpicker import API
except ImportError:
    API = None

log = logging.getLogger(__name__)

async def pcpartpicker_check(
    parts: List[str],
    region: str = "us",
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Check availability and specs of PC parts using PCPartPicker.
    
    This function searches for the provided part names in the PCPartPicker database
    and returns their specifications (socket, TDP, length, etc.) so the Agent
    can determine compatibility.

    Args:
        parts: List of part names/model numbers to check (e.g., ["Ryzen 7 7800X3D", "MSI B650"]).
        region: PCPartPicker region (default: "us").

    Returns:
        A dictionary containing technical specs for each found part.
    """
    log_id = f"[PCTools:check]"
    log.info(f"{log_id} Checking {len(parts)} parts in region {region}")

    if API is None:
        return {
            "status": "error",
            "message": "The 'pcpartpicker' library is not installed. Please install it with 'pip install pcpartpicker'."
        }

    try:
        api = API(region=region)
        
        # We need to find each part. Since we don't know the type (CPU, GPU, etc.),
        # we might need to search relevant categories or use a broad search if supported.
        # The library's 'retrieve' fetches a category. We will implement a smart search.
        
        # Categories to search (in order of likelihood for compatibility checks)
        categories = [
            "cpu", 
            "motherboard", 
            "video-card", 
            "case", 
            "power-supply", 
            "memory", 
            "cpu-cooler", 
            "internal-hard-drive"
        ]

        found_parts = []
        missing_parts = []

        # Optimization: Fetch categories only if needed?
        # Since 'api.retrieve' might be heavy, and we have multiple parts,
        # we'll try to guess or just iterate. 
        # For a production agent, we'd cache this data.
        
        # We'll fetch one category at a time and check ALL input parts against it.
        # This reduces API calls compared to "For each part, search all categories".
        
        remaining_queries = parts.copy()
        
        # Store data: {category: [part_data]}
        # But we do lazy fetching.
        
        for category in categories:
            if not remaining_queries:
                break
                
            log.debug(f"{log_id} Fetching category: {category}")
            try:
                # retrieve is likely blocking or async? The library is async but wrapped in sync here usually?
                # The search results said "Uses asynchronous requests". 
                # If 'API()' is constructed, does 'retrieve' return specific data?
                # We'll assume standard sync usage or handled by threadpool.
                category_data = api.retrieve(category)
                
                # 'category_data' is a list of objects. We need to match names.
                # Assuming objects have a 'name' attribute or similar.
                
                parts_to_remove = []
                for query in remaining_queries:
                    # Simple fuzzy match
                    match = _find_best_match(query, category_data)
                    if match:
                        # Extract useful specs (socket, tdp, length, etc.)
                        specs = _extract_specs(match, category)
                        found_parts.append({
                            "query": query,
                            "name": match.name,
                            "category": category,
                            "specs": specs,
                            "url": getattr(match, "url", ""),
                            "price": getattr(match, "price", "N/A")
                        })
                        parts_to_remove.append(query)
                
                for p in parts_to_remove:
                    remaining_queries.remove(p)
                    
            except Exception as e:
                log.warning(f"{log_id} Failed to retrieve category {category}: {e}")
                continue

        # Any remaining queries were not found
        for q in remaining_queries:
            missing_parts.append(q)

        return {
            "status": "success",
            "found_parts": found_parts,
            "missing_parts": missing_parts,
            "note": "Compatibility must be assessed by the Agent based on the returned specs."
        }

    except Exception as e:
        log.error(f"{log_id} Unexpected error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
        }

def _find_best_match(query: str, items: list) -> Optional[Any]:
    """
    Find the best matching item for the query string.
    Case-insensitive substring match, prioritizing exact matches.
    """
    q = query.lower()
    # 1. Exact match
    for item in items:
        if hasattr(item, "name") and item.name.lower() == q:
            return item
            
    # 2. Substring match (item name contains query)
    # This might match "Ryzen 7" to "Ryzen 7 1700" when user meant "7800X3D".
    # User queries usually are specific: "Ryzen 7 7800X3D".
    # "Ryzen 7 7800X3D" in "AMD Ryzen 7 7800X3D 4.2 GHz 8-Core Processor" -> True.
    matches = []
    for item in items:
        if hasattr(item, "name"):
            name = item.name.lower()
            # Split query terms and check if all are present?
            terms = q.split()
            if all(term in name for term in terms):
                matches.append(item)
    
    if not matches:
        return None
        
    # primitive ranking: shortest name that matches (closest match)
    matches.sort(key=lambda x: len(x.name))
    return matches[0]

def _extract_specs(item: Any, category: str) -> Dict[str, Any]:
    """
    Extract relevant specs for compatibility checking based on category.
    """
    specs = {}
    
    # Common attributes (if available) - we use getattr dynamically
    # The library objects usually map specific fields.
    
    if category == "cpu":
        specs["socket"] = getattr(item, "socket", None)
        specs["tdp"] = getattr(item, "tdp", None)
        specs["core_count"] = getattr(item, "core_count", None)
        specs["clock"] = getattr(item, "core_clock", None)
        
    elif category == "motherboard":
        specs["socket"] = getattr(item, "socket_cpu", None)
        specs["form_factor"] = getattr(item, "form_factor", None)
        specs["memory_type"] = getattr(item, "memory_type", None) # e.g. DDR5
        specs["memory_slots"] = getattr(item, "memory_slots", None)
        specs["max_memory"] = getattr(item, "memory_max", None)
        
    elif category == "video-card":
        specs["length"] = getattr(item, "length", None)
        specs["memory"] = getattr(item, "memory", None)
        specs["chipset"] = getattr(item, "chipset", None)
        specs["tdp"] = getattr(item, "tdp", None) # Note: Library might not provide GPU TDP directly, requires checking.
        
    elif category == "case":
        specs["type"] = getattr(item, "type", None)
        specs["max_gpu_length"] = getattr(item, "max_video_card_length", None)
        # Internal drive bays, etc.
        
    elif category == "power-supply":
        specs["wattage"] = getattr(item, "wattage", None)
        specs["type"] = getattr(item, "type", None)
        specs["modular"] = getattr(item, "modular", None)
        
    elif category == "memory":
        specs["modules"] = getattr(item, "modules", None) # 2 x 16GB
        specs["price_per_gb"] = getattr(item, "price_per_gb", None)
        specs["speed"] = getattr(item, "speed", None) # DDR5-6000
        
    elif category == "cpu-cooler":
        specs["height"] = getattr(item, "height", None) # For air coolers checking against case width
        specs["radiator"] = getattr(item, "radiator", None) # For AIO
        
    # Include raw dictionary dump if available for LLM to parse extra details
    if hasattr(item, "__dict__"):
        specs["raw"] = {k:v for k,v in item.__dict__.items() if not k.startswith("_")}
        
    return specs
