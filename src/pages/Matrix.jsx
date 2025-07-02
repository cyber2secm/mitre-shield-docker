import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DetectionRule, MitreTechnique } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MatrixHeader from "../components/matrix/MatrixHeader";
import TacticCard from "../components/matrix/TacticCard";
import TacticDetailModal from "../components/matrix/TacticDetailModal";

// Default tactic order for consistent display
const DEFAULT_TACTIC_ORDER = [
  "Initial Access",
  "Execution", 
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact"
];

// Cloud-specific tactics (exactly as specified - no Command and Control)
const CLOUD_TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
  "Impact"
];

// Container-specific tactics (remove Collection and Command and Control)
const CONTAINER_TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Exfiltration",
  "Impact"
];

export default function MatrixPage() {
  const [techniques, setTechniques] = useState([]);
  const [rules, setRules] = useState([]);
  const [tactics, setTactics] = useState([]);
  const [selectedTactic, setSelectedTactic] = useState(null);
  const [filters, setFilters] = useState({
    platform: "all",
    search: "",
    status: "all",
    cloudProvider: "all"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Add state for platform-specific data
  const [platformTechniques, setPlatformTechniques] = useState([]);
  const [platformRules, setPlatformRules] = useState([]);

  // Get platform from URL parameters - using useLocation for reactive updates
  const location = useLocation();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const platformParam = urlParams.get('platform');
    const cloudProviderParam = urlParams.get('cloudProvider');

    // Default to 'Windows' if no platform is specified or if 'all' is explicitly used
    if (!platformParam || platformParam === 'all') {
      setFilters(prev => ({ 
        ...prev, 
        platform: 'Windows',
        cloudProvider: "all"
      }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        platform: platformParam,
        // Reset cloud filters when switching to non-Cloud platforms
        cloudProvider: platformParam === "Cloud" ? (cloudProviderParam || "all") : "all"
      }));
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, []);

  // Filter data when platform or cloudProvider changes
  useEffect(() => {
    let filteredTechniques = [];
    let filteredRules = [];

    if (filters.platform === "Cloud") {
      // For Cloud platform, include techniques that support AWS, Azure, GCP, or Oracle
      filteredTechniques = techniques.filter(t => 
        t.platforms?.some(p => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(p))
      );
      filteredRules = rules.filter(r => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(r.platform));
      
      // Apply cloud provider filter if specified
      if (filters.cloudProvider && filters.cloudProvider !== "all") {
        filteredRules = filteredRules.filter(r => r.platform === filters.cloudProvider);
      }
    } else if (filters.platform === "all") {
      filteredTechniques = techniques;
      filteredRules = rules;
    } else {
      // Specific platform like "Windows", "Linux", "Office Suite", "Identity Provider", etc.
      filteredTechniques = techniques.filter(t => t.platforms?.includes(filters.platform));
      filteredRules = rules.filter(r => r.platform === filters.platform);
    }

    setPlatformTechniques(filteredTechniques);
    setPlatformRules(filteredRules);
  }, [techniques, rules, filters.platform, filters.cloudProvider]);

  // Calculate technique breakdown
  const getTechniqueBreakdown = () => {
    const parentTechniques = platformTechniques.filter(t => !t.is_subtechnique);
    const subTechniques = platformTechniques.filter(t => t.is_subtechnique);
    
    return {
      parentCount: parentTechniques.length,
      subCount: subTechniques.length,
      totalCount: platformTechniques.length
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [techniqueData, ruleData] = await Promise.all([
        MitreTechnique.list(),
        DetectionRule.list()
      ]);
      setTechniques(techniqueData);
      setRules(ruleData);
      
      // Extract unique tactics from techniques and sort them
      const uniqueTactics = [...new Set(techniqueData.map(t => t.tactic).filter(Boolean))];
      const sortedTactics = uniqueTactics.sort((a, b) => {
        const aIndex = DEFAULT_TACTIC_ORDER.indexOf(a);
        const bIndex = DEFAULT_TACTIC_ORDER.indexOf(b);
        
        // If both tactics are in the default order, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in the default order, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // If neither is in the default order, sort alphabetically
        return a.localeCompare(b);
      });
      setTactics(sortedTactics);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setIsLoading(false);
  };

  const getTacticStats = (tactic) => {
    // Get all techniques for the tactic for the current platform
    let platformTechniques = techniques.filter(t => t.tactic === tactic);
    
    if (filters.platform === "Cloud") {
      // For Cloud platform, include techniques that support AWS, Azure, GCP, or Oracle
      platformTechniques = platformTechniques.filter(t => 
        t.platforms?.some(p => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(p))
      );
    } else if (filters.platform !== "all") {
      platformTechniques = platformTechniques.filter(t => t.platforms?.includes(filters.platform));
    }

    // Separate parent techniques and sub-techniques for accurate counting
    const parentTechniques = platformTechniques.filter(t => !t.is_subtechnique);
    const subTechniques = platformTechniques.filter(t => t.is_subtechnique);
    
    // Calculate rule counts - Apply cloud provider filter if on Cloud platform
    let filteredRules = rules.filter(rule => 
      platformTechniques.some(tech => tech.technique_id === rule.technique_id) &&
      rule.tactic === tactic
    );
    
    if (filters.platform === "Cloud") {
      filteredRules = filteredRules.filter(r => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(r.platform));
      
      // Apply cloud provider filter if specified
      if (filters.cloudProvider && filters.cloudProvider !== "all") {
        filteredRules = filteredRules.filter(r => r.platform === filters.cloudProvider);
      }
    } else if (filters.platform !== "all") {
      filteredRules = filteredRules.filter(r => r.platform === filters.platform);
    }
    
    const activeRules = filteredRules.filter(rule => rule.status === "Active");
    const testingRules = filteredRules.filter(rule => rule.status === "Testing");

    // Apply search filter only for the techniques to be displayed/counted
    let searchedTechniques = [...platformTechniques];
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      searchedTechniques = searchedTechniques.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.technique_id.toLowerCase().includes(searchTerm)
      );
    }
    
    return {
      // Display parent technique count (main number shown on cards)
      techniqueCount: parentTechniques.length,
      // Additional breakdown for detailed view
      parentTechniqueCount: parentTechniques.length,
      subTechniqueCount: subTechniques.length,
      totalTechniqueCount: platformTechniques.length,
      ruleCount: filteredRules.length,
      activeRules: activeRules.length,
      testingRules: testingRules.length,
      techniques: searchedTechniques,
    };
  };

  const getCurrentPlatformName = () => {
    if (filters.platform === "all") return "All Platforms"; 
    if (filters.platform === "Cloud") {
      let name = "Cloud";
      
      if (filters.cloudProvider && filters.cloudProvider !== "all") {
        name += ` (${filters.cloudProvider})`;
      }
      
      return name;
    }
    return filters.platform;
  };

  const getFilteredTactics = () => {
    // Filter tactics based on search and status filters
    return tactics.filter(tactic => {
      // Apply search filter to tactic name
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const tacticNameMatches = tactic.toLowerCase().includes(searchTerm);
        
        // Also check if any techniques match the search
        const stats = getTacticStats(tactic);
        const hasMatchingTechniques = stats.techniques.length > 0;
        
        if (!tacticNameMatches && !hasMatchingTechniques) {
          return false;
        }
      }
      
      // Apply status filter
      if (filters.status !== "all") {
        const stats = getTacticStats(tactic);
        const hasMatchingRule = stats.activeRules > 0 && filters.status === "Active" ||
                               stats.testingRules > 0 && filters.status === "Testing";
        if (!hasMatchingRule) {
          return false;
        }
      }
      
      // For platform filtering, check if tactic has any techniques for the platform
      const stats = getTacticStats(tactic);
      return stats.techniqueCount > 0;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MatrixHeader 
        filters={filters}
        setFilters={setFilters}
        totalRules={platformRules.length}
        techniqueBreakdown={getTechniqueBreakdown()}
        platform={filters.platform}
        currentPlatform={getCurrentPlatformName()}
        isCloudPlatform={["Cloud", "Office Suite", "Identity Provider", "SaaS", "IaaS"].includes(filters.platform)}
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {getFilteredTactics().map((tactic, index) => (
                <motion.div
                  key={tactic}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TacticCard
                    tactic={tactic}
                    stats={getTacticStats(tactic)}
                    onClick={() => setSelectedTactic(tactic)}
                    isLoading={isLoading}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {getFilteredTactics().length === 0 && !isLoading && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Tactics Found</h3>
              <p className="text-sm">
                No tactics found for {getCurrentPlatformName()} matching your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      <TacticDetailModal
        tactic={selectedTactic}
        techniques={selectedTactic ? getTacticStats(selectedTactic).techniques : []}
        rules={rules}
        onClose={() => setSelectedTactic(null)}
        onRuleUpdate={loadData}
        currentPlatform={filters.platform}
        currentCloudProvider={filters.cloudProvider}
      />
    </div>
  );
}
