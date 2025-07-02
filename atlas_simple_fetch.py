#!/usr/bin/env python3
"""
Simple ATLAS Page Fetcher
Fetches and examines the content of the ATLAS matrices page
"""

import requests
import urllib3
from datetime import datetime

# Disable SSL warnings for development/testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_page_content(url):
    """Fetch page content and show details"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    print(f"🔍 Fetching: {url}")
    print(f"🕐 Time: {datetime.now()}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        print(f"✅ Status Code: {response.status_code}")
        print(f"📏 Content Length: {len(response.text)} characters")
        print(f"📋 Content Type: {response.headers.get('content-type', 'Unknown')}")
        
        print(f"\n📄 Response Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        print(f"\n📖 Full Page Content:")
        print("=" * 80)
        print(response.text)
        print("=" * 80)
        
        return response.text
            
    except requests.RequestException as e:
        print(f"❌ Request Error: {e}")
        return None

def main():
    print("🚀 ATLAS Data Fetcher")
    print("=" * 50)
    
    # Try the GitHub raw data URL
    github_url = "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/ATLAS.yaml"
    print(f"\n🔄 Trying ATLAS data from GitHub repository...")
    
    content = fetch_page_content(github_url)
    
    if content:
        print(f"\n✅ Successfully fetched ATLAS data: {len(content)} characters")
        
        # Parse and display basic info about the YAML content
        if 'matrices:' in content:
            print(f"📊 YAML content appears to contain matrix data")
            lines = content.split('\n')
            print(f"📏 Total lines: {len(lines)}")
            
            # Show first 50 lines as preview
            print(f"\n📖 First 50 lines preview:")
            print("-" * 60)
            for i, line in enumerate(lines[:50]):
                print(f"{i+1:3d}: {line}")
            print("-" * 60)
            print(f"... (showing first 50 of {len(lines)} total lines)")
        else:
            print(f"⚠️  Content doesn't appear to be ATLAS matrix data")
    else:
        print(f"\n❌ Failed to fetch ATLAS data")

if __name__ == "__main__":
    main() 