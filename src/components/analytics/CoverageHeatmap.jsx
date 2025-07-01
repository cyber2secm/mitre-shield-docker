
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact"
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

const TACTIC_COLORS = {
  "Initial Access": { bg: "bg-red-500", light: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Execution": { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Persistence": { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Privilege Escalation": { bg: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "Defense Evasion": { bg: "bg-lime-500", light: "bg-lime-50", text: "text-lime-700", border: "border-lime-200" },
  "Credential Access": { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Discovery": { bg: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  "Lateral Movement": { bg: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "Collection": { bg: "bg-sky-500", light: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  "Command and Control": { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Exfiltration": { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "Impact": { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" }
};

export default function CoverageHeatmap({ rules, techniques, isLoading, selectedPlatform }) {
  const getCoverageByTactic = () => {
    const coverage = {};
    const activeRules = rules.filter(r => r.status === 'Active');
    
    // Use appropriate tactics based on platform
    let tacticsToUse = TACTICS;
    if (selectedPlatform === "Cloud") {
      tacticsToUse = CLOUD_TACTICS;
    } else if (selectedPlatform === "Containers") {
      tacticsToUse = CONTAINER_TACTICS;
    }
    
    tacticsToUse.forEach(tactic => {
      const tacticTechniques = techniques.filter(t => t.tactic === tactic);
      const coveredTechniques = tacticTechniques.filter(t => 
        activeRules.some(r => r.technique_id === t.technique_id && r.tactic === tactic)
      );
      
      coverage[tactic] = {
        total: tacticTechniques.length,
        covered: coveredTechniques.length,
        percentage: tacticTechniques.length > 0 
          ? Math.round((coveredTechniques.length / tacticTechniques.length) * 100)
          : 0
      };
    });
    
    return coverage;
  };

  const getCoverageLevel = (percentage) => {
    if (percentage >= 90) return { level: "Excellent", color: "emerald" };
    if (percentage >= 75) return { level: "Good", color: "green" };
    if (percentage >= 50) return { level: "Fair", color: "yellow" };
    if (percentage >= 25) return { level: "Poor", color: "orange" };
    return { level: "", color: "red" };
  };

  const coverage = getCoverageByTactic();
  const overallCoverage = techniques.length > 0 
    ? Math.round((Object.values(coverage).reduce((sum, c) => sum + c.covered, 0) / techniques.length) * 100)
    : 0;

  const overallLevel = getCoverageLevel(overallCoverage);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Coverage Heatmap</CardTitle>
              <p className="text-sm text-slate-600">MITRE ATT&CK technique coverage analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
            <Shield className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{Object.values(coverage).reduce((sum, c) => sum + c.covered, 0)} / {techniques.length} techniques</span>
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{Object.values(coverage).filter(c => c.percentage > 0).length} tactics covered</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="relative">
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Overall Coverage Progress</span>
                <span>{overallCoverage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-3 rounded-full bg-gradient-to-r from-${overallLevel.color}-400 to-${overallLevel.color}-600 shadow-sm`}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallCoverage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Uniform Grid Layout - Prevents stretching */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
            >
              <AnimatePresence>
                {(selectedPlatform === "Cloud" ? CLOUD_TACTICS : 
                  selectedPlatform === "Containers" ? CONTAINER_TACTICS : 
                  TACTICS).map((tactic, index) => {
                  const tacticCoverage = coverage[tactic];
                  const colors = TACTIC_COLORS[tactic];
                  const level = getCoverageLevel(tacticCoverage.percentage);
                  
                  return (
                    <motion.div
                      key={tactic}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        transition: { duration: 0.2 }
                      }}
                      className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.light} hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-44`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className={`w-full h-full ${colors.bg}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="relative p-3 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className={`font-bold text-xs ${colors.text} leading-tight group-hover:scale-105 transition-transform`} style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                              {tactic}
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="px-1.5 py-0.5 whitespace-nowrap text-[10px]">
                                {tacticCoverage.covered}/{tacticCoverage.total}
                              </Badge>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <Zap className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>

                        {/* Animated Progress Ring */}
                        <div className="flex items-center justify-center flex-1">
                          <div className="relative w-10 h-10">
                            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-200"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="transparent"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                className={colors.bg.replace('bg-', 'text-')}
                                strokeWidth="3"
                                strokeDasharray={`${tacticCoverage.percentage}, 100`}
                                stroke="currentColor"
                                fill="transparent"
                                strokeLinecap="round"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${tacticCoverage.percentage}, 100` }}
                                transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.span 
                                className={`font-bold ${colors.text} text-[10px]`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.5 }}
                              >
                                {tacticCoverage.percentage}%
                              </motion.span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-center mt-1">
                          {level && level.level && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 + 0.7 }}
                            >
                              <Badge 
                                className={`px-1.5 py-0.5 bg-${level.color}-100 text-${level.color}-700 border-${level.color}-200 whitespace-nowrap text-[9px]`}
                              >
                                {level.level}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
