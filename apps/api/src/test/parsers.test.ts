import assert from 'node:assert';
import { test } from 'node:test';

function parseMRP(text: string) {
  const match = text.match(/(?:mrp|m\.r\.p\.|rs\.?|₹)\s*[:\.-]?\s*(\d+(?:\.\d{1,2})?)/i);
  if (match) {
    return { amount: parseFloat(match[1]), currency: 'INR' };
  }
  return null;
}

function parseNetQuantity(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|ml|l|m|cm|pcs)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return { value: val, unit };
  }
  return null;
}

test('MRP Parser Formats', () => {
  assert.deepStrictEqual(parseMRP('MRP ₹100.00'), { amount: 100, currency: 'INR' });
  assert.deepStrictEqual(parseMRP('M.R.P. Rs 52'), { amount: 52, currency: 'INR' });
  assert.deepStrictEqual(parseMRP('Maximum Retail Price: ₹28.50'), { amount: 28.5, currency: 'INR' });
});

test('Net Quantity Parser Formats', () => {
  assert.deepStrictEqual(parseNetQuantity('500 g'), { value: 500, unit: 'g' });
  assert.deepStrictEqual(parseNetQuantity('1 kg'), { value: 1, unit: 'kg' });
  assert.deepStrictEqual(parseNetQuantity('750 ml'), { value: 750, unit: 'ml' });
});
