import re
from typing import Dict, Any, Optional

def parse_mrp(text: str) -> Optional[Dict[str, Any]]:
    match = re.search(r'(?:mrp|m\.r\.p\.|rs\.?|₹)\s*[:\.-]?\s*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE)
    if match:
        try:
            val = float(match.group(1))
            return {"amount": val, "currency": "INR", "raw": text}
        except ValueError:
            pass
    return None

def parse_net_quantity(text: str) -> Optional[Dict[str, Any]]:
    match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|ml|l|liter|litre|pcs|count|m|cm)\b', text, re.IGNORECASE)
    if match:
        val = float(match.group(1))
        unit = match.group(2).lower()
        if unit in ['g', 'gm', 'gram']:
            base_val = val
            base_unit = 'g'
        elif unit == 'kg':
            base_val = val * 1000
            base_unit = 'g'
        elif unit in ['ml']:
            base_val = val
            base_unit = 'ml'
        elif unit in ['l', 'liter', 'litre']:
            base_val = val * 1000
            base_unit = 'ml'
        else:
            base_val = val
            base_unit = unit
        return {"value": val, "unit": unit, "baseValue": base_val, "baseUnit": base_unit, "raw": text}
    return None
