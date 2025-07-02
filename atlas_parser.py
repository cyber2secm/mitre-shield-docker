#!/usr/bin/env python3
"""
ATLAS Framework Parser
Parses the ATLAS YAML data and displays a comprehensive summary
"""

import requests
import yaml
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_atlas_yaml():
    """Fetch ATLAS data from GitHub"""
    url = "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/ATLAS.yaml"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Error fetching ATLAS data: {e}")
        return None

def parse_atlas_data(yaml_content):
    """Parse ATLAS YAML data and extract key information"""
    try:
        data = yaml.safe_load(yaml_content)
        return data
    except yaml.YAMLError as e:
        print(f"❌ Error parsing YAML: {e}")
        return None

def display_atlas_summary(data):
    """Display comprehensive summary of ATLAS data"""
    if not data:
        return
    
    print("🚀 ATLAS FRAMEWORK EXTRACTION RESULTS")
    print("=" * 70)
    
    # Framework info
    print(f"📋 Framework: {data.get('name', 'Unknown')}")
    print(f"🏷️  ID: {data.get('id', 'Unknown')}")
    print(f"📊 Version: {data.get('version', 'Unknown')}")
    
    # Get the main matrix
    matrices = data.get('matrices', [])
    if not matrices:
        print("❌ No matrices found in data")
        return
    
    matrix = matrices[0]  # Get first matrix
    
    # Tactics summary
    tactics = matrix.get('tactics', [])
    print(f"\n🎯 TACTICS ({len(tactics)} total):")
    print("-" * 50)
    for tactic in tactics:
        tactic_id = tactic.get('id', 'Unknown')
        tactic_name = tactic.get('name', 'Unknown')
        description = tactic.get('description', '')
        # Get first sentence of description
        first_sentence = description.split('.')[0] + '.' if description else 'No description'
        print(f"  {tactic_id}: {tactic_name}")
        print(f"    └─ {first_sentence[:100]}{'...' if len(first_sentence) > 100 else ''}")
    
    # Techniques summary
    techniques = matrix.get('techniques', [])
    print(f"\n🔧 TECHNIQUES ({len(techniques)} total):")
    print("-" * 50)
    
    # Group techniques by tactic
    tactic_technique_count = {}
    for technique in techniques:
        technique_tactics = technique.get('tactics', [])
        for tactic_id in technique_tactics:
            if tactic_id not in tactic_technique_count:
                tactic_technique_count[tactic_id] = []
            tactic_technique_count[tactic_id].append(technique)
    
    # Display technique count per tactic
    for tactic in tactics:
        tactic_id = tactic.get('id')
        tactic_name = tactic.get('name')
        technique_count = len(tactic_technique_count.get(tactic_id, []))
        print(f"  {tactic_name}: {technique_count} techniques")
    
    # Show some example techniques
    print(f"\n📝 EXAMPLE TECHNIQUES (first 10):")
    print("-" * 50)
    for i, technique in enumerate(techniques[:10]):
        tech_id = technique.get('id', 'Unknown')
        tech_name = technique.get('name', 'Unknown')
        tech_tactics = ', '.join(technique.get('tactics', []))
        print(f"  {tech_id}: {tech_name}")
        print(f"    └─ Tactics: {tech_tactics}")
    
    # Case studies summary
    case_studies = data.get('case-studies', [])
    print(f"\n📚 CASE STUDIES ({len(case_studies)} total):")
    print("-" * 50)
    
    # Show first 10 case studies
    for i, case_study in enumerate(case_studies[:10]):
        cs_id = case_study.get('id', 'Unknown')
        cs_name = case_study.get('name', 'Unknown')
        cs_target = case_study.get('target', 'Unknown')
        cs_actor = case_study.get('actor', 'Unknown')
        cs_type = case_study.get('case-study-type', 'Unknown')
        print(f"  {cs_id}: {cs_name}")
        print(f"    └─ Target: {cs_target} | Actor: {cs_actor} | Type: {cs_type}")
    
    if len(case_studies) > 10:
        print(f"    ... and {len(case_studies) - 10} more case studies")
    
    # Statistics
    print(f"\n📊 SUMMARY STATISTICS:")
    print("-" * 50)
    print(f"  Total Tactics: {len(tactics)}")
    print(f"  Total Techniques: {len(techniques)}")
    print(f"  Total Case Studies: {len(case_studies)}")
    print(f"  Total Framework Items: {len(tactics) + len(techniques) + len(case_studies)}")
    
    # Show available tactic IDs and names for reference
    print(f"\n🗂️  COMPLETE TACTIC REFERENCE:")
    print("-" * 50)
    for tactic in tactics:
        tactic_id = tactic.get('id', 'Unknown')
        tactic_name = tactic.get('name', 'Unknown')
        technique_count = len(tactic_technique_count.get(tactic_id, []))
        print(f"  {tactic_id} | {tactic_name} ({technique_count} techniques)")

def main():
    print("🚀 ATLAS Framework Data Parser")
    print("=" * 50)
    
    # Fetch ATLAS data
    print("🔄 Fetching ATLAS data from GitHub...")
    yaml_content = fetch_atlas_yaml()
    
    if not yaml_content:
        print("❌ Failed to fetch ATLAS data")
        return
    
    print(f"✅ Successfully fetched {len(yaml_content)} characters")
    
    # Parse data
    print("🔄 Parsing ATLAS data...")
    data = parse_atlas_data(yaml_content)
    
    if not data:
        print("❌ Failed to parse ATLAS data")
        return
    
    print("✅ Successfully parsed ATLAS data")
    
    # Display summary
    display_atlas_summary(data)
    
    print(f"\n✅ ATLAS extraction completed successfully!")
    print(f"📅 Extracted on: {datetime.now()}")

if __name__ == "__main__":
    main() 