import { ComplianceStatus, Declaration, RuleSeverity } from '@metricheck/shared-types';

export interface EvaluatedRuleResult {
  ruleCode: string;
  ruleTitle: string;
  sourceReference: string;
  status: ComplianceStatus;
  severity: RuleSeverity;
  message: string;
  observedValue?: unknown;
  expectedValue?: unknown;
  confidence?: number;
  evidenceIds: string[];
}

export interface RuleDefinition {
  code: string;
  title: string;
  sourceReference: string;
  severity: RuleSeverity;
  evaluate: (declarations: Declaration[]) => EvaluatedRuleResult;
}

export const RULESET_VERSION = '2026.01';
export const RULESET_SOURCE = 'Legal Metrology (Packaged Commodities) Rules, 2011 (Amended through 2026)';

export const RULES: RuleDefinition[] = [
  {
    code: 'RULE-6-1-A',
    title: 'Manufacturer / Packer / Importer Identity & Address',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)',
    severity: 'HIGH',
    evaluate: (declarations) => {
      const mfg = declarations.find(d => d.field === 'MANUFACTURER' || (d.field as string) === 'MANUFACTURER_NAME');
      const addr = declarations.find(d => d.field === 'ADDRESS');

      const mfgRaw = String(mfg?.rawValue || '').trim();
      const addrRaw = String(addr?.rawValue || '').trim();
      const combinedText = `${mfgRaw} ${addrRaw}`.toLowerCase();

      // Check for fictitious or template placeholder artwork copy (e.g. Lorem Ipsum)
      if (/lorem\s*ipsum|dolor\s*sit|consectetur|packagingseller|placeholder|dummy\s*address|sample\s*address/i.test(combinedText)) {
        return {
          ruleCode: 'RULE-6-1-A',
          ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
          sourceReference: 'Rule 6(1)(a)',
          status: 'FAIL',
          severity: 'CRITICAL',
          message: `Fictitious or dummy placeholder text detected ("${mfgRaw.slice(0, 40)}...") in place of registered manufacturer name and address.`,
          observedValue: { manufacturer: mfgRaw, address: addrRaw },
          expectedValue: 'Registered company name and full postal address including city, state, and 6-digit PIN code',
          evidenceIds: [mfg?.id, addr?.id].filter(Boolean) as string[]
        };
      }

      const isMfgMissing = !mfg || !mfgRaw || mfgRaw === 'Not Detected' || mfgRaw === 'null';
      const isAddrMissing = !addr || !addrRaw || addrRaw === 'Not Detected' || addrRaw === 'null';

      if (isMfgMissing && isAddrMissing) {
        return {
          ruleCode: 'RULE-6-1-A',
          ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
          sourceReference: 'Rule 6(1)(a)',
          status: 'FAIL',
          severity: 'HIGH',
          message: 'Manufacturer identity and complete address declarations were not detected on package.',
          evidenceIds: []
        };
      }

      if (!isMfgMissing && isAddrMissing) {
        return {
          ruleCode: 'RULE-6-1-A',
          ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
          sourceReference: 'Rule 6(1)(a)',
          status: 'FAIL',
          severity: 'HIGH',
          message: `Manufacturer name detected ("${mfgRaw}") but complete postal address is missing or undeclared.`,
          observedValue: { manufacturer: mfgRaw, address: null },
          expectedValue: 'Complete name and full postal address including city, state, pin code',
          evidenceIds: mfg ? [mfg.id] : []
        };
      }

      if (addrRaw.length < 10 || (!addrRaw.includes(',') && !/\d{6}/.test(addrRaw))) {
        return {
          ruleCode: 'RULE-6-1-A',
          ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
          sourceReference: 'Rule 6(1)(a)',
          status: 'FAIL',
          severity: 'HIGH',
          message: `Incomplete address provided: "${addrRaw}". Must contain full details (Premises, City, State, 6-digit PIN).`,
          observedValue: addrRaw,
          expectedValue: 'Full postal address including 6-digit PIN code',
          evidenceIds: addr ? [addr.id] : []
        };
      }

      const confidence = Math.min(mfg?.confidence ?? 1.0, addr?.confidence ?? 1.0);
      if (confidence < 0.7) {
        return {
          ruleCode: 'RULE-6-1-A',
          ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
          sourceReference: 'Rule 6(1)(a)',
          status: 'REVIEW_REQUIRED',
          severity: 'MEDIUM',
          message: 'Manufacturer and address detected but OCR extraction confidence is low. Inspector verification required.',
          observedValue: { manufacturer: mfgRaw, address: addrRaw },
          confidence,
          evidenceIds: [mfg?.id, addr?.id].filter(Boolean) as string[]
        };
      }

      return {
        ruleCode: 'RULE-6-1-A',
        ruleTitle: 'Manufacturer / Packer / Importer Identity & Address',
        sourceReference: 'Rule 6(1)(a)',
        status: 'PASS',
        severity: 'INFO',
        message: 'Manufacturer identity and address declaration satisfied.',
        observedValue: { manufacturer: mfgRaw, address: addrRaw },
        confidence,
        evidenceIds: [mfg?.id, addr?.id].filter(Boolean) as string[]
      };
    }
  },
  {
    code: 'RULE-6-1-B',
    title: 'Generic or Common Name of Commodity',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(b)',
    severity: 'MEDIUM',
    evaluate: (declarations) => {
      const nameDecl = declarations.find(d => d.field === 'PRODUCT_NAME');
      const raw = String(nameDecl?.rawValue || '').trim();

      if (!nameDecl || !raw || raw === 'Not Detected' || /scanned package|unknown/i.test(raw)) {
        return {
          ruleCode: 'RULE-6-1-B',
          ruleTitle: 'Generic or Common Name of Commodity',
          sourceReference: 'Rule 6(1)(b)',
          status: 'FAIL',
          severity: 'MEDIUM',
          message: 'Generic or common product name declaration not found or illegible.',
          evidenceIds: []
        };
      }
      return {
        ruleCode: 'RULE-6-1-B',
        ruleTitle: 'Generic or Common Name of Commodity',
        sourceReference: 'Rule 6(1)(b)',
        status: 'PASS',
        severity: 'INFO',
        message: `Product generic name declaration detected: "${raw}".`,
        observedValue: raw,
        confidence: nameDecl.confidence,
        evidenceIds: [nameDecl.id]
      };
    }
  },
  {
    code: 'RULE-6-1-C',
    title: 'Net Quantity Declaration & Standard Unit Compliance',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(c)',
    severity: 'CRITICAL',
    evaluate: (declarations) => {
      const qtyDecl = declarations.find(d => d.field === 'NET_QUANTITY');
      const raw = String(qtyDecl?.rawValue || '').trim();

      if (!qtyDecl || !raw || raw === 'Not Detected' || raw.toUpperCase().includes('UNDECLARED')) {
        return {
          ruleCode: 'RULE-6-1-C',
          ruleTitle: 'Net Quantity Declaration & Standard Unit Compliance',
          sourceReference: 'Rule 6(1)(c)',
          status: 'FAIL',
          severity: 'CRITICAL',
          message: 'Net quantity declaration is missing or undeclared.',
          evidenceIds: []
        };
      }

      const validUnits = ['g', 'kg', 'ml', 'l', 'cm', 'm', 'n', 'u', 'pcs', 'count', 'gram', 'grams', 'litre', 'litres'];
      const hasValidUnit = validUnits.some(u => new RegExp(`(^|\\d|\\s)${u}($|\\s|\\.)`, 'i').test(raw));

      if (!hasValidUnit) {
        return {
          ruleCode: 'RULE-6-1-C',
          ruleTitle: 'Net Quantity Declaration & Standard Unit Compliance',
          sourceReference: 'Rule 6(1)(c)',
          status: 'FAIL',
          severity: 'HIGH',
          message: `Net quantity "${raw}" does not use a prescribed standard metric unit (e.g. g, kg, ml, L, count).`,
          observedValue: raw,
          expectedValue: 'Standard metric unit (g, kg, ml, L, m, cm, count)',
          evidenceIds: [qtyDecl.id]
        };
      }

      return {
        ruleCode: 'RULE-6-1-C',
        ruleTitle: 'Net Quantity Declaration & Standard Unit Compliance',
        sourceReference: 'Rule 6(1)(c)',
        status: 'PASS',
        severity: 'INFO',
        message: `Net quantity compliant: ${raw}.`,
        observedValue: raw,
        confidence: qtyDecl.confidence,
        evidenceIds: [qtyDecl.id]
      };
    }
  },
  {
    code: 'RULE-6-1-D',
    title: 'Month and Year of Manufacture / Packing',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(d)',
    severity: 'HIGH',
    evaluate: (declarations) => {
      const mfgDate = declarations.find(d => d.field === 'MFG_DATE');
      const raw = String(mfgDate?.rawValue || '').trim();

      if (!mfgDate || !raw || raw === 'Not Detected' || raw.toUpperCase().includes('BLANK') || raw.toUpperCase().includes('UNDECLARED')) {
        return {
          ruleCode: 'RULE-6-1-D',
          ruleTitle: 'Month and Year of Manufacture / Packing',
          sourceReference: 'Rule 6(1)(d)',
          status: 'FAIL',
          severity: 'HIGH',
          message: 'Month and year of manufacture or pre-packing (PKD) is blank, unprinted, or undeclared.',
          evidenceIds: []
        };
      }
      return {
        ruleCode: 'RULE-6-1-D',
        ruleTitle: 'Month and Year of Manufacture / Packing',
        sourceReference: 'Rule 6(1)(d)',
        status: 'PASS',
        severity: 'INFO',
        message: `Month and year of manufacture/packing detected: ${raw}.`,
        observedValue: raw,
        confidence: mfgDate.confidence,
        evidenceIds: [mfgDate.id]
      };
    }
  },
  {
    code: 'RULE-6-1-E',
    title: 'Retail Sale Price / MRP Declaration (Inclusive of all taxes)',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)',
    severity: 'CRITICAL',
    evaluate: (declarations) => {
      const mrpDecl = declarations.find(d => d.field === 'MRP');
      const raw = String(mrpDecl?.rawValue || '').trim();

      if (!mrpDecl || !raw || raw === 'Not Detected' || raw.toUpperCase().includes('BLANK') || raw.toUpperCase().includes('UNDECLARED')) {
        return {
          ruleCode: 'RULE-6-1-E',
          ruleTitle: 'Retail Sale Price / MRP Declaration',
          sourceReference: 'Rule 6(1)(e)',
          status: 'FAIL',
          severity: 'CRITICAL',
          message: 'Maximum Retail Price (MRP) declaration is completely missing or blank on package.',
          expectedValue: 'MRP ₹XX.XX (Inclusive of all taxes)',
          observedValue: raw || 'Not Declared',
          evidenceIds: []
        };
      }

      // Check if a numerical price exists in the string (e.g. "₹52.00", "52", "Rs. 120")
      const hasPriceNumber = /\d+(\.\d{1,2})?/.test(raw);

      if (!hasPriceNumber) {
        return {
          ruleCode: 'RULE-6-1-E',
          ruleTitle: 'Retail Sale Price / MRP Declaration',
          sourceReference: 'Rule 6(1)(e)',
          status: 'FAIL',
          severity: 'CRITICAL',
          message: `Package displays "${raw}" without any actual numerical retail sale price printed. Price declaration is blank.`,
          observedValue: raw,
          expectedValue: 'Numerical price value in Indian Rupees (e.g. ₹50.00 Incl. of all taxes)',
          evidenceIds: [mrpDecl.id]
        };
      }

      // If price number exists, verify standard statutory prefix
      if (!/(mrp|m\.r\.p|retail|price|rs|₹)/i.test(raw)) {
        return {
          ruleCode: 'RULE-6-1-E',
          ruleTitle: 'Retail Sale Price / MRP Declaration',
          sourceReference: 'Rule 6(1)(e)',
          status: 'REVIEW_REQUIRED',
          severity: 'MEDIUM',
          message: `Numeric price detected (${raw}) but explicit "MRP" / "Inclusive of all taxes" prefix statement requires manual verification.`,
          observedValue: raw,
          confidence: mrpDecl.confidence,
          evidenceIds: [mrpDecl.id]
        };
      }

      return {
        ruleCode: 'RULE-6-1-E',
        ruleTitle: 'Retail Sale Price / MRP Declaration',
        sourceReference: 'Rule 6(1)(e)',
        status: 'PASS',
        severity: 'INFO',
        message: `Retail sale price (MRP) declaration compliant: ${raw}.`,
        observedValue: raw,
        confidence: mrpDecl.confidence,
        evidenceIds: [mrpDecl.id]
      };
    }
  },
  {
    code: 'RULE-6-1-F',
    title: 'Consumer Care Contact Details',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(f)',
    severity: 'MEDIUM',
    evaluate: (declarations) => {
      const ccDecl = declarations.find(d => d.field === 'CONSUMER_CARE');
      const raw = String(ccDecl?.rawValue || '').trim();

      if (!ccDecl || !raw || raw === 'Not Detected' || raw.toUpperCase().includes('UNDECLARED')) {
        return {
          ruleCode: 'RULE-6-1-F',
          ruleTitle: 'Consumer Care Contact Details',
          sourceReference: 'Rule 6(1)(f)',
          status: 'REVIEW_REQUIRED',
          severity: 'MEDIUM',
          message: 'Consumer care contact details not automatically detected. Inspector review recommended.',
          evidenceIds: []
        };
      }

      return {
        ruleCode: 'RULE-6-1-F',
        ruleTitle: 'Consumer Care Contact Details',
        sourceReference: 'Rule 6(1)(f)',
        status: 'PASS',
        severity: 'INFO',
        message: `Consumer care details detected: ${raw}.`,
        observedValue: raw,
        confidence: ccDecl.confidence,
        evidenceIds: [ccDecl.id]
      };
    }
  },
  {
    code: 'RULE-6-1-G',
    title: 'Batch, Lot, or Identification Code Number',
    sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(g)',
    severity: 'HIGH',
    evaluate: (declarations) => {
      const batchDecl = declarations.find(d => d.field === 'BATCH_NUMBER' || (d.field as string) === 'BATCH_NO');
      const raw = String(batchDecl?.rawValue || '').trim();

      if (!batchDecl || !raw || raw === 'Not Detected' || raw.toUpperCase().includes('BLANK') || raw.toUpperCase().includes('UNDECLARED')) {
        return {
          ruleCode: 'RULE-6-1-G',
          ruleTitle: 'Batch, Lot, or Identification Code Number',
          sourceReference: 'Rule 6(1)(g)',
          status: 'FAIL',
          severity: 'HIGH',
          message: 'Batch / Lot / Identification code number is blank or unprinted on package.',
          expectedValue: 'Alphanumeric batch or lot identifier (e.g. B.No. 4021)',
          observedValue: raw || 'Not Declared',
          evidenceIds: []
        };
      }

      return {
        ruleCode: 'RULE-6-1-G',
        ruleTitle: 'Batch, Lot, or Identification Code Number',
        sourceReference: 'Rule 6(1)(g)',
        status: 'PASS',
        severity: 'INFO',
        message: `Batch / Lot number detected: ${raw}.`,
        observedValue: raw,
        confidence: batchDecl.confidence,
        evidenceIds: [batchDecl.id]
      };
    }
  }
];
