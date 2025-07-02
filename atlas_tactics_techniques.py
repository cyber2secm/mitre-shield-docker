#!/usr/bin/env python3
"""
ATLAS Tactics & Techniques Extractor
Extracts only tactics, techniques, and sub-techniques from ATLAS framework
Focused extraction without case studies
"""

import requests
import yaml
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_atlas_data():
    """Fetch ATLAS tactics and techniques data"""
    base_url = "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/data"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Fetch tactics
    tactics_url = f"{base_url}/tactics.yaml"
    techniques_url = f"{base_url}/techniques.yaml"
    
    print("🔍 Fetching ATLAS tactics...")
    try:
        tactics_response = requests.get(tactics_url, headers=headers, timeout=30, verify=False)
        tactics_response.raise_for_status()
        tactics_data = yaml.safe_load(tactics_response.text)
    except Exception as e:
        print(f"❌ Error fetching tactics: {e}")
        return None, None
    
    print("🔍 Fetching ATLAS techniques...")
    try:
        techniques_response = requests.get(techniques_url, headers=headers, timeout=30, verify=False)
        techniques_response.raise_for_status()
        techniques_data = yaml.safe_load(techniques_response.text)
    except Exception as e:
        print(f"❌ Error fetching techniques: {e}")
        return tactics_data, None
    
    return tactics_data, techniques_data

def organize_techniques_by_tactic(tactics, techniques):
    """Organize techniques and sub-techniques by tactic"""
    # Create a mapping of tactics with their techniques
    tactic_technique_map = {}
    
    # Create name to ID mapping for tactics
    tactic_name_map = {}
    
    # Initialize with tactics
    for tactic in tactics:
        tactic_id = tactic.get('id', '')
        tactic_name = tactic.get('name', '')
        tactic_technique_map[tactic_id] = {
            'name': tactic_name,
            'id': tactic_id,
            'techniques': [],
            'subtechniques': []
        }
        # Create simplified name mapping for template matching
        simple_name = tactic_name.lower().replace(' ', '_').replace('&', '_and_')
        tactic_name_map[simple_name] = tactic_id
        
        # Add specific mappings for known template references
        if tactic_name == "AI Model Access":
            tactic_name_map['ml_model_access'] = tactic_id
        elif tactic_name == "AI Attack Staging":
            tactic_name_map['ml_attack_staging'] = tactic_id
        elif tactic_name == "Reconnaissance":
            tactic_name_map['reconnaissance'] = tactic_id
        elif tactic_name == "Resource Development":
            tactic_name_map['resource_development'] = tactic_id
        elif tactic_name == "Initial Access":
            tactic_name_map['initial_access'] = tactic_id
        elif tactic_name == "Execution":
            tactic_name_map['execution'] = tactic_id
        elif tactic_name == "Persistence":
            tactic_name_map['persistence'] = tactic_id
        elif tactic_name == "Privilege Escalation":
            tactic_name_map['privilege_escalation'] = tactic_id
        elif tactic_name == "Defense Evasion":
            tactic_name_map['defense_evasion'] = tactic_id
        elif tactic_name == "Credential Access":
            tactic_name_map['credential_access'] = tactic_id
        elif tactic_name == "Discovery":
            tactic_name_map['discovery'] = tactic_id
        elif tactic_name == "Collection":
            tactic_name_map['collection'] = tactic_id
        elif tactic_name == "Command and Control":
            tactic_name_map['command_and_control'] = tactic_id
        elif tactic_name == "Exfiltration":
            tactic_name_map['exfiltration'] = tactic_id
        elif tactic_name == "Impact":
            tactic_name_map['impact'] = tactic_id
    
    # Process techniques
    for technique in techniques:
        tech_id = technique.get('id', '')
        tech_name = technique.get('name', '')
        tech_tactics = technique.get('tactics', [])
        
        # Determine if it's a sub-technique (contains additional dots after T)
        tech_parts = tech_id.split('.')
        is_subtechnique = len(tech_parts) > 2  # AML.T0000.000 has 3 parts
        
        # Add to appropriate tactics
        for tactic_ref in tech_tactics:
            matched_tactic_id = None
            
            # Handle different tactic reference formats
            if tactic_ref.startswith('AML.TA'):
                # Direct tactic ID reference
                matched_tactic_id = tactic_ref
            elif '{{' in tactic_ref:
                # Template reference like {{reconnaissance.id}}
                template_name = tactic_ref.replace('{{', '').replace('}}', '').replace('.id', '')
                matched_tactic_id = tactic_name_map.get(template_name)
            else:
                # Try to match by name
                for name_key, t_id in tactic_name_map.items():
                    if tactic_ref.lower() in name_key or name_key in tactic_ref.lower():
                        matched_tactic_id = t_id
                        break
            
            # Add technique to matched tactic
            if matched_tactic_id and matched_tactic_id in tactic_technique_map:
                technique_data = {
                    'id': tech_id,
                    'name': tech_name,
                    'description': technique.get('description', '')[:100] + '...' if technique.get('description', '') else ''
                }
                
                if is_subtechnique:
                    tactic_technique_map[matched_tactic_id]['subtechniques'].append(technique_data)
                else:
                    tactic_technique_map[matched_tactic_id]['techniques'].append(technique_data)
    
    return tactic_technique_map

