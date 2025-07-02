import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, AlertTriangle, CheckCircle, User } from "lucide-react";
import { motion } from "framer-motion";

export default function FutureRulesStats({ rules }) {
  const stats = {
    total: rules.length,
    planned: rules.filter(r => r.status === "Planned").length,
    inProgress: rules.filter(r => r.status === "In Progress").length,
    readyForReview: rules.filter(r => r.status === "Ready for Review").length,
    critical: rules.filter(r => r.priority === "Critical").length,
    high: rules.filter(r => r.priority === "High").length
  };

  const statCards = [
    {
      title: "Total Future Rules",
      value: stats.total,
      icon: Clock,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      title: "Planned",
      value: stats.planned,
      icon: TrendingUp,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: User,
      color: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-300"
    },
    {
      title: "Ready for Review",
      value: stats.readyForReview,
      icon: CheckCircle,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-300"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 h-32`}>
            <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 ${stat.color} rounded-full opacity-10`} />
            <CardHeader className="pb-2 pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{stat.title}</p>
                  <CardTitle className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}