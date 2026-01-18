"""
SerpApi price tracking tools for SAM agents.

These tools provide Level 3 (Advanced) capabilities by calling SerpApi
to fetch Google Shopping results and normalize offers for display.

Logging Pattern:
    SAM tools use Python's standard logging with a module-level logger.
    Use bracketed identifiers like [PriceTracking:function] for easy filtering.
    Always use exc_info=True when logging exceptions to capture stack traces.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# Module-level logger - SAM will configure this based on your YAML or logging_config.yaml
log = logging.getLogger(__name__)


def _to_offers(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    results = data.get("shopping_results")
    if not isinstance(results, list):
        return []

    offers: List[Dict[str, Any]] = []
    for r in results:
        if not isinstance(r, dict):
            continue
        offer = {
            "title": r.get("title") or None,
            "store": r.get("source") or None,
            "price_text": r.get("price") or None,
            "price_number": r.get("extracted_price") if isinstance(r.get("extracted_price"), (int, float)) else None,
            "url": r.get("product_link") or r.get("link") or None,
            "rating": r.get("rating") if isinstance(r.get("rating"), (int, float)) else None,
            "reviews": r.get("reviews") if isinstance(r.get("reviews"), int) else None,
            "delivery": r.get("delivery") or None,
            "position": r.get("position") if isinstance(r.get("position"), int) else None,
        }
        if offer["price_text"] and offer["url"]:
            offers.append(offer)
    return offers


async def serpapi_get_prices(
    query: str,
    engine: str = "google_shopping",
    google_domain: str = "google.ca",
    gl: str = "ca",
    hl: str = "en",
    location: str = "Ottawa, Ontario, Canada",
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetch and normalize Google Shopping offers from SerpApi.

    Args:
        query: Product search query.
        engine: SerpApi engine (default: google_shopping).
        google_domain: Google domain for the query (default: google.ca).
        gl: Country code (default: ca).
        hl: Language code (default: en).
        location: Location string for geotargeting.

    Returns:
        A dictionary with normalized offers.
    """
    log_id = f"[PriceTracking:get_prices:{query}]"
    query = (query or "").strip()
    if not query:
        return {"status": "error", "message": "Missing query"}

    api_key = None
    if tool_config:
        api_key = tool_config.get("price_api_key")
    if not api_key:
        api_key = os.getenv("PRICE_API_KEY")
    if not api_key:
        return {"status": "error", "message": "Missing PRICE_API_KEY"}

    params = {
        "engine": engine,
        "q": query,
        "api_key": api_key,
        "google_domain": google_domain,
        "gl": gl,
        "hl": hl,
        "location": location,
    }

    url = f"https://serpapi.com/search?{urlencode(params)}"
    log.debug(f"{log_id} Requesting {url}")

    try:
        req = Request(url, method="GET", headers={"Accept": "application/json"})
        with urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)

        offers = _to_offers(data)
        offers.sort(key=lambda o: o["price_number"] if isinstance(o.get("price_number"), (int, float)) else 10**12)

        log.info(f"{log_id} Retrieved {len(offers)} offers")
        return {
            "status": "success",
            "query": query,
            "count": len(offers),
            "offers": offers,
        }

    except HTTPError as e:
        retry_after = e.headers.get("Retry-After") if getattr(e, "headers", None) else None
        if e.code == 429:
            message = "SerpApi rate limit hit (HTTP 429)."
            if retry_after:
                message += f" Retry after {retry_after} seconds."
            log.warning(f"{log_id} {message}")
            return {
                "status": "error",
                "message": message,
            }
        log.error(f"{log_id} HTTP error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"HTTP error {e.code}: {e.reason}",
        }
    except URLError as e:
        log.error(f"{log_id} Network error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Network error: {str(e)}",
        }
    except Exception as e:
        log.error(f"{log_id} Unexpected error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
        }
