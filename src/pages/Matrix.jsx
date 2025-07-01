
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DetectionRule, MitreTechnique } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MatrixHeader from "../components/matrix/MatrixHeader";
import TacticCard from "../components/matrix/TacticCard";
import TacticDetailModal from "../components/matrix/TacticDetailModal";

const TACTICS = [
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
  const [selectedTactic, setSelectedTactic] = useState(null);
  const [filters, setFilters] = useState({
    platform: "all",
    search: "",
    status: "all",
    cloudProvider: "all" // New: Add cloudProvider filter
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
      setFilters(prev => ({ ...prev, platform: 'Windows' }));
    } else {
      setFilters(prev => ({ ...prev, platform: platformParam }));
    }

    if (cloudProviderParam) {
      setFilters(prev => ({ ...prev, cloudProvider: cloudProviderParam }));
    }
  }, [location.search]); // React to location.search changes

  useEffect(() => {
    loadData();
  }, []);

  // Filter data when platform or cloudProvider changes
  useEffect(() => {
    let filteredTechniques = [];
    let filteredRules = [];

    // The 'all' platform case is removed, as filters.platform will now always be a specific platform or 'Cloud'.
    // The initial useEffect ensures filters.platform is never 'all' now.
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
    } else { // Specific platform like "Windows", "Linux", "Containers" etc.
      filteredTechniques = techniques.filter(t => t.platforms?.includes(filters.platform));
      filteredRules = rules.filter(r => r.platform === filters.platform);
    }

    setPlatformTechniques(filteredTechniques);
    setPlatformRules(filteredRules);
  }, [techniques, rules, filters.platform, filters.cloudProvider]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [techniqueData, ruleData] = await Promise.all([
        MitreTechnique.list(),
        DetectionRule.list()
      ]);
      setTechniques(techniqueData);
      setRules(ruleData);
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
    } else { // Since 'all' platform is removed, this handles specific platforms directly
      platformTechniques = platformTechniques.filter(t => t.platforms?.includes(filters.platform));
    }
    
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
    } else { // Since 'all' platform is removed, this handles specific platforms directly
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
      techniqueCount: searchedTechniques.length,
      ruleCount: filteredRules.length,
      activeRules: activeRules.length,
      testingRules: testingRules.length,
      techniques: searchedTechniques,
    };
  };

  const getCurrentPlatformName = () => {
    // This check is now mostly redundant but safe to keep, as 'all' should no longer be set via URL.
    if (filters.platform === "all") return "All Platforms"; 
    if (filters.platform === "Cloud") {
      if (filters.cloudProvider && filters.cloudProvider !== "all") {
        return `Cloud (${filters.cloudProvider})`;
      }
      return "Cloud";
    }
    return filters.platform;
  };

  const getFilteredTactics = () => {
    // Use container-specific tactics when viewing Containers platform
    let tacticsToUse = TACTICS;
    if (filters.platform === "Cloud") {
      tacticsToUse = CLOUD_TACTICS;
    } else if (filters.platform === "Containers") {
      tacticsToUse = CONTAINER_TACTICS;
    }
    
    // For cloud platform, show all cloud tactics regardless of whether they have techniques
    if (filters.platform === "Cloud") {
      return CLOUD_TACTICS.filter(tactic => {
        // Apply search filter to tactic name
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const tacticNameMatches = tactic.toLowerCase().includes(searchTerm);
          
          // Also check if any techniques match the search
          const tacticTechniques = techniques.filter(t => 
            t.tactic === tactic && 
            t.platforms?.some(p => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(p))
          );
          const hasMatchingTechniques = tacticTechniques.some(t => 
            t.name.toLowerCase().includes(searchTerm) ||
            t.technique_id.toLowerCase().includes(searchTerm)
          );
          
          return tacticNameMatches || hasMatchingTechniques;
        }
        
        // For status filter, only hide if no rules match the status
        if (filters.status !== "all") {
          const tacticTechniques = techniques.filter(t => 
            t.tactic === tactic && 
            t.platforms?.some(p => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(p))
          );
          const techniqueIds = tacticTechniques.map(t => t.technique_id);
          const hasMatchingRule = rules.some(rule => 
            techniqueIds.includes(rule.technique_id) &&
            rule.status === filters.status &&
            ['AWS', 'Azure', 'GCP', 'Oracle'].includes(rule.platform) &&
            (filters.cloudProvider === "all" || rule.platform === filters.cloudProvider)
          );
          return hasMatchingRule;
        }
        
        // Always show all cloud tactics by default
        return true;
      });
    }
    
    // For containers platform, show only container tactics
    if (filters.platform === "Containers") {
      return CONTAINER_TACTICS.filter(tactic => {
        // Get all techniques for the tactic for containers platform
        let tacticTechniques = techniques.filter(t => t.tactic === tactic);
        tacticTechniques = tacticTechniques.filter(t => t.platforms?.includes(filters.platform));
        
        // Hide tactics that have no techniques for the selected platform (unless searching for the tactic name)
        if (tacticTechniques.length === 0) {
          if (filters.search && tactic.toLowerCase().includes(filters.search.toLowerCase())) {
            return true; // Still show if tactic name matches search, even if no techniques for platform
          }
          return false;
        }
        
        // Apply search filter to the tactic name or its techniques
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const tacticNameMatches = tactic.toLowerCase().includes(searchTerm);
          const hasMatchingTechniques = tacticTechniques.some(t => 
            t.name.toLowerCase().includes(searchTerm) ||
            t.technique_id.toLowerCase().includes(searchTerm)
          );
          if (!tacticNameMatches && !hasMatchingTechniques) {
            return false;
          }
        }

        // Apply status filter
        if (filters.status !== "all") {
          const techniqueIds = tacticTechniques.map(t => t.technique_id);
          const hasMatchingRule = rules.some(rule => 
            techniqueIds.includes(rule.technique_id) &&
            rule.status === filters.status &&
            rule.platform === filters.platform
          );
          if (!hasMatchingRule) {
            return false;
          }
        }

        return true;
      });
    }
    
    // For non-cloud, non-container platforms, use existing logic
    return tacticsToUse.filter(tactic => {
      // Get all techniques for the tactic for the current platform
      let tacticTechniques = techniques.filter(t => t.tactic === tactic);
      
      // Since filters.platform is guaranteed not to be "all", this filter is always applied.
      tacticTechniques = tacticTechniques.filter(t => t.platforms?.includes(filters.platform));
      
      // Hide tactics that have no techniques for the selected platform (unless searching for the tactic name)
      if (tacticTechniques.length === 0) {
        if (filters.search && tactic.toLowerCase().includes(filters.search.toLowerCase())) {
          return true; // Still show if tactic name matches search, even if no techniques for platform
        }
        return false;
      }
      
      // Apply search filter to the tactic name or its techniques
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const tacticNameMatches = tactic.toLowerCase().includes(searchTerm);
        const hasMatchingTechniques = tacticTechniques.some(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          t.technique_id.toLowerCase().includes(searchTerm)
        );
        if (!tacticNameMatches && !hasMatchingTechniques) {
          return false;
        }
      }

      // Apply status filter
      if (filters.status !== "all") {
        const techniqueIds = tacticTechniques.map(t => t.technique_id);
        const hasMatchingRule = rules.some(rule => 
          techniqueIds.includes(rule.technique_id) &&
          rule.status === filters.status &&
          rule.platform === filters.platform
        );
        if (!hasMatchingRule) {
          return false;
        }
      }

      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <MatrixHeader 
        filters={filters}
        setFilters={setFilters}
        totalRules={platformRules.length}
        totalTechniques={platformTechniques.length}
        platform={filters.platform}
        currentPlatform={getCurrentPlatformName()}
        isCloudPlatform={filters.platform === "Cloud"}
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
            <div className="text-center py-16 text-slate-500">
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
        currentCloudProvider={filters.cloudProvider} // Pass cloudProvider to modal if needed
      />
    </div>
  );
}
