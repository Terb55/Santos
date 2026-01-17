"""
Image generation tools for SAM agents.

Uses Cloudflare Workers AI API (REST) to generate images.
Model: @cf/black-forest-labs/flux-2-klein-4b
Input: multipart/form-data
"""

import logging
import os
import requests
import base64
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

async def generate_image(
    prompt: str,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate an image based on a text prompt using Cloudflare's Flux.2 Klein model.
    Sends request as multipart/form-data as required by this specific model endpoint.

    Args:
        prompt: Description of the image to generate.

    Returns:
        A dictionary containing the generated image file path.
    """
    log_id = f"[ImageTools:generate]"
    log.info(f"{log_id} Generating image for prompt: '{prompt}'")

    if not tool_config:
        tool_config = {}

    api_token = tool_config.get("api_token") or os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = tool_config.get("account_id") or os.environ.get("CLOUDFLARE_ACCOUNT_ID")

    if not api_token or not account_id:
        return {
            "status": "error",
            "message": "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID."
        }
    
    # Clean up account ID
    account_id = account_id.strip().rstrip('U').strip()

    # Using Flux.2 Klein
    model_id = "@cf/black-forest-labs/flux-2-klein-4b"
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_id}"
    
    # Authorization header ONLY. 
    # Do NOT set Content-Type to json. requests will set it to multipart/form-data; boundary=...
    headers = {
        "Authorization": f"Bearer {api_token}"
    }
    
    # Send as multipart/form-data
    # 'prompt' as a field.
    # Using 'files' dict with tuple (None, value) sends it as a form field, not a file upload.
    multipart_data = {
        'prompt': (None, prompt),
        'guidance': (None, '7.5'), # Optional but good standard
        # 'steps': (None, '4') # Fixed at 4 for this model usually, but harmless to omit
    }

    try:
        log.info(f"{log_id} Sending multipart request to Cloudflare AI: {url}")
        
        # Note: Using 'files' parameter forces multipart/form-data
        response = requests.post(url, headers=headers, files=multipart_data, timeout=60)
        
        if response.status_code != 200:
             log.error(f"{log_id} API Error: {response.status_code} - {response.text}")
             return {
                 "status": "error",
                 "message": f"Cloudflare API Error ({response.status_code}): {response.text}"
             }
        
        # Check Content-Type to determine response format (Binary or JSON-wrapped)
        content_type = response.headers.get("Content-Type", "")
        image_bytes = None
        
        if "image" in content_type:
            # Direct binary response
            image_bytes = response.content
        elif "application/json" in content_type:
            # JSON response containing Base64
            try:
                data = response.json()
                b64_str = data.get("image") or data.get("result", {}).get("image")
                if b64_str:
                    image_bytes = base64.b64decode(b64_str)
                else:
                    return {
                        "status": "error",
                        "message": f"Could not find image data in JSON response: {str(data)[:200]}"
                    }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to parse JSON response: {e}"
                }
        else:
            return {
                "status": "error",
                "message": f"Unexpected response format: {content_type}. Response: {response.text[:200]}"
            }

        if image_bytes:
            import time
            timestamp = int(time.time())
            
            output_dir = "generated_images"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                
            filename = f"{output_dir}/img_{timestamp}.png"
            
            with open(filename, "wb") as f:
                f.write(image_bytes)
                
            return {
                "status": "success",
                "files": [os.path.abspath(filename)],
                "message": f"Generated image saved to {filename}"
            }
        else:
             return {
                "status": "error",
                "message": "No image bytes could be extracted."
            }

    except Exception as e:
        log.error(f"{log_id} Generation failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Image generation failed: {str(e)}"
        }
