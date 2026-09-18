from typing import Dict, Any, List

DEMO_PRODUCT_FIXTURES: Dict[str, Dict[str, Any]] = {
    "ANNAPURNA_CHILLI": {
        "productName": "Annapurna Chilli Powder",
        "brand": "Annapurna",
        "category": "Packaged Food",
        "ocrBlocks": [
            {
                "id": "ocr_1",
                "text": "Annapurna Chilli Powder",
                "confidence": 0.98,
                "bbox": {"x": 120, "y": 80, "width": 320, "height": 45}
            },
            {
                "id": "ocr_2",
                "text": "MRP ₹52.00 (Incl. of all taxes)",
                "confidence": 0.96,
                "bbox": {"x": 140, "y": 240, "width": 280, "height": 35}
            },
            {
                "id": "ocr_3",
                "text": "Net Quantity: 500 g",
                "confidence": 0.97,
                "bbox": {"x": 140, "y": 290, "width": 220, "height": 32}
            },
            {
                "id": "ocr_4",
                "text": "Mfg Date: 02/08/2026",
                "confidence": 0.95,
                "bbox": {"x": 140, "y": 340, "width": 200, "height": 30}
            },
            {
                "id": "ocr_5",
                "text": "Expiry Date: 01/02/2027",
                "confidence": 0.95,
                "bbox": {"x": 140, "y": 380, "width": 210, "height": 30}
            },
            {
                "id": "ocr_6",
                "text": "Packed by: Annapurna Foods Pvt. Ltd.",
                "confidence": 0.94,
                "bbox": {"x": 140, "y": 440, "width": 340, "height": 35}
            },
            {
                "id": "ocr_7",
                "text": "Address: Indore, Madhya Pradesh",
                "confidence": 0.82,
                "bbox": {"x": 140, "y": 480, "width": 310, "height": 32}
            }
        ],
        "declarations": [
            {
                "field": "PRODUCT_NAME",
                "rawValue": "Annapurna Chilli Powder",
                "normalizedValue": {"name": "Annapurna Chilli Powder"},
                "confidence": 0.98
            },
            {
                "field": "MRP",
                "rawValue": "MRP ₹52.00",
                "normalizedValue": {"amount": 52.0, "currency": "INR"},
                "confidence": 0.96
            },
            {
                "field": "NET_QUANTITY",
                "rawValue": "500 g",
                "normalizedValue": {"value": 500, "unit": "g", "baseValue": 500, "baseUnit": "g"},
                "confidence": 0.97
            },
            {
                "field": "MFG_DATE",
                "rawValue": "02/08/2026",
                "normalizedValue": {"month": 8, "year": 2026},
                "confidence": 0.95
            },
            {
                "field": "EXPIRY_DATE",
                "rawValue": "01/02/2027",
                "normalizedValue": {"month": 2, "year": 2027},
                "confidence": 0.95
            },
            {
                "field": "MANUFACTURER",
                "rawValue": "Annapurna Foods Pvt. Ltd.",
                "normalizedValue": {"name": "Annapurna Foods Pvt. Ltd."},
                "confidence": 0.94
            },
            {
                "field": "ADDRESS",
                "rawValue": "Indore, Madhya Pradesh",
                "normalizedValue": {"address": "Indore, Madhya Pradesh", "isComplete": False},
                "confidence": 0.82
            }
        ]
    },
    "TATA_SALT": {
        "productName": "Tata Salt 1 kg",
        "brand": "Tata",
        "category": "Packaged Food",
        "ocrBlocks": [
            {
                "id": "ocr_10",
                "text": "Tata Salt 1 kg",
                "confidence": 0.99,
                "bbox": {"x": 100, "y": 100, "width": 300, "height": 50}
            },
            {
                "id": "ocr_11",
                "text": "MRP ₹28.00 (Incl. of all taxes)",
                "confidence": 0.98,
                "bbox": {"x": 120, "y": 200, "width": 260, "height": 35}
            },
            {
                "id": "ocr_12",
                "text": "Packed by: Tata Consumer Products Ltd., 12/B Industrial Area, Mumbai 400001",
                "confidence": 0.97,
                "bbox": {"x": 120, "y": 300, "width": 400, "height": 60}
            }
        ],
        "declarations": [
            {
                "field": "PRODUCT_NAME",
                "rawValue": "Tata Salt",
                "normalizedValue": {"name": "Tata Salt"},
                "confidence": 0.99
            },
            {
                "field": "MRP",
                "rawValue": "MRP ₹28.00",
                "normalizedValue": {"amount": 28.0, "currency": "INR"},
                "confidence": 0.98
            },
            {
                "field": "NET_QUANTITY",
                "rawValue": "1 kg",
                "normalizedValue": {"value": 1, "unit": "kg", "baseValue": 1000, "baseUnit": "g"},
                "confidence": 0.99
            },
            {
                "field": "MFG_DATE",
                "rawValue": "01/06/2026",
                "normalizedValue": {"month": 6, "year": 2026},
                "confidence": 0.96
            },
            {
                "field": "MANUFACTURER",
                "rawValue": "Tata Consumer Products Ltd.",
                "normalizedValue": {"name": "Tata Consumer Products Ltd."},
                "confidence": 0.97
            },
            {
                "field": "ADDRESS",
                "rawValue": "12/B Industrial Area, Mumbai, Maharashtra, 400001",
                "normalizedValue": {"address": "12/B Industrial Area, Mumbai, Maharashtra, 400001", "isComplete": True},
                "confidence": 0.97
            }
        ]
    }
}
