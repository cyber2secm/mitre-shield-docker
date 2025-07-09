import React, { useState, useEffect, useMemo } from "react";
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
  const [isTechniqueLoading, setIsTechniqueLoading] = useState(false);

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

  // Filter data when platform or cloudProvider changes - memoized for performance
  const filteredData = useMemo(() => {
    let filteredTechniques = [];
    let filteredRules = [];

    console.log('🔍 Filtering data for platform:', filters.platform);
    console.log('📊 Total rules before filtering:', rules.length);
    console.log('📊 Total techniques before filtering:', techniques.length);

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
      // Specific platform like "Windows", "Linux", "macOS", "Office Suite", "Identity Provider", etc.
      console.log('🎯 Filtering for specific platform:', filters.platform);
      
      filteredTechniques = techniques.filter(t => t.platforms?.includes(filters.platform));
      console.log('📋 Techniques supporting platform:', filteredTechniques.length);
      
      filteredRules = rules.filter(r => r.platform === filters.platform);
      console.log('📋 Rules for platform:', filteredRules.length);
      
      // Debug: Log XDR rules for this platform
      const xdrRulesForPlatform = filteredRules.filter(r => 
        r.rule_id?.includes('-macos') || 
        r.rule_id?.includes('-linux') || 
        r.rule_id?.includes('-windows') ||
        r.description?.includes('XDR')
      );
      
      if (xdrRulesForPlatform.length > 0) {
        console.log('🚀 XDR Rules for platform', filters.platform + ':', xdrRulesForPlatform.length);
        xdrRulesForPlatform.forEach(rule => {
          console.log('📋 XDR Rule for platform:', {
            rule_id: rule.rule_id,
            name: rule.name,
            platform: rule.platform,
            technique_id: rule.technique_id,
            tactic: rule.tactic,
            status: rule.status
          });
        });
      }
      
      // Debug: Check for any rules that might be excluded
      const excludedRules = rules.filter(r => r.platform !== filters.platform);
      const excludedXdrRules = excludedRules.filter(r => 
        r.rule_id?.includes('-macos') || 
        r.rule_id?.includes('-linux') || 
        r.rule_id?.includes('-windows') ||
        r.description?.includes('XDR')
      );
      
      if (excludedXdrRules.length > 0) {
        console.log('❌ XDR Rules excluded from platform', filters.platform + ':', excludedXdrRules.length);
        excludedXdrRules.forEach(rule => {
          console.log('❌ Excluded XDR Rule:', {
            rule_id: rule.rule_id,
            name: rule.name,
            platform: rule.platform,
            technique_id: rule.technique_id,
            status: rule.status
          });
        });
      }
    }

    console.log('✅ Final filtered results:', {
      techniques: filteredTechniques.length,
      rules: filteredRules.length,
      platform: filters.platform
    });

    return { filteredTechniques, filteredRules };
  }, [techniques, rules, filters.platform, filters.cloudProvider]);

  // Update platform data when filtered data changes
  useEffect(() => {
    setPlatformTechniques(filteredData.filteredTechniques);
    setPlatformRules(filteredData.filteredRules);
  }, [filteredData]);

  // Calculate technique breakdown - memoized for performance
  const techniqueBreakdown = useMemo(() => {
    const parentTechniques = platformTechniques.filter(t => !t.is_subtechnique);
    const subTechniques = platformTechniques.filter(t => t.is_subtechnique);
    
    return {
      parentCount: parentTechniques.length,
      subCount: subTechniques.length,
      totalCount: platformTechniques.length
    };
  }, [platformTechniques]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [techniqueData, ruleData] = await Promise.all([
        MitreTechnique.list(),
        DetectionRule.list()
      ]);
      setTechniques(techniqueData);
      setRules(ruleData);
      
      // Debug: Log XDR rules and platform filtering
      const xdrRules = ruleData.filter(r => 
        r.rule_id?.includes('-macos') || 
        r.rule_id?.includes('-linux') || 
        r.rule_id?.includes('-windows') ||
        r.description?.includes('XDR')
      );
      
      if (xdrRules.length > 0) {
        console.log('🚀 XDR Rules Found:', xdrRules.length);
        xdrRules.forEach(rule => {
          console.log('📋 XDR Rule:', {
            rule_id: rule.rule_id,
            name: rule.name,
            platform: rule.platform,
            technique_id: rule.technique_id,
            tactic: rule.tactic,
            status: rule.status
          });
          
          // Check if technique exists for this rule
          const matchingTechnique = techniqueData.find(t => t.technique_id === rule.technique_id);
          console.log('🎯 Matching technique:', matchingTechnique ? 'YES' : 'NO', 
            matchingTechnique ? {
              technique_id: matchingTechnique.technique_id,
              name: matchingTechnique.name,
              tactic: matchingTechnique.tactic,
              platforms: matchingTechnique.platforms
            } : 'NOT FOUND');
            
          if (matchingTechnique) {
            // Check if technique supports the rule's platform
            const supportsPlatform = matchingTechnique.platforms?.includes(rule.platform);
            console.log('🌐 Platform support:', supportsPlatform ? 'YES' : 'NO', 
              `Rule platform: ${rule.platform}, Technique platforms: ${matchingTechnique.platforms?.join(', ') || 'none'}`);
            
            // Check if tactics match
            const tacticMatch = rule.tactic === matchingTechnique.tactic;
            console.log('🎯 Tactic match:', tacticMatch ? 'YES' : 'NO', 
              `Rule tactic: "${rule.tactic}", Technique tactic: "${matchingTechnique.tactic}"`);
          }
        });
      }
      
      // Debug: Check platform counts
      const platformCounts = {};
      ruleData.forEach(rule => {
        if (!platformCounts[rule.platform]) {
          platformCounts[rule.platform] = 0;
        }
        platformCounts[rule.platform]++;
      });
      console.log('📊 Rules by platform:', platformCounts);
      
      // Debug: Check active rules by platform
      const activeRulesByPlatform = {};
      ruleData.filter(r => r.status === 'Active').forEach(rule => {
        if (!activeRulesByPlatform[rule.platform]) {
          activeRulesByPlatform[rule.platform] = 0;
        }
        activeRulesByPlatform[rule.platform]++;
      });
      console.log('🟢 Active rules by platform:', activeRulesByPlatform);
      
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

  // Memoized tactic stats calculation for better performance
  const getTacticStats = useMemo(() => {
    const statsCache = new Map();
    
    return (tactic) => {
      if (statsCache.has(tactic)) {
        return statsCache.get(tactic);
      }

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
      
      // Debug: Log XDR rules for this tactic/platform combination
      const xdrRulesForTactic = filteredRules.filter(r => 
        r.rule_id?.includes('-macos') || 
        r.rule_id?.includes('-linux') || 
        r.rule_id?.includes('-windows') ||
        r.description?.includes('XDR')
      );
      
      if (xdrRulesForTactic.length > 0) {
        console.log(`🎯 XDR Rules for tactic "${tactic}" on platform "${filters.platform}":`, xdrRulesForTactic.length);
        xdrRulesForTactic.forEach(rule => {
          console.log('📋 XDR Rule in tactic:', {
            rule_id: rule.rule_id,
            name: rule.name,
            platform: rule.platform,
            technique_id: rule.technique_id,
            tactic: rule.tactic,
            status: rule.status
          });
          
          // Check if technique exists and supports platform
          const matchingTechnique = platformTechniques.find(t => t.technique_id === rule.technique_id);
          if (matchingTechnique) {
            console.log('✅ Technique match found:', matchingTechnique.name);
          } else {
            console.log('❌ No matching technique found for:', rule.technique_id);
            // Look for the technique in all techniques (not just platform-filtered)
            const anyTechnique = techniques.find(t => t.technique_id === rule.technique_id);
            if (anyTechnique) {
              console.log('⚠️  Technique exists but not for this platform:', {
                technique_id: anyTechnique.technique_id,
                name: anyTechnique.name,
                tactic: anyTechnique.tactic,
                platforms: anyTechnique.platforms,
                current_platform: filters.platform
              });
            } else {
              console.log('❌ Technique does not exist at all:', rule.technique_id);
            }
          }
        });
      }
      
      // Apply search filter to both techniques AND rules
      let searchedTechniques = [...platformTechniques];
      let searchedRules = [...filteredRules];
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        
        // Search techniques
        searchedTechniques = searchedTechniques.filter(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          t.technique_id.toLowerCase().includes(searchTerm)
        );
        
        // Search rules by name and rule_id
        searchedRules = searchedRules.filter(r => 
          r.name.toLowerCase().includes(searchTerm) ||
          r.rule_id?.toLowerCase().includes(searchTerm) ||
          r.technique_id.toLowerCase().includes(searchTerm)
        );
        
        // Include techniques that have matching rules
        const rulesWithMatchingTechniques = searchedRules.map(r => r.technique_id);
        const additionalTechniques = platformTechniques.filter(t => 
          rulesWithMatchingTechniques.includes(t.technique_id) && 
          !searchedTechniques.some(st => st.technique_id === t.technique_id)
        );
        searchedTechniques = [...searchedTechniques, ...additionalTechniques];
      }
      
      // Use searched rules for display counts when search is active
      const displayActiveRules = filters.search ? searchedRules.filter(rule => rule.status === "Active") : activeRules;
      const displayTestingRules = filters.search ? searchedRules.filter(rule => rule.status === "Testing") : testingRules;
      const displayRuleCount = filters.search ? searchedRules.length : filteredRules.length;
      
      const stats = {
        // Display parent technique count (main number shown on cards)
        techniqueCount: parentTechniques.length,
        // Additional breakdown for detailed view
        parentTechniqueCount: parentTechniques.length,
        subTechniqueCount: subTechniques.length,
        totalTechniqueCount: platformTechniques.length,
        ruleCount: displayRuleCount,
        activeRules: displayActiveRules.length,
        testingRules: displayTestingRules.length,
        techniques: searchedTechniques,
      };

      statsCache.set(tactic, stats);
      return stats;
    };
  }, [techniques, rules, filters.platform, filters.cloudProvider, filters.search]);

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

  // Memoized filtered tactics for better performance
  const filteredTactics = useMemo(() => {
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
  }, [tactics, filters.search, filters.status, getTacticStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MatrixHeader 
        filters={filters}
        setFilters={setFilters}
        totalRules={platformRules.length}
        techniqueBreakdown={techniqueBreakdown}
        platform={filters.platform}
        currentPlatform={getCurrentPlatformName()}
        isCloudPlatform={["Cloud", "Office Suite", "Identity Provider", "SaaS", "IaaS"].includes(filters.platform)}
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredTactics.map((tactic, index) => (
                <motion.div
                  key={tactic}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TacticCard
                    tactic={tactic}
                    stats={getTacticStats(tactic)}
                    onClick={() => {
                      setSelectedTactic(tactic);
                      setIsTechniqueLoading(false);
                    }}
                    isLoading={isLoading}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTactics.length === 0 && !isLoading && (
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
        isLoading={isTechniqueLoading}
      />
    </div>
  );
}
