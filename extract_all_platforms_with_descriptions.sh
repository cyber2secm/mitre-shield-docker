#!/bin/bash

# Enhanced MITRE ATT&CK Platform Extraction Script
# Extracts all platforms with full technique descriptions
# Excludes AI platform as requested

echo "🚀 Starting enhanced MITRE data extraction for all platforms..."
echo "📖 This will fetch individual technique descriptions and may take several hours"
echo "⚠️ AI platform will NOT be touched as requested"

# Define platforms to extract (excluding AI)
PLATFORMS=(
    "windows"
    "macos" 
    "linux"
    "cloud"
    "containers"
    "officesuite"
    "identity_provider"
    "saas"
    "iaas"
    "network_devices"
)

TOTAL=${#PLATFORMS[@]}
CURRENT=0
SUCCESS=0
FAILED=()

echo "📋 Will process ${TOTAL} platforms: ${PLATFORMS[*]}"
echo ""

# Function to extract platform data
extract_platform() {
    local platform=$1
    local current=$2
    local total=$3
    
    echo ""
    echo "======================================================================"
    echo "🎯 [$current/$total] Processing platform: ${platform^^}"
    echo "======================================================================"
    
    echo "📊 Extracting ${platform} techniques with descriptions..."
    echo "🔄 Running: python3 mitre_data_extractor.py $platform mitreshire --descriptions"
    
    if python3 mitre_data_extractor.py "$platform" mitreshire --descriptions; then
        echo "✅ Successfully extracted $platform platform"
        
        # Check if file was created and has descriptions
        local filename="mitreshire_${platform}_techniques.json"
        if [[ -f "$filename" ]]; then
            local desc_count=$(grep -c '"description": "[^"]' "$filename" 2>/dev/null || echo "0")
            local total_count=$(grep -c '"technique_id"' "$filename" 2>/dev/null || echo "0")
            echo "📊 Generated $total_count techniques, $desc_count with descriptions"
            
            if [[ $desc_count -gt 0 ]]; then
                echo "✅ Descriptions successfully fetched for $platform"
                return 0
            else
                echo "⚠️ No descriptions found for $platform"
                return 1
            fi
        else
            echo "❌ Output file not found for $platform"
            return 1
        fi
    else
        echo "❌ Extraction failed for $platform"
        return 1
    fi
}

# Process each platform
for platform in "${PLATFORMS[@]}"; do
    ((CURRENT++))
    
    if extract_platform "$platform" "$CURRENT" "$TOTAL"; then
        ((SUCCESS++))
    else
        FAILED+=("$platform")
    fi
    
    # Add delay between platforms to be respectful to MITRE servers
    if [[ $CURRENT -lt $TOTAL ]]; then
        echo "⏳ Waiting 30 seconds before next platform..."
        sleep 30
    fi
done

# Print summary
echo ""
echo "======================================================================"
echo "📊 ENHANCED MITRE EXTRACTION SUMMARY"
echo "======================================================================"
echo "✅ Successful extractions: $SUCCESS/$TOTAL"
echo "❌ Failed extractions: ${#FAILED[@]}"

if [[ ${#FAILED[@]} -gt 0 ]]; then
    echo "❌ Failed platforms: ${FAILED[*]}"
else
    echo "🎉 All platforms extracted successfully!"
fi

echo ""
echo "📝 Next steps:"
echo "1. Review the generated JSON files"
echo "2. Import them using: node import_enhanced_mitre.cjs"
echo "3. Verify descriptions in the frontend"
echo ""

if [[ ${#FAILED[@]} -gt 0 ]]; then
    echo "⚠️ Some platforms failed. You may want to retry them individually."
    exit 1
else
    echo "✅ All extractions completed successfully!"
    echo "💡 AI platform was preserved as requested"
    exit 0
fi 