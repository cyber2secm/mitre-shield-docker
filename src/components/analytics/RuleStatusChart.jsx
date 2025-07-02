import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function RuleStatusChart({ rules, isLoading }) {
  const getStatusStats = () => {
    const stats = {
      Active: 0,
      Testing: 0,
      Inactive: 0
    };
    
    rules.forEach(rule => {
      stats[rule.status]++;
    });
    
    return stats;
  };

  const statusStats = getStatusStats();
  const totalRules = rules.length;
  
  const statusConfig = {
    Active: { 
      color: "bg-emerald-500", 
      lightColor: "bg-emerald-50 dark:bg-emerald-900/30", 
      textColor: "text-emerald-700 dark:text-emerald-300",
      borderColor: "border-emerald-200 dark:border-emerald-700",
      icon: CheckCircle
    },
    Testing: { 
      color: "bg-amber-500", 
      lightColor: "bg-amber-50 dark:bg-amber-900/30", 
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200 dark:border-amber-700",
      icon: AlertTriangle
    },
    Inactive: { 
      color: "bg-slate-400", 
      lightColor: "bg-slate-50 dark:bg-slate-800", 
      textColor: "text-slate-700 dark:text-slate-300",
      borderColor: "border-slate-200 dark:border-slate-600",
      icon: XCircle
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Activity className="w-5 h-5" />
          Rule Status Distribution
        </CardTitle>
        <Badge variant="outline" className="w-fit border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {totalRules} total rules
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modern Donut Chart */}
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="20"
                  />
                  
                  {/* Active rules arc */}
                  {statusStats.Active > 0 && (
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(statusStats.Active / totalRules) * 314} 314`}
                      initial={{ strokeDasharray: "0 314" }}
                      animate={{ strokeDasharray: `${(statusStats.Active / totalRules) * 314} 314` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  )}
                  
                  {/* Testing rules arc */}
                  {statusStats.Testing > 0 && (
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(statusStats.Testing / totalRules) * 314} 314`}
                      strokeDashoffset={-((statusStats.Active / totalRules) * 314)}
                      initial={{ strokeDasharray: "0 314" }}
                      animate={{ 
                        strokeDasharray: `${(statusStats.Testing / totalRules) * 314} 314`,
                        strokeDashoffset: -((statusStats.Active / totalRules) * 314)
                      }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                  )}
                  
                  {/* Inactive rules arc */}
                  {statusStats.Inactive > 0 && (
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(statusStats.Inactive / totalRules) * 314} 314`}
                      strokeDashoffset={-(((statusStats.Active + statusStats.Testing) / totalRules) * 314)}
                      initial={{ strokeDasharray: "0 314" }}
                      animate={{ 
                        strokeDasharray: `${(statusStats.Inactive / totalRules) * 314} 314`,
                        strokeDashoffset: -(((statusStats.Active + statusStats.Testing) / totalRules) * 314)
                      }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                    />
                  )}
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalRules}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Rules</div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(statusStats).map(([status, count], index) => {
                const config = statusConfig[status];
                const percentage = totalRules > 0 ? Math.round((count / totalRules) * 100) : 0;
                const IconComponent = config.icon;
                
                return (
                  <motion.div 
                    key={status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                    className={`flex items-center justify-between p-4 rounded-xl border ${config.borderColor} ${config.lightColor} hover:shadow-sm transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.lightColor} ${config.borderColor} border-2 flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{status} Rules</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{count} of {totalRules} rules</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{percentage}%</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}