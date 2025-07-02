import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, Package, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function RulesStats({ rules }) {
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.status === "Active").length,
    testing: rules.filter(r => r.status === "Testing").length,
    inactive: rules.filter(r => r.status === "Inactive").length,
    critical: rules.filter(r => r.severity === "Critical").length,
    high: rules.filter(r => r.severity === "High").length,
    product: rules.filter(r => r.rule_type === "Product").length,
    soc: rules.filter(r => r.rule_type === "SOC").length
  };

  const coverage = rules.length > 0 ? Math.round((stats.active / rules.length) * 100) : 0;

  const statCards = [
    {
      title: "Total Rules",
      value: stats.total,
      icon: Shield,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    {
      title: "Active Rules",
      value: stats.active,
      icon: CheckCircle,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-300"
    },
    {
      title: "Testing Rules",
      value: stats.testing,
      icon: AlertTriangle,
      color: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-300"
    },
    {
      title: "Coverage",
      value: `${coverage}%`,
      icon: TrendingUp,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      title: "Product Rules",
      value: stats.product,
      icon: Package,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
      textColor: "text-indigo-700 dark:text-indigo-300"
    },
    {
      title: "SOC Rules",
      value: stats.soc,
      icon: Users,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-300"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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