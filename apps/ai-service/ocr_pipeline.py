import io
import json
import os
from typing import Any, Dict, List

from google import genai
from google.genai import types
from PIL import Image


def _load_env_file(*paths: str) -> None:
    """Minimal .env loader — no third-party dependencies required."""
    for env_path in paths:
        try:
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = value
            break  # stop after first file found
        except FileNotFoundError:
            continue


# Try ai-service/.env first, then monorepo root .env
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR = os.path.join(_THIS_DIR, "..", "..")
_load_env_file(
    os.path.join(_THIS_DIR, ".env"),
    os.path.join(_ROOT_DIR, ".env"),
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def check_image_quality(image: Image.Image) -> Dict[str, Any]:
    width, height = image.size
    if width < 300 or height < 200:
        return {"status": "UNUSABLE", "message": "Image resolution too low for OCR", "blurScore": 0.1}

    histogram = image.convert("L").histogram()
    pixels = sum(histogram)
    average_brightness = sum(index * count for index, count in enumerate(histogram)) / (pixels or 1)
    if average_brightness < 30:
        return {"status": "POOR", "message": "Image is too dark. Increase lighting.", "blurScore": 0.3}
    if average_brightness > 230:
        return {"status": "POOR", "message": "Image is overexposed.", "blurScore": 0.3}
    return {"status": "GOOD", "message": "High quality image frame", "blurScore": 0.95}


def extract_ocr_blocks_and_declarations(image_bytes_input: Any) -> Dict[str, Any]:
    """Extract package declarations with Gemini across one or multiple product photos."""
    if isinstance(image_bytes_input, list):
        bytes_list = image_bytes_input
    else:
        bytes_list = [image_bytes_input]

    images: List[Image.Image] = []
    for b in bytes_list:
        try:
            img = Image.open(io.BytesIO(b))
            img.load()
            images.append(img)
        except Exception:
            continue

    if not images:
        return {"error": "No valid image formats provided."}

    quality = check_image_quality(images[0])
    if not GEMINI_API_KEY:
        return {
            "error": "GEMINI_API_KEY is not configured for the OCR service.",
            "imageQuality": quality,
            "rawText": None,
            "ocrBlocks": [],
            "declarations": [],
        }

    from PIL import ImageEnhance, ImageOps

    # Optimize & Enhance images (autocontrast + sharpness boost + max 1600px resolution) for ultra-precise text OCR
    optimized_images: List[Image.Image] = []
    for img in images:
        if img.mode != "RGB":
            img = img.convert("RGB")

        # 1. Resize to optimal OCR resolution (max 1600px) maintaining high text crispness
        max_dim = 1600
        if max(img.width, img.height) > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # 2. Auto-Contrast: removes glare, shiny foil reflections, and dim shadows
        try:
            img = ImageOps.autocontrast(img, cutoff=1)
        except Exception:
            pass

        # 3. Sharpness boost: sharpens small printed text (MRP, MFG dates, addresses)
        try:
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.8)
        except Exception:
            pass

        optimized_images.append(img)

    prompt = """
You are a High-Precision Statutory Legal Metrology Vision OCR Engine under the Legal Metrology (Packaged Commodities) Rules, 2011.
Examine all provided product package images (Front Label, Back Artwork, MRP tag, Nutrition panel, Side/Bottom panels).

Perform a detailed inspection:
1. Scan every printed word, fine print, text boxes, and statutory declarations.
2. Return a SINGLE JSON object with the exact extracted statutory legal metrology fields:
   - "PRODUCT_NAME": The generic or trade product name (e.g. "Pancake & Waffle Mix").
   - "MRP": The retail price. If "MRP:" or "Inclusive of all taxes" is printed but NO numeric amount is filled in (blank price), return "BLANK_PRICE_UNDECLARED". If not found at all, return null.
   - "NET_QUANTITY": Net quantity with metric unit (e.g. "500g", "1 kg").
   - "MFG_DATE": Date of packaging or manufacture ("PKD:"). If "PKD:" or "Mfg Date:" is printed but blank/unfilled, return "BLANK_DATE_UNDECLARED". If not found, return null.
   - "EXPIRY_DATE": Expiry date or best before statement (e.g. "Best before 6 months from packaging").
   - "BATCH_NUMBER": Batch or lot number ("Batch No:"). If "Batch No:" is printed but blank/unfilled, return "BLANK_BATCH_UNDECLARED". If not found, return null.
   - "MANUFACTURER": Name of manufacturer, packer, or distributor. If placeholder text like "Lorem ipsum" or template artwork copy is used, extract it verbatim.
   - "ADDRESS": Complete postal address with city, state, pin code. Extract placeholder text verbatim if present.
   - "CONSUMER_CARE": Consumer care phone number or email address (e.g. "support@packagingseller.com").
   - "COUNTRY_OF_ORIGIN": Country of origin if stated.
   - "RAW_TEXT_DUMP": Concatenated dump of all readable text on the package artwork.

{
  "PRODUCT_NAME": "product name or null",
  "MRP": "numeric price with currency or BLANK_PRICE_UNDECLARED or null",
  "NET_QUANTITY": "net quantity with unit or null",
  "MFG_DATE": "date or BLANK_DATE_UNDECLARED or null",
  "EXPIRY_DATE": "expiry/best-before or null",
  "BATCH_NUMBER": "batch/lot or BLANK_BATCH_UNDECLARED or null",
  "MANUFACTURER": "name or null",
  "ADDRESS": "address or null",
  "CONSUMER_CARE": "consumer care details or null",
  "COUNTRY_OF_ORIGIN": "country or null",
  "RAW_TEXT_DUMP": "all recognized text"
}
"""
    import time
    last_error = None
    data = None

    # Multi-model fallback list: prioritize fast responsive models, fallback if 503 spike occurs
    candidate_models = []
    primary = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    for m in [primary, "gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"]:
        if m and m not in candidate_models:
            candidate_models.append(m)

    for model_name in candidate_models:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            contents = [*optimized_images, prompt]
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.0),
            )
            data = json.loads(response.text)
            if isinstance(data, dict):
                break
        except Exception as error:
            last_error = error
            time.sleep(0.5)

    if data is None or not isinstance(data, dict):
        return {
            "error": f"Gemini OCR request failed across models {candidate_models}: {last_error}",
            "imageQuality": quality,
            "rawText": None,
            "ocrBlocks": [],
            "declarations": [],
        }

    declarations: List[Dict[str, Any]] = []
    target_fields = (
        "PRODUCT_NAME",
        "MRP",
        "NET_QUANTITY",
        "MFG_DATE",
        "EXPIRY_DATE",
        "BATCH_NUMBER",
        "MANUFACTURER",
        "ADDRESS",
        "CONSUMER_CARE",
        "COUNTRY_OF_ORIGIN",
    )
    for field in target_fields:
        value = data.get(field)
        if value and str(value).strip().lower() != "null":
            declarations.append({
                "field": field,
                "rawValue": str(value).strip(),
                "normalizedValue": {},
                "confidence": 0.95,
                "bbox": {"x": 0, "y": 0, "width": images[0].width, "height": images[0].height},
            })

    return {
        "imageQuality": quality,
        "rawText": json.dumps(data),
        "ocrBlocks": [],
        "declarations": declarations,
    }
