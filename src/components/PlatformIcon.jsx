import React from 'react';

const iconMap = {
  // Cloud Providers
  AWS: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0636a8951_icons8-aws-48.png',
  Azure: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ae0e237ef_icons8-azure-48.png',
  GCP: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15f0fd6ab_icons8-google-cloud-48.png',
  Oracle: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d92840202_icons8-oracle-48.png',
  // Operating Systems
  Windows: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd533c5d9_icons8-windows-10-48.png',
  macOS: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8355f8227_icons8-macos-50.png',
  Linux: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f1887d837_icons8-linux-48.png',
  // Others
  Containers: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e68ecd4a1_icons8-docker-48.png',
  Cloud: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/75b25a891_icons8-cloud-64.png',
};

export default function PlatformIcon({ platform, className }) {
  const src = iconMap[platform];
  if (!src) return null;
  return <img src={src} alt={`${platform} icon`} className={className} />;
}