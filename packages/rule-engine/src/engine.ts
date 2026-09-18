import { Declaration } from '@metricheck/shared-types';
import { EvaluatedRuleResult, RULES, RULESET_SOURCE, RULESET_VERSION } from './rules.js';

export class RuleEngine {
  public static getVersion(): string {
    return RULESET_VERSION;
  }

  public static getSourceReference(): string {
    return RULESET_SOURCE;
  }

  public static evaluateAll(declarations: Declaration[]): EvaluatedRuleResult[] {
    return RULES.map(rule => rule.evaluate(declarations));
  }
}
