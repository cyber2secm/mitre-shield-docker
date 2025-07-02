#!/usr/bin/env python3
"""
Progress checker for description enhancement
"""

import json
import os
from datetime import datetime

def check_platform_progress(platform):
    """Check description progress for a platform"""
    filename = f"mitreshire_{platform}_techniques.json"
    
    if not os.path.exists(filename):
        return None, None, "File not found"
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            techniques = json.load(f)
        
        total = len(techniques)
        with_descriptions = len([t for t in techniques if t.get('description', '').strip()])
        
        return total, with_descriptions, "OK"
    except Exception as e:
        return None, None, f"Error: {e}"

def main():
    platforms = [
        'windows', 'macos', 'linux', 'cloud', 'containers',
        'officesuite', 'identity_provider', 'saas', 'iaas', 'network_devices', 'ai'
    ]
    
    print("📊 DESCRIPTION ENHANCEMENT PROGRESS CHECK")
    print("=" * 60)
    print(f"🕐 Current time: {datetime.now().strftime('%H:%M:%S')}")
    print("")
    
    total_techniques = 0
    total_with_descriptions = 0
    
    for platform in platforms:
        total, with_desc, status = check_platform_progress(platform)
        
        if total is not None and with_desc is not None:
            percentage = int((with_desc / total) * 100) if total > 0 else 0
            progress_bar = "█" * (percentage // 5) + "░" * (20 - (percentage // 5))
            
            print(f"{platform:<18} │{progress_bar}│ {with_desc:>3}/{total:<3} ({percentage:>3}%)")
            
            total_techniques += total
            total_with_descriptions += with_desc
        else:
            print(f"{platform:<18} │{'░' * 20}│ {status}")
    
    print("-" * 60)
    overall_percentage = int((total_with_descriptions / total_techniques) * 100) if total_techniques > 0 else 0
    overall_bar = "█" * (overall_percentage // 5) + "░" * (20 - (overall_percentage // 5))
    
    print(f"{'OVERALL':<18} │{overall_bar}│ {total_with_descriptions:>3}/{total_techniques:<3} ({overall_percentage:>3}%)")
    print("=" * 60)
    
    if overall_percentage == 100:
        print("🎉 All techniques have descriptions!")
    elif overall_percentage > 0:
        print(f"🔄 Enhancement in progress... {total_techniques - total_with_descriptions} techniques remaining")
    else:
        print("⏳ Enhancement not started yet")

if __name__ == "__main__":
    main() 