import React from 'react';
import { 
  Brain, 
  Router, 
  Cloud, 
  Container, 
  Shield, 
  Building, 
  UserCheck, 
  Globe, 
  Server,
  Monitor,
  Laptop,
  Smartphone
} from 'lucide-react';

const iconMap = {
  // Cloud Providers - using actual uploaded filenames
  AWS: '/icons/icons8-aws-48.png',
  Azure: '/icons/icons8-azure-48.png',
  GCP: '/icons/icons8-google-cloud-48.png',
  Oracle: '/icons/icons8-oracle-48.png',
  
  // Operating Systems - using actual uploaded filenames
  Windows: '/icons/icons8-windows-10-48.png',
  macOS: '/icons/icons8-macos-50.png',
  Linux: '/icons/icons8-linux-48.png',
  
  // Others - using actual uploaded filenames
  Containers: '/icons/icons8-docker-48.png',
  Cloud: '/icons/icons8-cloud-64.png',
  
  // Office and Identity platforms - will use local files when available
  'Office Suite': '/icons/office.png',
  'Identity Provider': '/icons/identity.png',
  SaaS: '/icons/saas.png',
  IaaS: '/icons/iaas.png',
};

// Fallback Lucide icons for platforms that don't have local images
const lucideIconMap = {
  'Network Devices': Router,
  AI: Brain,
  Cloud: Cloud,
  Containers: Container,
  'Office Suite': Building,
  'Identity Provider': UserCheck,
  SaaS: Globe,
  IaaS: Server,
  Windows: Monitor,
  macOS: Laptop,
  Linux: Smartphone,
};

export default function PlatformIcon({ platform, className, variant = 'default' }) {
  // First priority: Check if we have a local image for this platform
  const src = iconMap[platform];
  if (src) {
    // Special styling for macOS based on variant
    const macOSClasses = platform === 'macOS' && variant === 'analytics'
      ? className // Black in analytics only
      : platform === 'macOS'
      ? `${className} dark:filter dark:brightness-0 dark:invert` // White in dark mode for default, sidebar, and matrix
      : className; // Default behavior for other platforms
    
    return (
      <img 
        src={src} 
        alt={`${platform} icon`} 
        className={macOSClasses}
        onError={(e) => {
          // Hide the broken image and show fallback
          e.target.style.display = 'none';
          console.warn(`Failed to load icon for ${platform}: ${src}`);
        }}
      />
    );
  }
  
  // Second priority: Check if we have a Lucide icon for this platform
  const LucideIcon = lucideIconMap[platform];
  if (LucideIcon) {
    const iconColor = platform === 'AI' ? 'text-purple-600' : 
                     platform === 'Network Devices' ? 'text-blue-600' :
                     platform === 'Office Suite' ? 'text-orange-500' :
                     platform === 'Identity Provider' ? 'text-green-600' :
                     platform === 'SaaS' ? 'text-indigo-500' :
                     platform === 'IaaS' ? 'text-gray-600' :
                     'text-gray-500';
    
    return <LucideIcon className={`${className} ${iconColor}`} />;
  }
  
  // Final fallback: Shield icon for unknown platforms
  return <Shield className={`${className} text-gray-500`} />;
}