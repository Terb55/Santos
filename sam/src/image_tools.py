"""
Image generation tools for SAM agents.

Uses Cloudflare Workers AI (Flux-1-Schnell) to generate images.
"""

import logging
import os
import requests
import uuid
import base64
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

async def generate_image(
    prompt: str,
    filename: Optional[str] = None,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate an image using Cloudflare Workers AI (Flux-1-Schnell).

    Args:
        prompt: Description of the image.
        filename: Optional filename to save as.
        tool_config: Configuration containing 'api_token' and 'account_id'.

    Returns:
        Dict with status, files list, and message.
    """
    log.info(f"[ImageTools] Received prompt: '{prompt}'")

    if not tool_config:
        tool_config = {}
    
    # Get config from arguments or environment
    api_token = tool_config.get("api_token") or os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = tool_config.get("account_id") or os.environ.get("CLOUDFLARE_ACCOUNT_ID")

    if not api_token or not account_id:
        return {
            "status": "error",
            "message": "Missing Cloudflare configuration (CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID)."
        }

    # API Endpoint for Flux-1-Schnell
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell"
    headers = {"Authorization": f"Bearer {api_token}"}
    payload = {"prompt": prompt}

    try:
        log.info(f"[ImageTools] Calling Cloudflare API: {url}")
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            error_msg = f"Cloudflare API Error ({response.status_code}): {response.text}"
            log.error(error_msg)
            return {"status": "error", "message": error_msg}

        result = response.json()
        
        # Check for Base64 image in response
        if "result" in result and "image" in result["result"]:
            image_b64 = result["result"]["image"]
            image_data = base64.b64decode(image_b64)
        else:
            # unique to some CF models, sometimes it returns binary directly if not wrapped
            # but Flux usually returns JSON with "result": { "image": "..." }
            # Fallback check if response content is binary
            if response.headers.get("content-type") == "image/png":
               image_data = response.content
            else:
               return {"status": "error", "message": "Unexpected response format from Cloudflare."}

        if not filename:
            filename = f"generated-{uuid.uuid4().hex[:8]}.png"
        
        # Ensure it ends with .png
        if not filename.lower().endswith(".png"):
            filename += ".png"

        files_list = []
        artifact_uri = None

        # 1. Save to disk (always good for debugging/caching)
        output_dir = "/tmp"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_data)
        files_list.append(filepath)
        log.info(f"[ImageTools] Image saved to disk: {filepath}")

        # 1b. Force save to mounted artifacts volume (if available)
        # This ensures the user can see it in c:\Projects\Santos\sam\data\artifacts
        mounted_dir = "/tmp/samv2"
        if os.path.exists(mounted_dir):
            try:
                mounted_path = os.path.join(mounted_dir, filename)
                with open(mounted_path, "wb") as f:
                    f.write(image_data)
                log.info(f"[ImageTools] Image copied to mounted volume: {mounted_path}")
            except Exception as e:
                log.warning(f"[ImageTools] Failed to copy to mounted volume: {e}")

        # 2. Register with ArtifactService (if context available)
        if tool_context and hasattr(tool_context, "services") and hasattr(tool_context.services, "artifact_service"):
            try:
                log.info(f"[ImageTools] Registering artifact '{filename}' with ArtifactService...")
                
                # ArtifactService.create_artifact usually expects base64 string for content
                b64_content = base64.b64encode(image_data).decode('utf-8')
                
                # We await the service call
                artifact = await tool_context.services.artifact_service.create_artifact(
                    filename=filename,
                    content=b64_content,
                    mime_type="image/png",
                    metadata={
                        "source": "Cloudflare Flux",
                        "prompt": prompt
                    }
                )
                
                # Assuming artifact object has 'uri' attribute
                if hasattr(artifact, "uri"):
                    artifact_uri = artifact.uri
                    # Add URI to files list as well, or just return it in message
                    files_list.append(artifact_uri)
                    log.info(f"[ImageTools] Artifact registered: {artifact_uri}")
                else:
                    log.warning(f"[ImageTools] Artifact registered but no URI returned: {artifact}")

            except Exception as service_err:
                log.warning(f"[ImageTools] Failed to register artifact: {service_err}", exc_info=True)
                # Continue without failing the whole request, user still has local path (though download might fail)

        message = f"Image generated successfully. Saved to: {filepath}"
        if artifact_uri:
            message += f"\nArtifact URI: {artifact_uri}"

        return {
            "status": "success",
            "files": files_list,
            "artifact_uri": artifact_uri, # Explicitly return URI for Agent to see
            "message": message
        }

    except Exception as e:
        log.exception("Failed to generate image")
        return {
            "status": "error",
            "message": f"Exception during image generation: {str(e)}"
        }
