import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function DetectionEffectiveness({ rules, isLoading }) {
  const getEffectivenessData = () => {
    const activeRules = rules.filter(r => r.status === "Active");
    const testingRules = rules.filter(r => r.status === "Testing");
    const inactiveRules = rules.filter(r => r.status === "Inactive");
    
    const criticalRules = activeRules.filter(r => r.severity === "Critical");
    const highRules = activeRules.filter(r => r.severity === "High");
    
    const lowFpRules = activeRules.filter(r => r.false_positive_rate === "Low");
    const mediumFpRules = activeRules.filter(r => r.false_positive_rate === "Medium");
    const highFpRules = activeRules.filter(r => r.false_positive_rate === "High");
    
    const effectiveness = {
      operational: Math.round((activeRules.length / rules.length) * 100),
      quality: Math.round(((criticalRules.length + highRules.length) / activeRules.length) * 100),
      precision: Math.round((lowFpRules.length / activeRules.length) * 100)
    };
    
    return {
      activeRules: activeRules.length,
      testingRules: testingRules.length,
      inactiveRules: inactiveRules.length,
      criticalRules: criticalRules.length,
      highRules: highRules.length,
      lowFpRules: lowFpRules.length,
      mediumFpRules: mediumFpRules.length,
      highFpRules: highFpRules.length,
      effectiveness
    };
  };

  const data = getEffectivenessData();

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Detection Effectiveness
        </CardTitle>
        <Badge variant="outline" className="w-fit text-xs">
          Quality metrics
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">{data.effectiveness.operational}%</div>
                <div className="text-xs text-emerald-600">Operational</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{data.effectiveness.quality}%</div>
                <div className="text-xs text-blue-600">High Quality</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{data.effectiveness.precision}%</div>
                <div className="text-xs text-purple-600">Low False+</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Active Rules</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {data.activeRules}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Testing Pipeline</span>
                </div>
                <Badge className="bg-amber-100 text-amber-700">
                  {data.testingRules}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Inactive Rules</span>
                </div>
                <Badge className="bg-slate-100 text-slate-700">
                  {data.inactiveRules}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}