#!/usr/bin/env python3
"""
MITRE ATT&CK Matrix Extractor for MitreShiled
Extracts tactics, techniques, and SUB-TECHNIQUES from official MITRE ATT&CK matrix pages
Adjusted for MitreShiled data schema and tactic card requirements
Supports multiple platforms: Windows, macOS, Linux, etc.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import sys
from datetime import datetime
import time

# MitreShiled tactic mapping (exact names used in the application)
MITRE_SHIELD_TACTICS = {
    "initial-access": "Initial Access",
    "execution": "Execution", 
    "persistence": "Persistence",
    "privilege-escalation": "Privilege Escalation",
    "defense-evasion": "Defense Evasion",
    "credential-access": "Credential Access",
    "discovery": "Discovery",
    "lateral-movement": "Lateral Movement",
    "collection": "Collection",
    "command-and-control": "Command and Control",  # Note: "and" not "And"
    "exfiltration": "Exfiltration",
    "impact": "Impact"
}

# Platform mapping for MitreShiled
PLATFORM_MAPPING = {
    "windows": "Windows",
    "macos": "macOS",
    "linux": "Linux",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "oracle": "Oracle",
    "containers": "Containers"
}

def fetch_matrix_page(platform="windows"):
    """Fetch the MITRE ATT&CK Matrix webpage for specified platform"""
    platform_urls = {
        "windows": "https://attack.mitre.org/matrices/enterprise/windows/",
        "macos": "https://attack.mitre.org/matrices/enterprise/macos/",
        "linux": "https://attack.mitre.org/matrices/enterprise/linux/",
        "cloud": "https://attack.mitre.org/matrices/enterprise/cloud/",
        "containers": "https://attack.mitre.org/matrices/enterprise/containers/"
    }
    
    url = platform_urls.get(platform.lower(), f"https://attack.mitre.org/matrices/enterprise/{platform.lower()}/")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"🔍 Fetching {platform.upper()} matrix from {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Error fetching page: {e}")
        return None

def extract_technique_id(href):
    """Extract technique ID from href like /techniques/T1566 or /techniques/T1566/001"""
    if not href:
        return None
    
    # Handle both formats: /techniques/T1566 and /techniques/T1566/001
    match = re.search(r'/techniques/(T\d+)(?:/(\d+))?', href)
    if match:
        base_id = match.group(1)
        sub_id = match.group(2)
        if sub_id:
            return f"{base_id}.{sub_id}"
        return base_id
    return None

def get_platform_list(platform):
    """Get the appropriate platform list for MitreShiled schema"""
    if platform.lower() == "cloud":
        return ["AWS", "Azure", "GCP", "Oracle"]
    elif platform.lower() == "containers":
        return ["Containers"]
    else:
        return [PLATFORM_MAPPING.get(platform.lower(), platform.title())]

def parse_matrix_data(html_content, platform="windows"):
    """Parse the HTML content to extract tactics and techniques for MitreShiled schema"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    print(f"🔍 Parsing {platform.upper()} matrix data for MitreShiled...")
    
    # Find the main matrix table
    matrix_table = soup.find('table', class_='matrix side')
    if not matrix_table:
        matrix_table = soup.find('table', class_='side')
    
    if not matrix_table:
        print("❌ Could not find matrix table!")
        return None
    
    print("✅ Found matrix table")
    
    # Get all rows
    all_rows = matrix_table.find_all('tr')
    print(f"🔍 Found {len(all_rows)} rows in matrix table")
    
    if len(all_rows) < 3:
        print("❌ Matrix table doesn't have enough rows!")
        return None
    
    # Row 1: Extract tactic names and structure
    print("\n📊 Extracting tactics and building column structure...")
    tactic_row = all_rows[0]
    if hasattr(tactic_row, 'find_all'):
        tactic_cells = tactic_row.find_all('td', class_='tactic name')
    else:
        print("❌ Tactic row is not a valid element!")
        return None
    
    tactics_data = []
    for tactic_cell in tactic_cells:
        tactic_link = tactic_cell.find('a')
        if tactic_link:
            tactic_name = tactic_link.get_text(strip=True)
            tactic_href = tactic_link.get('href', '')
            
            # Extract tactic ID from href (e.g., /tactics/TA0001)
            tactic_id = tactic_href.split('/')[-1] if tactic_href else ""
            
            # Map to MitreShiled tactic name
            tactic_key = tactic_href.split('/')[-1].lower() if tactic_href else tactic_name.lower().replace(' ', '-')
            mitre_shield_name = MITRE_SHIELD_TACTICS.get(tactic_key, tactic_name)
            
            tactics_data.append({
                'id': tactic_id,
                'name': mitre_shield_name,
                'original_name': tactic_name,
                'techniques': []
            })
    
    print(f"✅ Found {len(tactics_data)} tactics: {[t['name'] for t in tactics_data]}")
    
    # Row 2: Extract official tactic counts
    print("\n📊 Extracting official tactic counts...")
    count_row = all_rows[1]
    if hasattr(count_row, 'find_all'):
        count_cells = count_row.find_all('td')
    else:
        print("❌ Count row is not a valid element!")
        return None
    
    expected_counts = []
    for i, tactic in enumerate(tactics_data):
        if i < len(count_cells):
            count_text = count_cells[i].get_text(strip=True)
            count_match = re.search(r'(\d+)', count_text)
            if count_match:
                expected_count = int(count_match.group(1))
                expected_counts.append(expected_count)
                print(f"  📈 {tactic['name']}: {expected_count} techniques")
            else:
                expected_counts.append(0)
        else:
            expected_counts.append(0)
    
    # Row 3: The main technique data row
    print("\n🎯 Extracting techniques from matrix columns...")
    technique_row = all_rows[2]
    if hasattr(technique_row, 'find_all'):
        technique_cells = technique_row.find_all('td')
    else:
        print("❌ Technique row is not a valid element!")
        return None

    print(f"📊 Found {len(technique_cells)} cells in technique row")

    # Find tactic cells (cells with class 'tactic')
    tactic_cells = []
    for i, cell in enumerate(technique_cells):
        if 'tactic' in cell.get('class', []):
            tactic_cells.append((i, cell))

    print(f"📊 Found {len(tactic_cells)} tactic cells")

    if len(tactic_cells) != len(tactics_data):
        print(f"⚠️ Warning: Found {len(tactic_cells)} tactic cells but {len(tactics_data)} tactics")

    # Get platform list for techniques
    technique_platforms = get_platform_list(platform)
    
    # Process each tactic
    all_techniques = []
    for tactic_idx, tactic in enumerate(tactics_data):
        if tactic_idx >= len(tactic_cells):
            print(f"⚠️ No tactic cell for tactic {tactic['name']}")
            continue
        
        cell_index, tactic_cell = tactic_cells[tactic_idx]
        print(f"\n🎯 Processing tactic: {tactic['name']} (expecting {expected_counts[tactic_idx]} techniques)")
        
        # Extract techniques from the tactic cell
        tech_links = tactic_cell.find_all('a', href=lambda href: href and '/techniques/' in href)
        
        techniques_dict = {}
        
        for link in tech_links:
            href = link.get('href', '')
            name = link.get_text(strip=True)
            tech_id = extract_technique_id(href)
            
            if not tech_id:
                continue
                
            # Clean up technique name
            clean_name = re.sub(r'\s*\(\d+\)\s*$', '', name)
            
            if '.' not in tech_id:
                # Parent technique - create MitreShiled document
                if tech_id not in techniques_dict:
                    technique_doc = {
                        'technique_id': tech_id,
                        'name': clean_name,
                        'description': '',  # Will be populated later if needed
                        'tactic': tactic['name'],  # Primary tactic
                        'tactics': [tactic['name']],  # Array of all applicable tactics
                        'platforms': technique_platforms.copy(),
                        'data_sources': [],
                        'is_subtechnique': False,
                        'parent_technique': '',
                        'parent_technique_id': '',
                        'mitre_version': '1.0',
                        'sync_source': 'mitre_extractor',
                        'last_updated': datetime.now().isoformat(),
                        'subtechniques': []
                    }
                    techniques_dict[tech_id] = technique_doc
                else:
                    # Update name if we have a cleaner version
                    if clean_name and not clean_name.startswith("Parent of"):
                        techniques_dict[tech_id]['name'] = clean_name
            else:
                # Sub-technique
                parent_id = tech_id.split('.')[0]
                
                # Ensure parent exists
                if parent_id not in techniques_dict:
                    parent_doc = {
                        'technique_id': parent_id,
                        'name': f"Parent of {tech_id}",
                        'description': '',
                        'tactic': tactic['name'],
                        'tactics': [tactic['name']],
                        'platforms': technique_platforms.copy(),
                        'data_sources': [],
                        'is_subtechnique': False,
                        'parent_technique': '',
                        'parent_technique_id': '',
                        'mitre_version': '1.0',
                        'sync_source': 'mitre_extractor',
                        'last_updated': datetime.now().isoformat(),
                        'subtechniques': []
                    }
                    techniques_dict[parent_id] = parent_doc
                
                # Create sub-technique document
                sub_technique_doc = {
                    'technique_id': tech_id,
                    'name': clean_name,
                    'description': '',
                    'tactic': tactic['name'],
                    'tactics': [tactic['name']],
                    'platforms': technique_platforms.copy(),
                    'data_sources': [],
                    'is_subtechnique': True,
                    'parent_technique': techniques_dict[parent_id]['name'],
                    'parent_technique_id': parent_id,
                    'mitre_version': '1.0',
                    'sync_source': 'mitre_extractor',
                    'last_updated': datetime.now().isoformat()
                }
                
                # Add to subtechniques list for parent
                techniques_dict[parent_id]['subtechniques'].append({
                    'id': tech_id,
                    'name': clean_name
                })
                
                # Add as separate document
                techniques_dict[tech_id] = sub_technique_doc
        
        # Process sub-technique cells that might be in adjacent columns
        next_tactic_index = tactic_cells[tactic_idx + 1][0] if tactic_idx + 1 < len(tactic_cells) else len(technique_cells)
        
        for cell_idx in range(cell_index + 1, next_tactic_index):
            if cell_idx >= len(technique_cells):
                break
            
            cell = technique_cells[cell_idx]
            
            if 'subtechniques-td' in cell.get('class', []):
                sub_links = cell.find_all('a', href=lambda href: href and '/techniques/' in href)
                
                for link in sub_links:
                    href = link.get('href', '')
                    name = link.get_text(strip=True)
                    tech_id = extract_technique_id(href)
                    
                    if not tech_id or '.' not in tech_id:
                        continue
                        
                    parent_id = tech_id.split('.')[0]
                    clean_name = re.sub(r'\s*\(\d+\)\s*$', '', name)
                    
                    # Ensure parent exists
                    if parent_id not in techniques_dict:
                        parent_doc = {
                            'technique_id': parent_id,
                            'name': f"Parent of {tech_id}",
                            'description': '',
                            'tactic': tactic['name'],
                            'tactics': [tactic['name']],
                            'platforms': technique_platforms.copy(),
                            'data_sources': [],
                            'is_subtechnique': False,
                            'parent_technique': '',
                            'parent_technique_id': '',
                            'mitre_version': '1.0',
                            'sync_source': 'mitre_extractor',
                            'last_updated': datetime.now().isoformat(),
                            'subtechniques': []
                        }
                        techniques_dict[parent_id] = parent_doc
                    
                    # Create sub-technique if not exists
                    if tech_id not in techniques_dict:
                        sub_technique_doc = {
                            'technique_id': tech_id,
                            'name': clean_name,
                            'description': '',
                            'tactic': tactic['name'],
                            'tactics': [tactic['name']],
                            'platforms': technique_platforms.copy(),
                            'data_sources': [],
                            'is_subtechnique': True,
                            'parent_technique': techniques_dict[parent_id]['name'],
                            'parent_technique_id': parent_id,
                            'mitre_version': '1.0',
                            'sync_source': 'mitre_extractor',
                            'last_updated': datetime.now().isoformat()
                        }
                        techniques_dict[tech_id] = sub_technique_doc
                        
                        # Add to parent's subtechniques
                        if not any(sub['id'] == tech_id for sub in techniques_dict[parent_id]['subtechniques']):
                            techniques_dict[parent_id]['subtechniques'].append({
                                'id': tech_id,
                                'name': clean_name
                            })
        
        # Add techniques to tactic and all_techniques
        tactic_techniques = list(techniques_dict.values())
        tactic['techniques'] = tactic_techniques
        all_techniques.extend(tactic_techniques)
        
        # Count techniques and sub-techniques
        parent_techniques = [t for t in tactic_techniques if not t['is_subtechnique']]
        sub_techniques = [t for t in tactic_techniques if t['is_subtechnique']]
        
        print(f"  📋 Found {len(parent_techniques)} parent techniques, {len(sub_techniques)} sub-techniques")
        
        # Check if we match expected count (only count parent techniques)
        if expected_counts[tactic_idx] > 0:
            if len(parent_techniques) == expected_counts[tactic_idx]:
                print(f"  ✅ Technique count matches expected: {len(parent_techniques)}")
            else:
                print(f"  ⚠️ Technique count mismatch: found {len(parent_techniques)}, expected {expected_counts[tactic_idx]}")
    
    return {
        'platform': PLATFORM_MAPPING.get(platform.lower(), platform.title()),
        'extraction_date': datetime.now().isoformat(),
        'tactics': tactics_data,
        'techniques': all_techniques,  # Flat list of all techniques for easy database import
        'summary': {
            'total_tactics': len(tactics_data),
            'total_techniques': len([t for t in all_techniques if not t['is_subtechnique']]),
            'total_subtechniques': len([t for t in all_techniques if t['is_subtechnique']]),
            'total_items': len(all_techniques)
        }
    }

