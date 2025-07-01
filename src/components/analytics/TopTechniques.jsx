import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp } from "lucide-react";

export default function TopTechniques({ rules, isLoading }) {
  const getTopTechniques = () => {
    const techniqueCount = {};
    
    rules.forEach(rule => {
      techniqueCount[rule.technique_id] = (techniqueCount[rule.technique_id] || 0) + 1;
    });
    
    return Object.entries(techniqueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([techniqueId, count]) => ({
        id: techniqueId,
        count,
        rules: rules.filter(r => r.technique_id === techniqueId)
      }));
  };

  const topTechniques = getTopTechniques();
  const maxCount = topTechniques[0]?.count || 1;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Top Techniques by Rule Count
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          <TrendingUp className="w-3 h-3 mr-1" />
          Most covered techniques
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-8 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topTechniques.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No techniques with rules found</p>
              </div>
            ) : (
              topTechniques.map((technique, index) => {
                const percentage = (technique.count / maxCount) * 100;
                const activeRules = technique.rules.filter(r => r.status === "Active").length;
                
                return (
                  <div key={technique.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 font-mono text-xs">
                          {technique.id}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {technique.count} rules
                          </span>
                          {activeRules > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              {activeRules} active
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}