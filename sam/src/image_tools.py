"""
Image generation tools for SAM agents.

Uses Google's Gemini API (Imagen) via `google-generativeai` library.
"""

import logging
import os
from typing import Any, Dict, Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None

log = logging.getLogger(__name__)

async def generate_image(
    prompt: str,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate an image based on a text prompt using Google's Imagen model.

    Args:
        prompt: Description of the image to generate.

    Returns:
        A dictionary containing the generated image URL or data.
    """
    log_id = f"[ImageTools:generate]"
    log.info(f"{log_id} Generating image for prompt: '{prompt}'")

    if genai is None:
        return {
            "status": "error",
            "message": "The 'google-generativeai' library is not installed."
        }
        
    api_key = None
    if tool_config:
        api_key = tool_config.get("api_key")
    
    # Fallback to env var if not in tool config
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "message": "Missing GEMINI_API_KEY in tool configuration or environment."
        }

    try:
        genai.configure(api_key=api_key)
        
        # Determine model - imagen-3 is latest, but might need specific access.
        # 'gemini-pro-vision' is for understanding, not generation usually?
        # Google's Python SDK for Imagen is evolving.
        # As of recently, it might be `genai.ImageGenerationModel("imagen-3.0-generate-001")`.
        # Let's try a standard model or handle the specific class.
        
        # Note: The 'google-generativeai' library version 0.3+ introduced some changes.
        # We need to check if ImageGenerationModel exists.
        
        if not hasattr(genai, "ImageGenerationModel"):
             return {
                "status": "error",
                "message": "Installed 'google-generativeai' version does not support ImageGenerationModel. Update library."
            }

        imagen_model = genai.ImageGenerationModel("imagen-3.0-generate-001")
        
        # Generate
        result = imagen_model.generate_images(
            prompt=prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            safety_filter_level="block_some",
            person_generation="allow_adult" # Be careful with this, usually restricted?
        )
        
        # 'result' has images. Each image has ._image_bytes or can be saved.
        # For an agent, we usually return a path to the file.
        # We should save it to a temporary location or the artifact directory.
        
        output_dir = "generated_images"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        generated_files = []
        for i, img in enumerate(result.images):
            # Create a filename based on prompt hash or timestamp
            import time
            timestamp = int(time.time())
            filename = f"{output_dir}/img_{timestamp}_{i}.png"
            
            img.save(filename)
            generated_files.append(os.path.abspath(filename))
            
        return {
            "status": "success",
            "files": generated_files,
            "message": f"Generated {len(generated_files)} images."
        }

    except Exception as e:
        log.error(f"{log_id} Generation failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Image generation failed: {str(e)}"
        }
