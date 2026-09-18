from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from ocr_pipeline import extract_ocr_blocks_and_declarations

app = FastAPI(title="MetriCheck AI — Perception Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "ocrProvider": "pillow-tesseract"}

@app.post("/analyze")
async def analyze_images(
    inspectionId: Optional[str] = Form("insp_001"),
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None)
):
    image_bytes_list: List[bytes] = []
    if files:
        for f in files:
            content = await f.read()
            if content:
                image_bytes_list.append(content)
    if file:
        content = await file.read()
        if content:
            image_bytes_list.append(content)

    if not image_bytes_list:
        raise HTTPException(status_code=400, detail="At least one image file is required for analysis.")

    result = extract_ocr_blocks_and_declarations(image_bytes_list)
    if result.get("error"):
        raise HTTPException(status_code=502, detail=result["error"])

    return {
        "analysisId": f"anl_{uuid.uuid4().hex[:12]}",
        "inspectionId": inspectionId,
        "status": "COMPLETED",
        "imageQuality": result.get("imageQuality"),
        "rawText": result.get("rawText"),
        "ocrBlocks": result.get("ocrBlocks"),
        "declarations": result.get("declarations")
    }
