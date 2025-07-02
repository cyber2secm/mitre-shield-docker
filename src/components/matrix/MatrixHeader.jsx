import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Shield, Target, Activity, Cloud, ChevronDown, Layers } from "lucide-react";
import { motion } from "framer-motion";
import PlatformIcon from "@/components/PlatformIcon"; // New import for custom PlatformIcon component

// Custom cloud provider icons component
// This component now uses the generic PlatformIcon to render cloud provider specific icons
const CloudProviderIcon = ({ provider }) => {
  return <PlatformIcon platform={provider} className="w-4 h-4 mr-2" />;
};

export default function MatrixHeader({ platform, filters, setFilters, totalRules, techniqueBreakdown, currentPlatform, isCloudPlatform }) {
  const [isCloudDropdownOpen, setIsCloudDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCloudDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keep dropdown open when switching between cloud services
  useEffect(() => {
    if (["Office Suite", "Identity Provider", "SaaS", "IaaS"].includes(filters.platform)) {
      setIsCloudDropdownOpen(true);
    }
  }, [filters.platform]);

  const cloudOptions = [
    { value: "cloud", label: "Cloud Infrastructure", description: "AWS, Azure, GCP, Oracle" },
    { value: "office_suite", label: "Office Suite", description: "Microsoft 365, SharePoint, Teams" },
    { value: "identity_provider", label: "Identity Provider", description: "Authentication & SSO services" },
    { value: "saas", label: "SaaS", description: "Software as a Service platforms" },
    { value: "iaas", label: "IaaS", description: "Infrastructure as a Service" }
  ];

  const getCurrentCloudOption = () => {
    if (filters.platform === "Cloud") return cloudOptions[0];
    if (filters.platform === "Office Suite") return cloudOptions[1];
    if (filters.platform === "Identity Provider") return cloudOptions[2];
    if (filters.platform === "SaaS") return cloudOptions[3];
    if (filters.platform === "IaaS") return cloudOptions[4];
    return cloudOptions[0];
  };

  const handleCloudOptionClick = (option) => {
    if (option.value === "cloud") {
      setFilters(prev => ({ ...prev, platform: "Cloud" }));
      setIsCloudDropdownOpen(false); // Close when selecting Cloud Infrastructure
    } else {
      // For cloud services, update platform and explicitly keep dropdown open
      if (option.value === "office_suite") {
        setFilters(prev => ({ ...prev, platform: "Office Suite" }));
      } else if (option.value === "identity_provider") {
        setFilters(prev => ({ ...prev, platform: "Identity Provider" }));
      } else if (option.value === "saas") {
        setFilters(prev => ({ ...prev, platform: "SaaS" }));
      } else if (option.value === "iaas") {
        setFilters(prev => ({ ...prev, platform: "IaaS" }));
      }
      // Don't change the dropdown state - it will stay open
    }
  };

  // PLATFORM_ICONS is no longer needed as PlatformIcon component handles icon selection
  // The custom CloudProviderIcon component also now uses PlatformIcon

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
      <div className="px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-lg p-2">
                {/* Use the new PlatformIcon component for the main header icon */}
                {/* The "All Platforms" view uses the Shield icon as per the outline, otherwise PlatformIcon */}
                {/* The conditional now uses the 'platform' prop and checks for 'all' */}
                {platform && platform !== "all" ? (
                  <PlatformIcon platform={platform} className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {currentPlatform === "All Platforms" ? "MITRE ATT&CK Matrix" : `${currentPlatform} - MITRE ATT&CK Matrix`}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  {currentPlatform === "All Platforms" 
                    ? "Comprehensive threat detection coverage across all platforms" 
                    : currentPlatform === "Cloud"
                    ? "Threat detection coverage for cloud environments (AWS, Azure, GCP, Oracle)"
                    : `Threat detection coverage for ${currentPlatform.toLowerCase()}` 
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.div 
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Target className="w-6 h-6 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-xl">{techniqueBreakdown.parentCount}</span>
                <span className="text-xs font-medium">Techniques</span>
              </div>
            </motion.div>
            <motion.div 
              className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Layers className="w-6 h-6 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-xl">{techniqueBreakdown.subCount}</span>
                <span className="text-xs font-medium">Sub-techniques</span>
              </div>
            </motion.div>
            <motion.div 
              className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Activity className="w-6 h-6 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-xl">{totalRules}</span>
                <span className="text-xs font-medium">Rules</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <Input
              placeholder="Search techniques, IDs, or descriptions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-4">
            {/* Cloud Service Categories - Custom dropdown that stays open */}
            {isCloudPlatform && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setIsCloudDropdownOpen(!isCloudDropdownOpen)}
                  className="w-56 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 justify-start"
                >
                  <Cloud className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                  <span className="flex-1 text-left truncate">{getCurrentCloudOption().label}</span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isCloudDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {isCloudDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                    {cloudOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCloudOptionClick(option)}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0 ${
                          getCurrentCloudOption().value === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cloud Provider Filter - Only show when viewing core Cloud platform */}
            {filters.platform === "Cloud" && (
              <Select 
                value={filters.cloudProvider || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, cloudProvider: value }))}
              >
                <SelectTrigger className="w-48 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <Cloud className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                  <SelectValue placeholder="Cloud Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="AWS">
                    <div className="flex items-center">
                      <CloudProviderIcon provider="AWS" />
                      AWS
                    </div>
                  </SelectItem>
                  <SelectItem value="Azure">
                    <div className="flex items-center">
                      <CloudProviderIcon provider="Azure" />
                      Azure
                    </div>
                  </SelectItem>
                  <SelectItem value="GCP">
                    <div className="flex items-center">
                      <CloudProviderIcon provider="GCP" />
                      GCP
                    </div>
                  </SelectItem>
                  <SelectItem value="Oracle">
                    <div className="flex items-center">
                      <CloudProviderIcon provider="Oracle" />
                      Oracle
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-48 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <Filter className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Testing">Testing</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
