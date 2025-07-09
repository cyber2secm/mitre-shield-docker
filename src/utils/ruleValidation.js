// Validation utility for detection rules
export const PLATFORMS = ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Containers'];
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
export const RULE_TYPES = ['Product', 'SOC'];

export const TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command and Control',
  'Exfiltration', 'Impact', 'AI Model Access', 'AI Attack Staging'
];

// MITRE ATT&CK Technique ID pattern
const TECHNIQUE_ID_PATTERN = /^T\d{4}(\.\d{3})?$/;

export function validateRule(rule, index) {
  const errors = [];
  const warnings = [];

  // Required field validation
  if (!rule.rule_id || rule.rule_id.trim() === '') {
    errors.push('Rule ID is required');
  } else {
    // Rule ID format validation
    if (rule.rule_id.length < 3) {
      warnings.push('Rule ID should be more descriptive (recommended: 5+ characters)');
    }
    if (!/^[A-Z0-9_-]+$/i.test(rule.rule_id)) {
      warnings.push('Rule ID should only contain letters, numbers, hyphens, and underscores');
    }
  }

  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  } else {
    if (rule.name.length < 5) {
      warnings.push('Rule name should be more descriptive (recommended: 10+ characters)');
    }
  }

  if (!rule.technique_id || rule.technique_id.trim() === '') {
    errors.push('Technique ID is required');
  } else {
    if (!TECHNIQUE_ID_PATTERN.test(rule.technique_id)) {
      errors.push('Technique ID must follow MITRE format (e.g., T1059 or T1059.001)');
    }
  }

  if (!rule.platform || rule.platform.trim() === '') {
    errors.push('Platform is required');
  } else {
    if (!PLATFORMS.includes(rule.platform)) {
      errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
    }
  }

  if (!rule.tactic || rule.tactic.trim() === '') {
    errors.push('Tactic is required');
  } else {
    if (!TACTICS.includes(rule.tactic)) {
      warnings.push(`Tactic "${rule.tactic}" is not a standard MITRE ATT&CK tactic. Consider using: ${TACTICS.join(', ')}`);
    }
  }

  // XQL query validation completely removed - no validation whatsoever
  // Users can upload any XQL query content (or empty)

  if (!rule.severity || rule.severity.trim() === '') {
    errors.push('Severity is required');
  } else {
    if (!SEVERITIES.includes(rule.severity)) {
      errors.push(`Severity must be one of: ${SEVERITIES.join(', ')}`);
    }
  }

  if (!rule.rule_type || rule.rule_type.trim() === '') {
    errors.push('Rule type is required');
  } else {
    if (!RULE_TYPES.includes(rule.rule_type)) {
      errors.push(`Rule type must be one of: ${RULE_TYPES.join(', ')}`);
    }
  }

  // Optional field validation
  if (rule.description && rule.description.length < 10) {
    warnings.push('Description should be more detailed for better documentation');
  }

  // User assignment validation (optional)
  if (rule.user && rule.user.trim() === '') {
    warnings.push('User field is empty - consider assigning to a team member');
  }

  return {
    ...rule,
    errors,
    warnings,
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0
  };
}

export function validateRules(rules) {
  const validatedRules = rules.map((rule, index) => validateRule(rule, index));
  
  // Check for duplicate rule IDs
  const ruleIds = new Set();
  const duplicates = new Set();
  
  validatedRules.forEach(rule => {
    if (rule.rule_id) {
      if (ruleIds.has(rule.rule_id)) {
        duplicates.add(rule.rule_id);
      } else {
        ruleIds.add(rule.rule_id);
      }
    }
  });

  // Add duplicate errors
  if (duplicates.size > 0) {
    validatedRules.forEach(rule => {
      if (duplicates.has(rule.rule_id)) {
        rule.errors.push(`Duplicate rule ID: ${rule.rule_id} appears multiple times in the import`);
        rule.isValid = false;
      }
    });
  }

  // Separate into categories
  const valid = validatedRules.filter(rule => rule.isValid && !rule.hasWarnings);
  const warnings = validatedRules.filter(rule => rule.isValid && rule.hasWarnings);
  const invalid = validatedRules.filter(rule => !rule.isValid);

  return {
    valid,
    warnings,
    invalid,
    summary: {
      total: validatedRules.length,
      validCount: valid.length,
      warningCount: warnings.length,
      invalidCount: invalid.length,
      duplicateCount: duplicates.size
    }
  };
}

export function generateValidationReport(validationResults) {
  const { summary } = validationResults;
  
  const report = [
    `Validation Report`,
    `================`,
    `Total rules processed: ${summary.total}`,
    `✅ Valid rules: ${summary.validCount}`,
    `⚠️  Rules with warnings: ${summary.warningCount}`,
    `❌ Invalid rules: ${summary.invalidCount}`,
    ``
  ];

  if (summary.duplicateCount > 0) {
    report.push(`🔄 Duplicate rule IDs found: ${summary.duplicateCount}`);
    report.push(``);
  }

  const canImport = summary.validCount + summary.warningCount;
  if (canImport > 0) {
    report.push(`📥 Ready to import: ${canImport} rules`);
  } else {
    report.push(`❌ No rules are ready for import. Please fix the validation errors.`);
  }

  return report.join('\n');
} 