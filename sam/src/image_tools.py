"""
Image generation tools for SAM agents.

MOCK MODE: Returns a fake link for testing purposes (no API call, no file save).
"""

import logging
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

async def generate_image(
    prompt: str,
    filename: Optional[str] = None,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Mock image generation tool. Returns a fake link.

    Args:
        prompt: Description of the image.
        filename: Optional filename.

    Returns:
        Mock success response with fake link.
    """
    log.info(f"[ImageTools:Mock] Received prompt: '{prompt}'")
    
    # Generate a fake link
    fake_link = "https://test.local/generated_image_mock.png"
    if filename:
        # Strip extension if present to append .png or keep? 
        # User might provide 'dog.png'.
        fake_link = f"https://test.local/{filename}"

    return {
        "status": "success",
        "files": [fake_link],
        "message": f"Image generated (Mock): {fake_link}"
    }
