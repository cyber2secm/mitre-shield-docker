import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoverageGaps({ rules, techniques, isLoading }) {
  const getGapData = () => {
    const activeRules = rules.filter(r => r.status === "Active");
    const coveredTechniques = new Set(activeRules.map(r => r.technique_id));
    
    const uncoveredTechniques = techniques.filter(t => 
      !coveredTechniques.has(t.technique_id)
    );
    
    // Prioritize by tactic importance
    const tacticPriority = {
      "Initial Access": 5,
      "Defense Evasion": 5,
      "Persistence": 4,
      "Privilege Escalation": 4,
      "Credential Access": 4,
      "Discovery": 3,
      "Lateral Movement": 3,
      "Collection": 2,
      "Command and Control": 2,
      "Exfiltration": 3,
      "Impact": 4,
      "Execution": 3
    };
    
    const prioritizedGaps = uncoveredTechniques
      .map(t => ({
        ...t,
        priority: tacticPriority[t.tactic] || 1
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
    
    const gapsByTactic = {};
    uncoveredTechniques.forEach(t => {
      gapsByTactic[t.tactic] = (gapsByTactic[t.tactic] || 0) + 1;
    });
    
    return { prioritizedGaps, gapsByTactic, totalGaps: uncoveredTechniques.length };
  };

  const { prioritizedGaps, gapsByTactic, totalGaps } = getGapData();

  const getPriorityColor = (priority) => {
    if (priority >= 5) return "bg-red-100 text-red-700 border-red-200";
    if (priority >= 4) return "bg-amber-100 text-amber-700 border-amber-200";
    if (priority >= 3) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Coverage Gaps
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {totalGaps} uncovered techniques
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">High Priority Gaps</h4>
              <div className="space-y-2">
                {prioritizedGaps.map((technique) => (
                  <div key={technique.technique_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {technique.technique_id}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(technique.priority)}`}>
                            Priority {technique.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-1">{technique.name}</p>
                        <p className="text-xs text-slate-500">{technique.tactic}</p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Rule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {Object.keys(gapsByTactic).length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Tactical Gaps</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(gapsByTactic)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([tactic, count]) => (
                      <div key={tactic} className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-700 truncate">{tactic}</span>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {count}
                          </Badge>
                        </div>
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