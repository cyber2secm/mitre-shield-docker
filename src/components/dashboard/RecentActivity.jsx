import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Plus, Edit, Play, Pause } from "lucide-react";
import { format } from "date-fns";

export default function RecentActivity({ rules, isLoading }) {
  const getRecentActivity = () => {
    const sortedRules = [...rules]
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      .slice(0, 8);
    
    return sortedRules.map(rule => {
      const isRecent = new Date(rule.updated_date) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      const isNew = new Date(rule.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return {
        ...rule,
        isRecent,
        isNew,
        action: isNew ? "created" : "updated"
      };
    });
  };

  const recentActivity = getRecentActivity();

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-emerald-100 text-emerald-700";
      case "Testing": return "bg-amber-100 text-amber-700";
      case "Inactive": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getActionIcon = (action, status) => {
    if (action === "created") return <Plus className="w-3 h-3" />;
    if (status === "Active") return <Play className="w-3 h-3" />;
    if (status === "Inactive") return <Pause className="w-3 h-3" />;
    return <Edit className="w-3 h-3" />;
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          Last 24 hours
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    rule.action === "created" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"
                  }`}>
                    {getActionIcon(rule.action, rule.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{rule.name}</p>
                      {rule.isNew && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                      )}
                      {rule.isRecent && !rule.isNew && (
                        <Badge variant="outline" className="text-xs">Recent</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {rule.technique_id}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {rule.action} {format(new Date(rule.updated_date), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={`text-xs ${getStatusColor(rule.status)}`}>
                      {rule.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{rule.platform}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}