def display_atlas_matrix(tactic_technique_map):
    """Display the ATLAS matrix in the requested format"""
    
    print("🚀 ATLAS FRAMEWORK - AI/ML SECURITY MATRIX")
    print("=" * 80)
    
    # Define the correct order of tactics as specified by user
    tactic_order = [
        "Reconnaissance",
        "Resource Development", 
        "Initial Access",
        "AI Model Access",
        "Execution",
        "Persistence",
        "Privilege Escalation",
        "Defense Evasion",
        "Credential Access",
        "Discovery",
        "Collection",
        "AI Attack Staging",
        "Command and Control",
        "Exfiltration",
        "Impact"
    ]
    
    # Sort tactics by the specified order
    ordered_tactics = []
    for tactic_name in tactic_order:
        for tactic_id, tactic_data in tactic_technique_map.items():
            if tactic_data['name'] == tactic_name:
                ordered_tactics.append((tactic_id, tactic_data))
                break
    
    # Display tactics header with technique counts
    print("\n🎯 TACTICS & TECHNIQUE COUNTS:")
    print("-" * 80)
    tactic_names = []
    technique_counts = []
    
    for tactic_id, tactic_data in ordered_tactics:
        tactic_name = tactic_data['name']
        total_techniques = len(tactic_data['techniques']) + len(tactic_data['subtechniques'])
        tactic_names.append(tactic_name)
        technique_counts.append(str(total_techniques))
    
    # Display in columns
    print(" & ".join(tactic_names))
    print(" & ".join([f"{count} techniques" for count in technique_counts]))
    
    # Display detailed breakdown
    print(f"\n📋 DETAILED TACTICS & TECHNIQUES:")
    print("=" * 80)
    
    total_tactics = 0
    total_techniques = 0
    total_subtechniques = 0
    
    for tactic_id, tactic_data in ordered_tactics:
        tactic_name = tactic_data['name']
        techniques = tactic_data['techniques']
        subtechniques = tactic_data['subtechniques']
        
        total_tactics += 1
        total_techniques += len(techniques)
        total_subtechniques += len(subtechniques)
        
        print(f"\n🎯 {tactic_id}: {tactic_name}")
        print(f"   📊 {len(techniques)} techniques, {len(subtechniques)} sub-techniques")
        
        # Display techniques
        if techniques:
            print("   🔧 TECHNIQUES:")
            for tech in techniques[:5]:  # Show first 5 to avoid overwhelming output
                print(f"      • {tech['id']}: {tech['name']}")
            if len(techniques) > 5:
                print(f"      ... and {len(techniques) - 5} more techniques")
        
        # Display sub-techniques
        if subtechniques:
            print("   🔹 SUB-TECHNIQUES:")
            for subtech in subtechniques[:3]:  # Show first 3
                print(f"      • {subtech['id']}: {subtech['name']}")
            if len(subtechniques) > 3:
                print(f"      ... and {len(subtechniques) - 3} more sub-techniques")
    
    # Summary
    print(f"\n📊 ATLAS MATRIX SUMMARY:")
    print("-" * 80)
    print(f"  🎯 Total Tactics: {total_tactics}")
    print(f"  🔧 Total Techniques: {total_techniques}")
    print(f"  🔹 Total Sub-techniques: {total_subtechniques}")
    print(f"  📋 Total Items: {total_tactics + total_techniques + total_subtechniques}")
    print(f"  🌐 Framework: ATLAS (AI/ML Security)")
    print(f"  📅 Extracted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    print("🚀 ATLAS Tactics & Techniques Extractor")
    print("=" * 60)
    
    # Fetch data
    tactics_data, techniques_data = fetch_atlas_data()
    
    if not tactics_data or not techniques_data:
        print("❌ Failed to fetch ATLAS data")
        return
    
    print(f"✅ Loaded {len(tactics_data)} tactics and {len(techniques_data)} techniques")
    
    # Organize data
    print("🔄 Organizing techniques by tactic...")
    tactic_technique_map = organize_techniques_by_tactic(tactics_data, techniques_data)
    
    # Display results
    display_atlas_matrix(tactic_technique_map)
    
    print(f"\n✅ ATLAS matrix extraction completed!")

if __name__ == "__main__":
    main() 