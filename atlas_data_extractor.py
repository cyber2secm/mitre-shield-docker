#!/usr/bin/env python3
"""
ATLAS Framework Data Extractor for MitreShiled
Extracts tactics, techniques, and case studies from the ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) framework
Fetches data directly from the ATLAS GitHub data repository YAML file
Based on https://github.com/mitre-atlas/atlas-data
"""

import requests
import json
import sys
from datetime import datetime
import urllib3
import yaml

# Disable SSL warnings for development/testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_atlas_data():
    """Fetch the ATLAS framework data from GitHub repository"""
    url = "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/ATLAS.yaml"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"🔍 Fetching ATLAS data from {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Error fetching data: {e}")
        return None

def parse_atlas_yaml(yaml_content):
    """Parse the YAML content to extract ATLAS tactics, techniques, and case studies"""
    
    print(f"🔍 Parsing ATLAS YAML data...")
    
    try:
        data = yaml.safe_load(yaml_content)
        
        if not data:
            print("❌ Failed to parse YAML data")
            return None
        
        print(f"✅ Successfully parsed ATLAS data")
        print(f"📊 Data overview:")
        print(f"  - ATLAS ID: {data.get('id', 'Unknown')}")
        print(f"  - Name: {data.get('name', 'Unknown')}")
        print(f"  - Version: {data.get('version', 'Unknown')}")
        
        # Extract matrices
        matrices = data.get('matrices', [])
        print(f"  - Matrices: {len(matrices)}")
        
        techniques_data = []
        tactics_data = []
        case_studies_data = data.get('case-studies', [])
        
        for matrix in matrices:
            matrix_id = matrix.get('id', 'Unknown')
            matrix_name = matrix.get('name', 'Unknown')
            print(f"\n🎯 Processing matrix: {matrix_name} ({matrix_id})")
            
            # Extract tactics
            matrix_tactics = matrix.get('tactics', [])
            print(f"  📋 Tactics: {len(matrix_tactics)}")
            
            for tactic in matrix_tactics:
                tactic_data = {
                    'id': tactic.get('id', ''),
                    'name': tactic.get('name', ''),
                    'description': tactic.get('description', ''),
                    'matrix': matrix_id
                }
                tactics_data.append(tactic_data)
            
            # Extract techniques
            matrix_techniques = matrix.get('techniques', [])
            print(f"  🎯 Techniques: {len(matrix_techniques)}")
            
            for technique in matrix_techniques:
                technique_data = {
                    'technique_id': technique.get('id', ''),
                    'name': technique.get('name', ''),
                    'description': technique.get('description', ''),
                    'tactics': [tactic.get('id', '') for tactic in technique.get('tactics', [])],
                    'platforms': technique.get('platforms', []),
                    'data_sources': technique.get('data_sources', []),
                    'is_subtechnique': '.' in technique.get('id', ''),
                    'matrix': matrix_id,
                    'framework': 'ATLAS',
                    'sync_source': 'atlas_yaml_extractor',
                    'last_updated': datetime.now().isoformat()
                }
                
                # Handle sub-techniques
                if technique_data['is_subtechnique']:
                    parent_id = technique_data['technique_id'].split('.')[0]
                    technique_data['parent_technique_id'] = parent_id
                else:
                    technique_data['parent_technique_id'] = ''
                
                techniques_data.append(technique_data)
        
        print(f"\n📚 Case Studies: {len(case_studies_data)}")
        
        return {
            'platform': 'ATLAS',
            'framework': 'ATLAS',
            'version': data.get('version', 'Unknown'),
            'extraction_date': datetime.now().isoformat(),
            'tactics': tactics_data,
            'techniques': techniques_data,
            'case_studies': case_studies_data,
            'summary': {
                'total_matrices': len(matrices),
                'total_tactics': len(tactics_data),
                'total_techniques': len([t for t in techniques_data if not t['is_subtechnique']]),
                'total_subtechniques': len([t for t in techniques_data if t['is_subtechnique']]),
                'total_case_studies': len(case_studies_data),
                'total_items': len(techniques_data) + len(case_studies_data)
            }
        }
        
    except yaml.YAMLError as e:
        print(f"❌ Error parsing YAML: {e}")
        return None
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        return None

def print_atlas_summary(data):
    """Print ATLAS extraction summary"""
    if not data:
        return
    
    print("\n" + "=" * 70)
    print(f"📊 ATLAS FRAMEWORK EXTRACTION SUMMARY")
    print("=" * 70)
    
    print(f"Framework: {data['framework']}")
    print(f"Version: {data['version']}")
    print(f"Total Matrices: {data['summary']['total_matrices']}")
    print(f"Total Tactics: {data['summary']['total_tactics']}")
    print(f"Total Techniques: {data['summary']['total_techniques']}")
    print(f"Total Sub-techniques: {data['summary']['total_subtechniques']}")
    print(f"Total Case Studies: {data['summary']['total_case_studies']}")
    print(f"Total Items: {data['summary']['total_items']}")
    
    print("\n📋 ATLAS Tactics:")
    for tactic in data['tactics']:
        print(f"  {tactic['id']}: {tactic['name']}")
    
    print(f"\n🎯 ATLAS Techniques (showing first 10):")
    for i, tech in enumerate(data['techniques'][:10]):
        technique_type = "Sub-technique" if tech['is_subtechnique'] else "Technique"
        print(f"  {tech['technique_id']}: {tech['name']} ({technique_type})")
    
    if len(data['techniques']) > 10:
        print(f"  ... and {len(data['techniques']) - 10} more techniques")
    
    if data['case_studies']:
        print(f"\n📚 ATLAS Case Studies (showing first 5):")
        for i, cs in enumerate(data['case_studies'][:5]):
            cs_id = cs.get('id', f'Case Study {i+1}')
            cs_name = cs.get('name', 'Unnamed Case Study')
            print(f"  {cs_id}: {cs_name}")
        
        if len(data['case_studies']) > 5:
            print(f"  ... and {len(data['case_studies']) - 5} more case studies")
    
    print("=" * 70)

def main():
    print("🚀 ATLAS Framework Data Extractor")
    print("=" * 50)
    
    # Fetch ATLAS data from GitHub
    yaml_content = fetch_atlas_data()
    if not yaml_content:
        print("❌ Failed to fetch ATLAS data")
        return False
    
    # Parse the YAML data
    data = parse_atlas_yaml(yaml_content)
    if not data:
        print("❌ Failed to parse ATLAS data")
        return False
    
    # Print summary
    print_atlas_summary(data)
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ ATLAS extraction completed successfully!")
    else:
        print("\n❌ ATLAS extraction failed!")
        sys.exit(1) 