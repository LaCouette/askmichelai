import os
import base64
import requests
from dotenv import load_dotenv
from PIL import Image
import io

# Load environment variables
load_dotenv()

class ImageAnalyzer:
    """Class to analyze images using Claude via OpenRouter."""
    
    def __init__(self):
        """Initialize the image analyzer."""
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        
        if not self.api_key:
            print("WARNING: OPENROUTER_API_KEY not found in environment variables.")
    
    def encode_image(self, image_path):
        """Encode image to base64 for API request."""
        try:
            # Open and resize image if necessary
            img = Image.open(image_path)
            
            # If image is too large, resize it
            max_size = 1600  # Maximum dimension
            if max(img.width, img.height) > max_size:
                if img.width > img.height:
                    new_width = max_size
                    new_height = int(img.height * (max_size / img.width))
                else:
                    new_height = max_size
                    new_width = int(img.width * (max_size / img.height))
                
                img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # Convert to RGB if necessary
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            # Save to buffer
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            buffer.seek(0)
            
            # Encode to base64
            base64_image = base64.b64encode(buffer.read()).decode("utf-8")
            return base64_image
            
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    
    def analyze_shopify_section(self, image_path, additional_prompt=""):
        """Analyze a Shopify section image and return the visual structure description."""
        if not self.api_key:
            return "Image analysis unavailable. API key not configured."
        
        base64_image = self.encode_image(image_path)
        if not base64_image:
            return "Failed to process the image."
        
        prompt = """
Analyze this image of a Shopify section and describe its structure in detail. Focus on:

1. Layout - Identify the column structure, grid system, and overall component arrangement
2. Visual hierarchy - Describe the prominence of elements
3. UI components - Identify headers, buttons, cards, images, text blocks, etc.
4. Responsive considerations - Note any elements that might change in mobile view

This analysis will be used to code a custom Shopify Liquid section that resembles this design.

IMPORTANT: DO NOT use Liquid syntax with curly braces in your response. Avoid examples with {{ or }} syntax.
"""
        
        if additional_prompt:
            prompt += f"\n\nAdditional context: {additional_prompt}"
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://shopify-section-creator.example.com",  # OpenRouter requires this
                "X-Title": "Shopify Section Creator" # Optional site title
            }
            
            payload = {
                "model": "anthropic/claude-3.7-sonnet",  # Use Claude 3.7 Sonnet consistent with agent.py
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ]
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            analysis_text = result["choices"][0]["message"]["content"]
            
            # Escape any Liquid-style curly braces to prevent issues
            # Use double braces for escaping, consistent with f-string/template escaping
            analysis_text = analysis_text.replace("{{", "{{{{").replace("}}", "}}}}")
            
            return analysis_text
            
        except Exception as e:
            print(f"Error analyzing image: {e}")
            return f"Failed to analyze the image. Error: {str(e)}"