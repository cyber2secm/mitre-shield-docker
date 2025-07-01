import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, AlertTriangle, Shield, TrendingUp } from "lucide-react";

export default function ThreatLandscape({ rules, techniques, isLoading }) {
  const getLandscapeData = () => {
    // Most targeted techniques (techniques with most rules)
    const techniqueRuleCount = {};
    rules.forEach(rule => {
      techniqueRuleCount[rule.technique_id] = (techniqueRuleCount[rule.technique_id] || 0) + 1;
    });
    
    const mostTargeted = Object.entries(techniqueRuleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([techId, count]) => {
        const technique = techniques.find(t => t.technique_id === techId);
        return {
          id: techId,
          name: technique?.name || techId,
          tactic: technique?.tactic || "Unknown",
          ruleCount: count,
          activeRules: rules.filter(r => r.technique_id === techId && r.status === "Active").length
        };
      });
    
    // Emerging threats (techniques with recent rules)
    const recentRules = rules
      .filter(r => new Date(r.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .map(r => r.technique_id);
    
    const emergingThreats = [...new Set(recentRules)]
      .map(techId => {
        const technique = techniques.find(t => t.technique_id === techId);
        return {
          id: techId,
          name: technique?.name || techId,
          tactic: technique?.tactic || "Unknown",
          recentRules: recentRules.filter(id => id === techId).length
        };
      })
      .sort((a, b) => b.recentRules - a.recentRules)
      .slice(0, 3);
    
    // Coverage gaps (techniques with no active rules)
    const uncoveredTechniques = techniques
      .filter(t => !rules.some(r => r.technique_id === t.technique_id && r.status === "Active"))
      .slice(0, 5);
    
    return { mostTargeted, emergingThreats, uncoveredTechniques };
  };

  const { mostTargeted, emergingThreats, uncoveredTechniques } = getLandscapeData();

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Threat Landscape Intelligence
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          <TrendingUp className="w-3 h-3 mr-1" />
          Real-time threat analysis
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Most Defended Techniques
              </h4>
              <div className="space-y-2">
                {mostTargeted.map((technique, index) => (
                  <div key={technique.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        #{index + 1}
                      </Badge>
                      <div>
                        <span className="text-sm font-medium text-slate-800">{technique.name}</span>
                        <p className="text-xs text-slate-500">{technique.tactic}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        {technique.activeRules} active
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{technique.ruleCount} total rules</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {emergingThreats.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Focus Areas
                </h4>
                <div className="space-y-2">
                  {emergingThreats.map((technique) => (
                    <div key={technique.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{technique.name}</span>
                        <p className="text-xs text-slate-500">{technique.tactic}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {technique.recentRules} new rules
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uncoveredTechniques.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Coverage Gaps
                </h4>
                <div className="space-y-2">
                  {uncoveredTechniques.slice(0, 3).map((technique) => (
                    <div key={technique.technique_id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{technique.name}</span>
                        <p className="text-xs text-slate-500">{technique.tactic}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        No coverage
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}