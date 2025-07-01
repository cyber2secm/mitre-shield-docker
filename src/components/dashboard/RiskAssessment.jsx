import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, TrendingDown, TrendingUp } from "lucide-react";

export default function RiskAssessment({ rules, techniques, isLoading }) {
  const getRiskData = () => {
    const activeRules = rules.filter(r => r.status === "Active");
    const coveredTechniques = new Set(activeRules.map(r => r.technique_id));
    const coveragePercentage = techniques.length > 0 ? (coveredTechniques.size / techniques.length) * 100 : 0;
    
    const criticalGaps = techniques.filter(t => 
      (t.tactic === "Initial Access" || t.tactic === "Defense Evasion" || t.tactic === "Persistence") &&
      !activeRules.some(r => r.technique_id === t.technique_id)
    ).length;
    
    const testingBacklog = rules.filter(r => r.status === "Testing").length;
    const highFpRules = activeRules.filter(r => r.false_positive_rate === "High").length;
    
    const riskFactors = [
      {
        name: "Coverage Gaps",
        value: criticalGaps,
        risk: criticalGaps > 10 ? "High" : criticalGaps > 5 ? "Medium" : "Low",
        description: "Critical tactics without coverage"
      },
      {
        name: "Testing Backlog",
        value: testingBacklog,
        risk: testingBacklog > 20 ? "High" : testingBacklog > 10 ? "Medium" : "Low",
        description: "Rules pending activation"
      },
      {
        name: "False Positive Risk",
        value: highFpRules,
        risk: highFpRules > 15 ? "High" : highFpRules > 8 ? "Medium" : "Low",
        description: "High false positive rules"
      },
      {
        name: "Overall Coverage",
        value: Math.round(coveragePercentage),
        risk: coveragePercentage < 60 ? "High" : coveragePercentage < 80 ? "Medium" : "Low",
        description: "Technique coverage percentage"
      }
    ];
    
    const overallRisk = riskFactors.filter(f => f.risk === "High").length > 1 ? "High" :
                      riskFactors.filter(f => f.risk === "Medium").length > 2 ? "Medium" : "Low";
    
    return { riskFactors, overallRisk };
  };

  const { riskFactors, overallRisk } = getRiskData();

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High": return "bg-red-100 text-red-700 border-red-200";
      case "Medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Risk Assessment
        </CardTitle>
        <Badge className={`w-fit ${getRiskColor(overallRisk)}`}>
          {overallRisk} Risk Profile
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {riskFactors.map((factor, index) => (
              <div key={index} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{factor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{factor.value}</span>
                    <Badge className={`text-xs ${getRiskColor(factor.risk)}`}>
                      {factor.risk}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{factor.description}</p>
                {factor.risk === "High" && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                    <TrendingUp className="w-3 h-3" />
                    Requires immediate attention
                  </div>
                )}
                {factor.risk === "Low" && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingDown className="w-3 h-3" />
                    Well managed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}