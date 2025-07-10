import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, Package, Users, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function RulesStats({ rules, techniques = [] }) {
  
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

  // MITRE technique coverage calculation (same as CoverageHeatmap)
  const calculateCoverage = () => {
    if (techniques.length === 0) return 0;
    
    const activeRules = rules.filter(r => r.status === 'Active');
    const tactics = [
      "Initial Access", "Execution", "Persistence", "Privilege Escalation",
      "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
      "Collection", "Command and Control", "Exfiltration", "Impact"
    ];
    
    const coverage = {};
    tactics.forEach(tactic => {
      const tacticTechniques = techniques.filter(t => t.tactic === tactic);
      const coveredTechniques = tacticTechniques.filter(t => 
        activeRules.some(r => r.technique_id === t.technique_id && r.tactic === tactic)
      );
      
      coverage[tactic] = {
        total: tacticTechniques.length,
        covered: coveredTechniques.length
      };
    });
    
    const totalCovered = Object.values(coverage).reduce((sum, c) => sum + c.covered, 0);
    return techniques.length > 0 ? Math.round((totalCovered / techniques.length) * 100) : 0;
  };

  const mitreCoverage = calculateCoverage();



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
      title: "SOC Rules",
      value: stats.soc,
      icon: Users,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-300"
    },
    {
      title: "Product Rules",
      value: stats.product,
      icon: Package,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      title: "MITRE Coverage",
      value: `${mitreCoverage}%`,
      icon: Target,
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-300"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 h-32`}>
            <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 ${stat.color} rounded-full opacity-10`} />
            <CardHeader className="pb-2 pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">{stat.title}</p>
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