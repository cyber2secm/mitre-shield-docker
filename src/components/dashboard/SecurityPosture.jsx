import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, TrendingUp, AlertTriangle } from "lucide-react";

const TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact"
];

export default function SecurityPosture({ rules, techniques, isLoading }) {
  const getPostureData = () => {
    const tacticCoverage = {};
    const platformCoverage = {};
    
    TACTICS.forEach(tactic => {
      const tacticTechniques = techniques.filter(t => t.tactic === tactic);
      const coveredTechniques = tacticTechniques.filter(t => 
        rules.some(r => r.technique_id === t.technique_id && r.status === "Active")
      );
      
      tacticCoverage[tactic] = {
        total: tacticTechniques.length,
        covered: coveredTechniques.length,
        percentage: tacticTechniques.length > 0 ? Math.round((coveredTechniques.length / tacticTechniques.length) * 100) : 0
      };
    });
    
    ["Windows", "macOS", "Linux", "Cloud", "Containers"].forEach(platform => {
      const platformRules = rules.filter(r => r.platform === platform && r.status === "Active");
      const platformTechniques = techniques.filter(t => t.platforms?.includes(platform));
      
      platformCoverage[platform] = {
        rules: platformRules.length,
        techniques: platformTechniques.length,
        coverage: platformTechniques.length > 0 ? Math.round((platformRules.length / platformTechniques.length) * 100) : 0
      };
    });
    
    return { tacticCoverage, platformCoverage };
  };

  const { tacticCoverage, platformCoverage } = getPostureData();
  const overallHealth = Object.values(tacticCoverage).reduce((sum, t) => sum + t.percentage, 0) / TACTICS.length;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Posture Overview
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={`${overallHealth > 70 ? 'bg-emerald-100 text-emerald-700' : overallHealth > 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {Math.round(overallHealth)}% Overall Health
          </Badge>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Tactical Coverage
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Top Tactical Priorities</h4>
              <div className="space-y-2">
                {Object.entries(tacticCoverage)
                  .sort(([,a], [,b]) => a.percentage - b.percentage)
                  .slice(0, 5)
                  .map(([tactic, data]) => (
                    <div key={tactic} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        {data.percentage < 50 && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium text-slate-700">{tactic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{data.covered}/{data.total}</span>
                        <Badge className={`text-xs ${data.percentage < 50 ? 'bg-red-100 text-red-700' : data.percentage < 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {data.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Platform Readiness</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(platformCoverage).map(([platform, data]) => (
                  <div key={platform} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">{platform}</span>
                      <Badge variant="outline" className="text-xs">
                        {data.rules} rules
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${data.coverage > 70 ? 'bg-emerald-500' : data.coverage > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(data.coverage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}