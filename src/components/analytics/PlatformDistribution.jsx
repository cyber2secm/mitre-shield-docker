import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Target } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon"; // New import

const PLATFORM_COLORS = {
  Windows: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", fill: "bg-blue-400" },
  macOS: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", fill: "bg-gray-400" },
  Linux: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", fill: "bg-orange-400" },
  AWS: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", fill: "bg-sky-400" },
  Azure: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", fill: "bg-sky-400" },
  GCP: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", fill: "bg-sky-400" },
  Containers: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", fill: "bg-purple-400" }
};

const TACTIC_COLORS = {
  "Initial Access": { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", fill: "bg-red-400" },
  "Execution": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", fill: "bg-orange-400" },
  "Persistence": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", fill: "bg-amber-400" },
  "Privilege Escalation": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", fill: "bg-yellow-400" },
  "Defense Evasion": { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-200", fill: "bg-lime-400" },
  "Credential Access": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", fill: "bg-emerald-400" },
  "Discovery": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", fill: "bg-teal-400" },
  "Lateral Movement": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", fill: "bg-cyan-400" },
  "Collection": { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", fill: "bg-sky-400" },
  "Command and Control": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", fill: "bg-blue-400" },
  "Exfiltration": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", fill: "bg-indigo-400" },
  "Impact": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", fill: "bg-purple-400" }
};

export default function PlatformDistribution({ rules, isLoading }) {
  const platformSet = !isLoading && rules.length > 0 ? new Set(rules.map(r => r.platform)) : new Set();
  const isSinglePlatform = platformSet.size === 1;
  const singlePlatformName = isSinglePlatform ? [...platformSet][0] : null;

  const getPlatformStats = () => {
    const platforms = {};
    rules.forEach(rule => {
      if (!platforms[rule.platform]) {
        platforms[rule.platform] = { total: 0, active: 0, testing: 0, inactive: 0 };
      }
      platforms[rule.platform].total++;
      if (rule.status) {
        platforms[rule.platform][rule.status.toLowerCase()]++;
      }
    });
    return platforms;
  };
  
  const getTacticStats = () => {
    const tactics = {};
    rules.forEach(rule => {
      if (!rule.tactic) return;
      if (!tactics[rule.tactic]) {
        tactics[rule.tactic] = { total: 0 };
      }
      tactics[rule.tactic].total++;
    });
    return Object.entries(tactics)
      .sort(([,a], [,b]) => b.total - a.total);
  };

  const platformStats = !isSinglePlatform ? getPlatformStats() : null;
  const tacticStats = isSinglePlatform ? getTacticStats() : null;
  const totalRules = rules.length;

  const renderLoading = () => (
    <div className="space-y-4">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-2 w-full" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );

  const renderPlatformContent = () => (
    <div className="space-y-4">
      {Object.entries(platformStats).map(([platform, stats]) => {
        const colors = PLATFORM_COLORS[platform] || {};
        const percentage = totalRules > 0 ? Math.round((stats.total / totalRules) * 100) : 0;
        
        return (
          <div key={platform} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center p-1`}>
                  <PlatformIcon platform={platform} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">{platform}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stats.total} rules</p>
                </div>
              </div>
              <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                {percentage}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">{stats.active} Active</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">{stats.testing} Testing</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">{stats.inactive} Inactive</span></div>
            </div>
            
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${colors.fill}`} style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
  
  const renderTacticContent = () => (
    <div className="space-y-3">
      {tacticStats.map(([tactic, stats]) => {
        const colors = TACTIC_COLORS[tactic];
        const percentage = totalRules > 0 ? Math.round((stats.total / totalRules) * 100) : 0;
        
        return (
          <div key={tactic} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${colors.text}`}>{tactic}</span>
              <span className={`font-semibold ${colors.text}`}>{stats.total}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${colors.fill}`} style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          {isSinglePlatform ? <Target className="w-5 h-5" /> : <BarChart2 className="w-5 h-5" />}
          {isSinglePlatform ? `Tactic Distribution for ${singlePlatformName}` : 'Rule Distribution by Platform'}
        </CardTitle>
        <Badge variant="outline" className="w-fit border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {totalRules} total rules
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? renderLoading() : (isSinglePlatform ? renderTacticContent() : renderPlatformContent())}
      </CardContent>
    </Card>
  );
}
