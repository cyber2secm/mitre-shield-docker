#!/usr/bin/env python3
"""
Description Enhancement Script for MitreShiled
Adds detailed descriptions to existing technique files that lack them
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import sys
from datetime import datetime

def fetch_technique_description(technique_id, max_retries=3):
    """Fetch description for a specific technique from MITRE ATT&CK website"""
    if '.' in technique_id:
        # Sub-technique URL format
        base_id, sub_id = technique_id.split('.')
        url = f"https://attack.mitre.org/techniques/{base_id}/{sub_id}/"
    else:
        # Parent technique URL format
        url = f"https://attack.mitre.org/techniques/{technique_id}/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find description using the working selector
            description_element = soup.find('div', class_='description-body')
            if description_element:
                description = description_element.get_text(strip=True)
                if description and len(description) > 50:
                    return description
            
            # Fallback to first substantial paragraph
            paragraphs = soup.find_all('p')
            for p in paragraphs:
                text = p.get_text(strip=True)
                if len(text) > 100 and not text.startswith('ID:'):
                    return text
                    
            return ""
            
        except requests.RequestException as e:
            print(f"  ⚠️ Attempt {attempt + 1} failed for {technique_id}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            continue
    
    print(f"  ❌ Failed to fetch description for {technique_id} after {max_retries} attempts")
    return ""

def enhance_platform_descriptions(platform):
    """Enhance descriptions for a specific platform"""
    filename = f"mitreshire_{platform}_techniques.json"
    
    try:
        # Load existing techniques
        with open(filename, 'r', encoding='utf-8') as f:
            techniques = json.load(f)
        
        print(f"📚 Loaded {len(techniques)} techniques for {platform}")
        
        # Find techniques without descriptions
        techniques_needing_descriptions = [
            t for t in techniques 
            if not t.get('description') or t.get('description').strip() == ''
        ]
        
        print(f"📝 Found {len(techniques_needing_descriptions)} techniques without descriptions")
        
        if not techniques_needing_descriptions:
            print(f"✅ All {platform} techniques already have descriptions!")
            return True
        
        # Fetch descriptions
        print(f"🔄 Fetching descriptions (this may take several minutes)...")
        successful_fetches = 0
        
        for i, technique in enumerate(techniques_needing_descriptions):
            tech_id = technique['technique_id']
            print(f"📖 [{i+1}/{len(techniques_needing_descriptions)}] Fetching {tech_id}...")
            
            description = fetch_technique_description(tech_id)
            if description:
                technique['description'] = description
                technique['sync_source'] = 'mitre_extractor_enhanced'
                technique['last_updated'] = datetime.now().isoformat()
                successful_fetches += 1
                print(f"  ✅ Got description ({len(description)} chars)")
            else:
                print(f"  ⚠️ No description found")
            
            # Add delay to be respectful to MITRE's servers
            if i < len(techniques_needing_descriptions) - 1:
                time.sleep(3)
        
        # Save enhanced techniques
        backup_filename = f"{filename}.backup"
        
        # Create backup
        with open(backup_filename, 'w', encoding='utf-8') as f:
            json.dump(techniques, f, indent=2, ensure_ascii=False)
        print(f"💾 Created backup: {backup_filename}")
        
        # Save enhanced version
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(techniques, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Enhanced {platform} techniques:")
        print(f"  📊 Total techniques: {len(techniques)}")
        print(f"  📝 Successfully added descriptions: {successful_fetches}")
        print(f"  📄 Updated file: {filename}")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        return False
    except Exception as e:
        print(f"❌ Error enhancing {platform}: {e}")
        return False

def main():
    platforms_to_enhance = [
        'windows', 'macos', 'linux', 'cloud', 
        'officesuite', 'identity_provider', 'saas', 'iaas', 'network_devices'
    ]
    
    # Skip containers and AI as they already have descriptions
    print("🚀 MITRE Technique Description Enhancement")
    print("=" * 60)
    print("📋 Platforms to enhance:")
    for platform in platforms_to_enhance:
        print(f"  • {platform}")
    print("")
    print("⚠️ Note: Skipping 'containers' and 'ai' platforms (already have descriptions)")
    print("=" * 60)
    print("")
    
    successful_platforms = []
    failed_platforms = []
    
    for i, platform in enumerate(platforms_to_enhance):
        print(f"\n🎯 [{i+1}/{len(platforms_to_enhance)}] Processing {platform.upper()} platform...")
        print("-" * 50)
        
        if enhance_platform_descriptions(platform):
            successful_platforms.append(platform)
        else:
            failed_platforms.append(platform)
        
        # Add delay between platforms
        if i < len(platforms_to_enhance) - 1:
            print("⏳ Waiting 30 seconds before next platform...")
            time.sleep(30)
    
    # Final summary
    print("\n" + "=" * 60)
    print("📊 DESCRIPTION ENHANCEMENT SUMMARY")
    print("=" * 60)
    print(f"✅ Successful platforms ({len(successful_platforms)}):")
    for platform in successful_platforms:
        print(f"  • {platform}")
    
    if failed_platforms:
        print(f"\n❌ Failed platforms ({len(failed_platforms)}):")
        for platform in failed_platforms:
            print(f"  • {platform}")
    
    print(f"\n🎉 Enhancement complete!")
    print("📝 Next step: Import enhanced files using: node import_all_fresh.cjs")

if __name__ == "__main__":
    main() 