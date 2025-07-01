import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Shield, Target, Activity, Cloud } from "lucide-react";
import { motion } from "framer-motion";
import PlatformIcon from "@/components/PlatformIcon"; // New import for custom PlatformIcon component

// Custom cloud provider icons component
// This component now uses the generic PlatformIcon to render cloud provider specific icons
const CloudProviderIcon = ({ provider }) => {
  return <PlatformIcon platform={provider} className="w-4 h-4 mr-2" />;
};

export default function MatrixHeader({ platform, filters, setFilters, totalRules, totalTechniques, currentPlatform, isCloudPlatform }) {
  // PLATFORM_ICONS is no longer needed as PlatformIcon component handles icon selection
  // The custom CloudProviderIcon component also now uses PlatformIcon

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
      <div className="px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shadow-lg p-2">
                {/* Use the new PlatformIcon component for the main header icon */}
                {/* The "All Platforms" view uses the Shield icon as per the outline, otherwise PlatformIcon */}
                {/* The conditional now uses the 'platform' prop and checks for 'all' */}
                {platform && platform !== "all" ? (
                  <PlatformIcon platform={platform} className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentPlatform === "All Platforms" ? "MITRE ATT&CK Matrix" : `${currentPlatform} - MITRE ATT&CK Matrix`}
                </h1>
                <p className="text-slate-600 text-sm font-medium">
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
            <div className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
              <Target className="w-6 h-6 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-xl">{totalTechniques}</span>
                <span className="text-xs font-medium">Techniques</span>
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
              <Activity className="w-6 h-6 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-xl">{totalRules}</span>
                <span className="text-xs font-medium">Rules</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search techniques, IDs, or descriptions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 bg-white/90 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>

          <div className="flex gap-4">
            {/* Cloud Service Categories - Only show when viewing Cloud platform */}
            {isCloudPlatform && (
              <Select 
                value={filters.cloudService || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, cloudService: value }))}
              >
                <SelectTrigger className="w-56 bg-white/90 border-slate-200">
                  <Cloud className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Cloud Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Office Suite">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-blue-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">O</span>
                      </div>
                      Office Suite
                    </div>
                  </SelectItem>
                  <SelectItem value="Identity Provider">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-green-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">I</span>
                      </div>
                      Identity Provider
                    </div>
                  </SelectItem>
                  <SelectItem value="SaaS">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-purple-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      SaaS
                    </div>
                  </SelectItem>
                  <SelectItem value="IaaS">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-orange-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">I</span>
                      </div>
                      IaaS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Cloud Provider Filter - Only show when viewing Cloud platform */}
            {isCloudPlatform && (
              <Select 
                value={filters.cloudProvider || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, cloudProvider: value }))}
              >
                <SelectTrigger className="w-48 bg-white/90 border-slate-200">
                  <Cloud className="w-4 h-4 mr-2 text-slate-400" />
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
              <SelectTrigger className="w-48 bg-white/90 border-slate-200">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
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
