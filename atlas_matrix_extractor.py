#!/usr/bin/env python3
"""
ATLAS Matrix Data Extractor
Extracts ATLAS matrix data directly from GitHub repository source files
Source: https://github.com/mitre-atlas/atlas-data/tree/main/data
"""

import requests
import json
import yaml
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def explore_github_directory(repo_url):
    """Explore the GitHub data directory structure"""
    api_url = repo_url.replace("github.com", "api.github.com/repos").replace("/tree/main", "/contents")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    try:
        response = requests.get(api_url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"❌ Error exploring directory: {e}")
        return None

def fetch_file_content(download_url):
    """Fetch content from a GitHub raw file URL"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(download_url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Error fetching file: {e}")
        return None

def parse_yaml_file(content):
    """Parse YAML content"""
    try:
        return yaml.safe_load(content)
    except yaml.YAMLError as e:
        print(f"❌ Error parsing YAML: {e}")
        return None

def main():
    print("🚀 ATLAS Matrix Data Extractor")
    print("=" * 60)
    
    # Explore the GitHub data directory
    repo_url = "https://github.com/mitre-atlas/atlas-data/tree/main/data"
    print(f"🔍 Exploring repository: {repo_url}")
    
    directory_contents = explore_github_directory(repo_url)
    
    if not directory_contents:
        print("❌ Failed to explore directory")
        return
    
    print(f"✅ Found {len(directory_contents)} items in data directory")
    
    # Categorize files
    tactics_files = []
    techniques_files = []
    case_studies_files = []
    other_files = []
    
    print("\n📁 Directory Contents:")
    print("-" * 40)
    
    for item in directory_contents:
        name = item.get('name', '')
        item_type = item.get('type', '')
        download_url = item.get('download_url', '')
        
        print(f"  📄 {name} ({item_type})")
        
        if 'tactic' in name.lower():
            tactics_files.append((name, download_url))
        elif 'technique' in name.lower():
            techniques_files.append((name, download_url))
        elif 'case-stud' in name.lower() or 'case_stud' in name.lower():
            case_studies_files.append((name, download_url))
        else:
            other_files.append((name, download_url))
    
    # Summary of file types
    print(f"\n📊 File Categories:")
    print(f"  🎯 Tactics files: {len(tactics_files)}")
    print(f"  🔧 Techniques files: {len(techniques_files)}")
    print(f"  📚 Case studies files: {len(case_studies_files)}")
    print(f"  📋 Other files: {len(other_files)}")
    
    # Extract matrix data
    all_tactics = []
    all_techniques = []
    all_case_studies = []
    
    print(f"\n🔄 Processing ATLAS Matrix Data...")
    print("-" * 40)
    
    # Process tactics files
    if tactics_files:
        print(f"🎯 Processing {len(tactics_files)} tactics files...")
        for name, url in tactics_files:
            print(f"  📥 Fetching: {name}")
            content = fetch_file_content(url)
            if content:
                data = parse_yaml_file(content)
                if data:
                    if isinstance(data, list):
                        all_tactics.extend(data)
                        print(f"    ✅ Loaded {len(data)} tactics from {name}")
                    else:
                        all_tactics.append(data)
                        print(f"    ✅ Loaded tactic: {data.get('name', 'Unknown')}")
    
    # Process techniques files  
    if techniques_files:
        print(f"🔧 Processing {len(techniques_files)} techniques files...")
        for name, url in techniques_files:
            print(f"  📥 Fetching: {name}")
            content = fetch_file_content(url)
            if content:
                data = parse_yaml_file(content)
                if data:
                    if isinstance(data, list):
                        all_techniques.extend(data)
                        print(f"    ✅ Loaded {len(data)} techniques from {name}")
                    else:
                        all_techniques.append(data)
                        print(f"    ✅ Loaded technique: {data.get('name', 'Unknown')}")
    
    # Process case studies - handle directory case
    if case_studies_files:
        print(f"📚 Processing case studies...")
        for name, url in case_studies_files:
            if name == "case-studies" and url is None:
                # This is a directory, need to explore it separately
                cs_api_url = "https://api.github.com/repos/mitre-atlas/atlas-data/contents/data/case-studies"
                print(f"  📁 Exploring case-studies directory...")
                cs_directory = explore_github_directory("https://github.com/mitre-atlas/atlas-data/tree/main/data/case-studies")
                if cs_directory:
                    print(f"    ✅ Found {len(cs_directory)} case study files")
                    # Process first 5 case study files
                    for cs_item in cs_directory[:5]:
                        cs_name = cs_item.get('name', '')
                        cs_url = cs_item.get('download_url', '')
                        if cs_url and cs_name.endswith('.yaml'):
                            print(f"    📥 Fetching case study: {cs_name}")
                            cs_content = fetch_file_content(cs_url)
                            if cs_content:
                                cs_data = parse_yaml_file(cs_content)
                                if cs_data:
                                    all_case_studies.append(cs_data)
            else:
                print(f"  📥 Fetching: {name}")
                content = fetch_file_content(url)
                if content:
                    data = parse_yaml_file(content)
                    if data:
                        if isinstance(data, list):
                            all_case_studies.extend(data)
                            print(f"    ✅ Loaded {len(data)} case studies from {name}")
                        else:
                            all_case_studies.append(data)
                            print(f"    ✅ Loaded case study: {data.get('name', 'Unknown')}")
    
    # Display results
    print(f"\n🚀 ATLAS MATRIX EXTRACTION RESULTS")
    print("=" * 60)
    
    if all_tactics:
        print(f"\n🎯 TACTICS EXTRACTED ({len(all_tactics)}):")
        print("-" * 40)
        for tactic in all_tactics:
            tactic_id = tactic.get('id', 'Unknown')
            tactic_name = tactic.get('name', 'Unknown')
            description = tactic.get('description', '')[:100] + '...' if tactic.get('description', '') else 'No description'
            print(f"  {tactic_id}: {tactic_name}")
            print(f"    └─ {description}")
    
    if all_techniques:
        print(f"\n🔧 TECHNIQUES EXTRACTED ({len(all_techniques)}):")
        print("-" * 40)
        for technique in all_techniques:
            tech_id = technique.get('id', 'Unknown')
            tech_name = technique.get('name', 'Unknown')
            tech_tactics = technique.get('tactics', [])
            print(f"  {tech_id}: {tech_name}")
            if tech_tactics:
                print(f"    └─ Tactics: {', '.join(tech_tactics)}")
    
    if all_case_studies:
        print(f"\n📚 CASE STUDIES EXTRACTED ({len(all_case_studies)}):")
        print("-" * 40)
        for case_study in all_case_studies:
            cs_id = case_study.get('id', 'Unknown')
            cs_name = case_study.get('name', 'Unknown')
            cs_target = case_study.get('target', 'Unknown')
            print(f"  {cs_id}: {cs_name}")
            print(f"    └─ Target: {cs_target}")
    
    # Final summary
    print(f"\n📊 EXTRACTION SUMMARY:")
    print("-" * 40)
    print(f"  📁 Total files found: {len(directory_contents)}")
    print(f"  🎯 Tactics extracted: {len(all_tactics)}")
    print(f"  🔧 Techniques extracted: {len(all_techniques)}")
    print(f"  📚 Case studies extracted: {len(all_case_studies)}")
    print(f"  🌐 Source: {repo_url}")
    print(f"  📅 Extracted on: {datetime.now()}")
    
    print(f"\n✅ ATLAS matrix extraction completed successfully!")

if __name__ == "__main__":
    main() 