def save_matrix_data(data, platform="windows", format_type="mitreshire"):
    """Save the extracted matrix data to JSON file"""
    if not data:
        print("❌ No data to save!")
        return False
    
    if format_type == "mitreshire":
        # Save in MitreShiled format (ready for database import)
        techniques_filename = f"mitreshire_{platform.lower()}_techniques.json"
        tactics_filename = f"mitreshire_{platform.lower()}_tactics.json"
        
        try:
            # Save techniques for database import
            with open(techniques_filename, 'w', encoding='utf-8') as f:
                json.dump(data['techniques'], f, indent=2, ensure_ascii=False)
            
            # Save tactics summary
            tactics_summary = {
                'platform': data['platform'],
                'extraction_date': data['extraction_date'],
                'tactics': [{'name': t['name'], 'technique_count': len([tech for tech in t['techniques'] if not tech['is_subtechnique']])} for t in data['tactics']],
                'summary': data['summary']
            }
            
            with open(tactics_filename, 'w', encoding='utf-8') as f:
                json.dump(tactics_summary, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Saved MitreShiled format:")
            print(f"  📄 Techniques: {techniques_filename}")
            print(f"  📄 Tactics Summary: {tactics_filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving MitreShiled format: {e}")
            return False
    else:
        # Save complete data structure
        filename = f"mitre_{platform.lower()}_matrix_complete.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Saved complete matrix data to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            return False

def print_summary(data):
    """Print extraction summary"""
    if not data:
        return
    
    print("\n" + "=" * 70)
    print(f"📊 {data['platform']} MATRIX EXTRACTION SUMMARY (MitreShiled Format)")
    print("=" * 70)
    
    for tactic in data['tactics']:
        parent_count = len([t for t in tactic['techniques'] if not t['is_subtechnique']])
        sub_count = len([t for t in tactic['techniques'] if t['is_subtechnique']])
        
        print(f"{tactic['name']:<25} {parent_count:>2} techniques, {sub_count:>3} sub-techniques")
    
    print("=" * 70)
    print(f"Platform: {data['platform']}")
    print(f"Total Tactics: {data['summary']['total_tactics']}")
    print(f"Total Techniques: {data['summary']['total_techniques']}")
    print(f"Total Sub-techniques: {data['summary']['total_subtechniques']}")
    print(f"Total Database Records: {data['summary']['total_items']}")
    print("=" * 70)
    print("\n📝 Next Steps:")
    print("1. Review the generated JSON files")
    print("2. Import techniques into your MitreShiled database")
    print("3. Verify tactic cards display correctly")
    print("4. Check platform filtering works as expected")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 mitre_data_extractor.py <platform> [format]")
        print("Platforms: windows, macos, linux, cloud, containers")
        print("Format: mitreshire (default) | complete")
        print("\nExample:")
        print("  python3 mitre_data_extractor.py windows")
        print("  python3 mitre_data_extractor.py cloud mitreshire")
        sys.exit(1)
    
    platform = sys.argv[1].lower()
    format_type = sys.argv[2] if len(sys.argv) > 2 else "mitreshire"
    
    print(f"🚀 Starting MITRE ATT&CK {platform.upper()} matrix extraction for MitreShiled...")
    print(f"📋 Output format: {format_type}")
    
    # Fetch the matrix page
    html_content = fetch_matrix_page(platform)
    if not html_content:
        print("❌ Failed to fetch matrix page")
        sys.exit(1)
    
    # Parse the matrix data
    matrix_data = parse_matrix_data(html_content, platform)
    if not matrix_data:
        print("❌ Failed to parse matrix data")
        sys.exit(1)
    
    # Save the data
    if save_matrix_data(matrix_data, platform, format_type):
        print("✅ Extraction completed successfully!")
    else:
        print("❌ Failed to save matrix data")
        sys.exit(1)
    
    # Print summary
    print_summary(matrix_data)

if __name__ == "__main__":
    main()
