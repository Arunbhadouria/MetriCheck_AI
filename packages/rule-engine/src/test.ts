import assert from 'node:assert';
import { test } from 'node:test';
import { RuleEngine } from './engine.js';
import { Declaration } from '@metricheck/shared-types';

test('Rule Engine - Rule 6(1)(a) Manufacturer Address Validation', () => {
  const passDecls: Declaration[] = [
    {
      id: 'd1',
      productId: 'p1',
      field: 'MANUFACTURER',
      rawValue: 'Tata Consumer Products Ltd.',
      normalizedValue: {},
      confidence: 0.98,
      sourceType: 'AI_OCR'
    },
    {
      id: 'd2',
      productId: 'p1',
      field: 'ADDRESS',
      rawValue: '12/B Industrial Area, Mumbai, Maharashtra, 400001',
      normalizedValue: {},
      confidence: 0.97,
      sourceType: 'AI_OCR'
    }
  ];

  const resultsPass = RuleEngine.evaluateAll(passDecls);
  const ruleA = resultsPass.find(r => r.ruleCode === 'RULE-6-1-A');
  assert.strictEqual(ruleA?.status, 'PASS');

  const failDecls: Declaration[] = [
    {
      id: 'd1',
      productId: 'p1',
      field: 'MANUFACTURER',
      rawValue: 'Annapurna Foods Pvt. Ltd.',
      normalizedValue: {},
      confidence: 0.94,
      sourceType: 'AI_OCR'
    },
    {
      id: 'd2',
      productId: 'p1',
      field: 'ADDRESS',
      rawValue: 'Indore',
      normalizedValue: {},
      confidence: 0.82,
      sourceType: 'AI_OCR'
    }
  ];

  const resultsFail = RuleEngine.evaluateAll(failDecls);
  const ruleAFail = resultsFail.find(r => r.ruleCode === 'RULE-6-1-A');
  assert.strictEqual(ruleAFail?.status, 'FAIL');
});
