

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Database, Settings, BarChart3, ListChecks, Clock } from "lucide-react"; // Added Clock import
import { DetectionRule, MitreTechnique } from "@/api/entities";
import PlatformIcon from "@/components/PlatformIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Rule Management",
    url: createPageUrl("Rules"),
    icon: Database,
    description: "Manage detection rules"
  },
  {
    title: "Future Rules",
    url: createPageUrl("FutureRules"),
    icon: Clock,
    description: "Plan upcoming rules"
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
    description: "Coverage and performance metrics"
  }
];

const platformItems = [
  {
    title: "Windows",
    platform: "Windows",
    url: createPageUrl("Matrix?platform=Windows"),
    description: "Windows-specific techniques"
  },
  {
    title: "macOS",
    platform: "macOS",
    url: createPageUrl("Matrix?platform=macOS"),
    description: "macOS-specific techniques"
  },
  {
    title: "Linux",
    platform: "Linux",
    url: createPageUrl("Matrix?platform=Linux"),
    description: "Linux-specific techniques"
  },
  {
    title: "Cloud",
    platform: "Cloud",
    url: createPageUrl("Matrix?platform=Cloud"),
    description: "Cloud-specific techniques (AWS, Azure, GCP)"
  },
  {
    title: "Containers",
    platform: "Containers",
    url: createPageUrl("Matrix?platform=Containers"),
    description: "Container-specific techniques"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const currentPlatform = urlParams.get('platform') || 'all'; 
  
  const [stats, setStats] = useState({
    activeRules: 0,
    testingRules: 0,
    coverage: 0
  });

  // Load stats on mount and refresh periodically
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [allRules, allTechniques] = await Promise.all([
        DetectionRule.list("-created_date", 10000), // Fetch up to 10,000 rules
        MitreTechnique.list("-created_date", 10000) // Fetch up to 10,000 techniques
      ]);

      // Always calculate stats for ALL platforms, not filtered by current platform
      const activeRules = allRules.filter(r => r.status === 'Active');
      const testingRules = allRules.filter(r => r.status === 'Testing');
      
      // Calculate coverage based on unique techniques covered by active rules
      const coveredTechniqueIds = new Set(
        activeRules.map(r => r.technique_id)
      );
      
      // Count how many techniques are actually covered
      const coveredTechniquesCount = allTechniques.filter(t => 
        coveredTechniqueIds.has(t.technique_id)
      ).length;
      
      const coverage = allTechniques.length > 0 
        ? Math.round((coveredTechniquesCount / allTechniques.length) * 100) 
        : 0;

      // Debug logging
      console.log('Stats Debug:', {
        totalRules: allRules.length,
        totalTechniques: allTechniques.length,
        activeRulesCount: activeRules.length,
        testingRulesCount: testingRules.length,
        coveredTechniquesCount: coveredTechniquesCount,
        coverage: coverage
      });

      setStats({
        activeRules: activeRules.length,
        testingRules: testingRules.length,
        coverage
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default values on error
      setStats({
        activeRules: 0,
        testingRules: 0,
        coverage: 0
      });
    }
  };

  const isCurrentPage = (url) => {
    // Extract path and query from the URL
    const [path, query] = url.split('?');
    const currentPath = location.pathname;
    
    if (path !== currentPath) return false;
    
    // If there's no query in the URL, it matches if current has no relevant params
    if (!query) return !urlParams.get('platform');
    
    // Check if the platform parameter matches
    const urlPlatform = new URLSearchParams(query).get('platform');
    return urlPlatform === currentPlatform;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200/60 bg-white/95 backdrop-blur-sm shadow-sm">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">MITRE Shield</h2>
                <p className="text-xs text-slate-500 font-medium">ATT&CK Rule Manager</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`w-full justify-start hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg p-4 min-h-[60px] ${
                          isCurrentPage(item.url)
                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                            : 'text-slate-700 hover:shadow-sm'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold text-sm truncate leading-tight">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-1 truncate leading-tight">{item.description}</div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Platforms
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {platformItems.map((item) => {
                    const isActive = isCurrentPage(item.url);
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`w-full justify-start hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-lg p-3 min-h-[56px] ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                              : 'text-slate-700 hover:shadow-sm'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 w-full">
                            <PlatformIcon platform={item.platform} className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-sm truncate leading-tight">{item.title}</div>
                              <div className="text-xs text-slate-500 mt-1 truncate leading-tight">{item.description}</div>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span className="text-emerald-700 font-medium flex-1">Active Rules</span>
                    <span className="font-bold text-emerald-800">{stats.activeRules}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                    <span className="text-amber-700 font-medium flex-1">Testing</span>
                    <span className="font-bold text-amber-800">{stats.testingRules}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span className="text-slate-700 font-medium flex-1">Coverage</span>
                    <span className="font-bold text-slate-800">{stats.coverage}%</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">SA</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">Security Analyst</p>
                <p className="text-xs text-slate-500 truncate">Threat Detection Team</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">MITRE Shield</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

