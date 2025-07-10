# Multi-Platform Rule Import Feature

## Overview

The MITRE Shield application now supports automatic splitting of detection rules that target multiple platforms. When importing rules via CSV, any rule with comma-separated platforms will be automatically split into individual rules for each platform.

## How It Works

### Before (Single Rule)
```csv
rule_id,name,platform,tactic,technique_id
SOC-001,PowerShell Detection,"Windows,macOS,Linux",Execution,T1059.001
```

### After (Split into Multiple Rules)
The system automatically creates:
1. `SOC-001` - PowerShell Detection (Windows) - Platform: Windows
2. `SOC-001-MACOS` - PowerShell Detection (macOS) - Platform: macOS  
3. `SOC-001-LINUX` - PowerShell Detection (Linux) - Platform: Linux

## Features

### ✅ **Automatic Platform Detection**
- Detects comma-separated platform values in the `platform` field
- Splits rules automatically during CSV import
- Preserves all other rule details (tactic, technique_id, severity, etc.)

### ✅ **Unique Rule ID Generation**
- First platform keeps the original rule ID
- Additional platforms get suffixed rule IDs (e.g., `SOC-001-MACOS`)
- Prevents rule ID conflicts

### ✅ **Platform Validation**
- Validates all platforms against the supported platform list
- Skips invalid platforms with warnings
- Provides clear error messages

### ✅ **Descriptive Naming**
- Appends platform name to rule names for clarity
- Example: "PowerShell Detection" becomes "PowerShell Detection (Windows)"

## Supported Platforms

The following platforms are supported for splitting:
- `Windows`
- `macOS` 
- `Linux`
- `AWS`
- `Azure`
- `GCP`
- `Oracle`
- `Alibaba`
- `Containers`
- `Office Suite`
- `Identity Provider`
- `SaaS`
- `IaaS`

## CSV Format Examples

### Multi-Cloud Rule
```csv
rule_id,name,description,technique_id,platform,tactic,status,severity,rule_type
SOC-2850,Cloud Account Discovery,Detects account enumeration,T1087.004,"AWS,Azure,GCP",Discovery,Active,Medium,SOC
```

**Result**: Creates 3 separate rules (SOC-2850, SOC-2850-AZURE, SOC-2850-GCP)

### Cross-Platform Rule
```csv
rule_id,name,description,technique_id,platform,tactic,status,severity,rule_type
SOC-2851,Process Injection Detection,Detects process injection,T1055,"Windows,Linux",Defense Evasion,Testing,High,SOC
```

**Result**: Creates 2 separate rules (SOC-2851, SOC-2851-LINUX)

### Single Platform Rule (No Change)
```csv
rule_id,name,description,technique_id,platform,tactic,status,severity,rule_type
SOC-2852,Windows Credential Dumping,Detects mimikatz usage,T1003,Windows,Credential Access,Active,Critical,SOC
```

**Result**: Creates 1 rule as normal (SOC-2852)

## Import Process

1. **Upload CSV** - Upload your CSV file with multi-platform rules
2. **Automatic Processing** - System detects comma-separated platforms
3. **Rule Splitting** - Creates individual rules for each platform
4. **Validation** - Validates platform names and rule structure
5. **Import Confirmation** - Shows expansion summary (e.g., "3 original rules → 7 final rules")

## Benefits

### 🎯 **Improved Organization**
- Platform-specific rules are easier to manage
- Better filtering and searching capabilities
- Clear platform association

### 🔄 **Bulk Management**
- Import rules for multiple platforms at once
- Reduces manual rule creation effort
- Maintains consistency across platforms

### 📊 **Better Analytics**
- Platform-specific rule statistics
- Improved coverage analysis
- Enhanced reporting capabilities

### 🛠️ **Flexible Import**
- Mix single-platform and multi-platform rules in same CSV
- Automatic handling without manual intervention
- Preserves existing single-platform import functionality

## Error Handling

### Invalid Platforms
```
⚠️ Invalid platforms found in rule SOC-001: InvalidPlatform
✅ Valid platforms are: Windows, macOS, Linux, AWS, Azure, GCP, Oracle, Alibaba, Containers, Office Suite, Identity Provider, SaaS, IaaS
⚠️ Skipping invalid platform: InvalidPlatform
```

### Import Summary
```
📊 After platform processing: 3 original rules → 7 final rules
✅ Created platform-specific rule: SOC-001-MACOS for macOS
✅ Created platform-specific rule: SOC-001-LINUX for Linux
```

## Usage Tips

1. **Use Descriptive Names**: Original rule names should be generic enough to apply to all platforms
2. **Platform Consistency**: Use exact platform names as listed in the supported platforms
3. **Rule ID Planning**: Consider rule ID structure for multi-platform rules
4. **Testing**: Start with a small CSV to test the functionality

## API Response

The bulk import API now returns additional statistics:

```json
{
  "success": true,
  "message": "7 rules created successfully", 
  "data": [...],
  "stats": {
    "created": 7,
    "total": 7,
    "originalRules": 3,
    "expandedRules": 7
  }
}
```

## Backwards Compatibility

- ✅ Existing single-platform CSV imports work unchanged
- ✅ No changes required to existing rule management workflows  
- ✅ All existing API endpoints remain functional
- ✅ Frontend rule editing and management unchanged 