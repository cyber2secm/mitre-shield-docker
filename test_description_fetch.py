#!/usr/bin/env python3
"""
Test script to debug MITRE technique description fetching
"""

import requests
from bs4 import BeautifulSoup
import re

def test_fetch_description(technique_id):
    """Test fetching description for a specific technique"""
    print(f"🔍 Testing description fetch for {technique_id}")
    
    if '.' in technique_id:
        # Sub-technique URL format
        base_id, sub_id = technique_id.split('.')
        url = f"https://attack.mitre.org/techniques/{base_id}/{sub_id}/"
    else:
        # Parent technique URL format
        url = f"https://attack.mitre.org/techniques/{technique_id}/"
    
    print(f"🌐 URL: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"✅ HTTP {response.status_code}")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Print page title for verification
        title = soup.find('title')
        if title:
            print(f"📄 Page title: {title.get_text(strip=True)}")
        
        # Test different selectors
        selectors_to_try = [
            '.description-body',
            '.technique-description', 
            '[data-description]',
            '.card-data p',
            '.card-data',
            'p',
            '.technique-content'
        ]
        
        print("\n🔍 Testing CSS selectors:")
        for selector in selectors_to_try:
            elements = soup.select(selector)
            print(f"  {selector}: Found {len(elements)} elements")
            if elements and hasattr(elements[0], 'get_text'):
                text = elements[0].get_text(strip=True)[:200]
                print(f"    First element text: {text}...")
        
        # Look for any div with substantial text content
        print("\n🔍 Looking for divs with substantial content:")
        divs = soup.find_all('div')
        for i, div in enumerate(divs):
            if hasattr(div, 'get_text'):
                text = div.get_text(strip=True)
                if len(text) > 100 and not text.startswith('MITRE ATT&CK'):
                    print(f"  Div {i}: {text[:200]}...")
                    if i > 5:  # Limit output
                        break
        
        # Save the HTML for manual inspection
        with open(f'debug_{technique_id.replace(".", "_")}.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"\n💾 Saved HTML to debug_{technique_id.replace('.', '_')}.html")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Test with a few known techniques
    test_techniques = ['T1078', 'T1078.001', 'T1613']
    
    for tech_id in test_techniques:
        print("\n" + "="*60)
        test_fetch_description(tech_id) 