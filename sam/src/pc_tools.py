"""
PC PartPicker tools for SAM agents.

These tools allow the agent to query PC component data to verify compatibility.
Uses the 'pypartpicker' library (lucwl) to retrieve data.
"""

import logging
from typing import Any, Dict, List, Optional

# Try to import just to check availability
try:
    from pypartpicker import Client
except ImportError:
    Client = None

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

    if Client is None:
        return {
            "status": "error",
            "message": "The 'pypartpicker' library is not installed. Please install it with 'pip install pypartpicker'."
        }

    try:
        # Client usage (synchronous)
        # Note: pypartpicker uses requests-html and might launch a browser unless no_js=True is checked?
        # The docs say: "Due to pyppeteer your first use of the library may install a chromium browser... 
        # disable this feature entirely, use the no_js=True option"
        # Since we are in a headless/agent env, we likely want no_js=True to avoid Chrome install issues if possible,
        # but some data might be missing. However, basic search usually works.
        # Let's try to use no_js=True for stability in docker.
        
        client = Client(no_js=True) 
        
        found_parts = []
        missing_parts = []
        
        for part_name in parts:
            log.debug(f"{log_id} Searching for: {part_name}")
            try:
                # get_part_search(query, page=1, region=region)
                results_obj = client.get_part_search(part_name, region=region)
                
                # 'results_obj' is a PartSearchResult object
                if not results_obj.parts:
                    missing_parts.append(part_name)
                    continue
                
                # Take the best match
                best_match = results_obj.parts[0]
                
                # Fetch full details? 
                # The search result object might have limited fields (name, url, price).
                # To get 'specs', we often need 'get_part(url)'.
                # Let's check if 'specs' is populated in search result.
                # If not, we fetch it.
                
                part_specs = {}
                # Search results often just have basic info.
                # We need to fetch the specific part page.
                if best_match.url:
                    try:
                        detailed_part = client.get_part(best_match.url, region=region)
                        if detailed_part and hasattr(detailed_part, 'specs'):
                           part_specs = detailed_part.specs
                    except Exception as e:
                        log.warning(f"{log_id} Failed to fetch details for {best_match.name}: {e}")
                        # Fallback to whatever specs might exist or just empty
                
                found_parts.append({
                    "query": part_name,
                    "name": getattr(best_match, "name", "Unknown"),
                    "url": getattr(best_match, "url", ""),
                    "price": getattr(best_match, "price", "N/A"),
                    "specs": part_specs
                })
                
            except Exception as e:
                log.warning(f"{log_id} Error searching for {part_name}: {e}")
                missing_parts.append(part_name)

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
