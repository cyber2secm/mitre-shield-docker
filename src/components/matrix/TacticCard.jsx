import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Target, Shield, ChevronRight, Activity, CheckCircle, TestTube } from "lucide-react";

const TacticCard = React.memo(function TacticCard({ tactic, stats, onClick, isLoading }) {
  const getTacticColor = (tactic) => {
    const colors = {
      // Traditional MITRE ATT&CK Tactics
      "Initial Access": "border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150",
      "Execution": "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150",
      "Persistence": "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-150",
      "Privilege Escalation": "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-150",
      "Defense Evasion": "border-lime-200 bg-gradient-to-br from-lime-50 to-lime-100 hover:from-lime-100 hover:to-lime-150",
      "Credential Access": "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-150",
      "Discovery": "border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-150",
      "Lateral Movement": "border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-150",
      "Collection": "border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-150",
      "Command and Control": "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150",
      "Exfiltration": "border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-150",
      "Impact": "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150",
      "Reconnaissance": "border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-250",
      "Resource Development": "border-stone-300 bg-gradient-to-br from-stone-100 to-stone-200 hover:from-stone-200 hover:to-stone-250",
      
      // ATLAS AI-Specific Tactics (Distinctive AI Colors)
      "AI Model Access": "border-violet-300 bg-gradient-to-br from-violet-100 to-violet-200 hover:from-violet-200 hover:to-violet-250",
      "AI Attack Staging": "border-fuchsia-300 bg-gradient-to-br from-fuchsia-100 to-fuchsia-200 hover:from-fuchsia-200 hover:to-fuchsia-250"
    };
    return colors[tactic] || "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150";
  };

  if (isLoading) {
    return (
      <Card className="h-56 shadow-sm border-2 border-slate-200 min-w-[240px]">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`h-56 cursor-pointer shadow-md border-2 ${getTacticColor(tactic)} hover:shadow-xl transition-all duration-300 group min-w-[240px]`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800 group-hover:text-slate-900 transition-colors leading-tight" 
                       style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
              {tactic}
            </CardTitle>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-full shadow-sm border border-slate-200 dark:border-slate-600">
              {stats.parentTechniqueCount || stats.techniqueCount} techniques
              {stats.subTechniqueCount > 0 && (
                <span className="text-slate-600 dark:text-slate-400 ml-1 font-normal">({stats.subTechniqueCount} sub)</span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Total Rules</span>
              <span className="font-bold text-slate-800">{stats.ruleCount}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-600 truncate">{stats.activeRules} Active</span>
              </div>
              <div className="flex items-center gap-1">
                <TestTube className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span className="text-slate-600 truncate">{stats.testingRules} Testing</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">Click to view techniques</span>
              <Shield className="w-3 h-3 flex-shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default TacticCard;