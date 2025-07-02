import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Code } from "lucide-react";
import { motion } from "framer-motion";

export default function RuleTeamDistribution({ rules = [], isLoading = false }) {
  // Calculate team statistics
  const teamStats = rules.reduce((acc, rule) => {
    // Determine team based on rule_type
    let team = 'Other';
    if (rule.rule_type) {
      const ruleType = rule.rule_type.toLowerCase();
      if (ruleType.includes('soc') || ruleType.includes('security') || ruleType.includes('threat') || ruleType.includes('incident')) {
        team = 'SOC';
      } else if (ruleType.includes('product') || ruleType.includes('dev') || ruleType.includes('engineering') || ruleType.includes('application')) {
        team = 'Product';
      }
    }
    
    acc[team] = (acc[team] || 0) + 1;
    return acc;
  }, {});

  const totalRules = rules.length;

  // Team configuration
  const teamConfig = {
    SOC: {
      name: 'SOC Team',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
    },
    Product: {
      name: 'Product Team', 
      icon: Code,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
    }
  };

  // Only show SOC and Product teams
  const displayTeams = ['SOC', 'Product'].filter(team => teamStats[team] > 0);
  const maxCount = Math.max(...displayTeams.map(team => teamStats[team] || 0));
  const minCount = Math.min(...displayTeams.map(team => teamStats[team] || 0));

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="w-5 h-5" />
            Rule Development Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="flex items-end justify-center gap-12 h-64 px-8">
              {[0, 1].map((index) => (
                <div key={index} className="flex flex-col items-center gap-3">
                                      <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: [0, 120, 100, 120] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: index * 0.2 
                      }}
                      className={`w-16 ${index === 0 ? 'bg-blue-200 dark:bg-blue-800' : 'bg-emerald-200 dark:bg-emerald-800'} rounded-t-lg shadow-lg`}
                    />
                  <div className="text-center">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2 mx-auto animate-pulse"></div>
                    <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Users className="w-5 h-5" />
          Rule Development Teams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayTeams.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No team data available
          </div>
        ) : (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Bar Chart */}
            <motion.div 
              className="flex items-end justify-center gap-12 h-64 px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {displayTeams.map((team, index) => {
                const config = teamConfig[team];
                const count = teamStats[team] || 0;
                const percentage = totalRules > 0 ? Math.round((count / totalRules) * 100) : 0;
                
                // Enhanced height calculation for dramatic visual differences
                let height = 0;
                if (maxCount > 0) {
                  if (maxCount === minCount) {
                    // If counts are equal, both bars get 80% height
                    height = 80;
                  } else {
                    // Dramatic amplification: minimum bar gets 15%, maximum gets 100%
                    const minHeight = 15;
                    const maxHeight = 100;
                    const ratio = (count - minCount) / (maxCount - minCount);
                    // Use exponential scaling to make differences even more dramatic
                    const exponentialRatio = Math.pow(ratio, 0.7); // Makes smaller values even smaller
                    height = minHeight + (exponentialRatio * (maxHeight - minHeight));
                  }
                }
                
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={team}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    className="flex flex-col items-center gap-3"
                  >
                    {/* Numbers on Top of Bar */}
                    <motion.div 
                      className="text-center mb-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + (index * 0.1), duration: 0.6 }}
                    >
                      <motion.div 
                        className="text-2xl font-bold text-slate-900 dark:text-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.9 + (index * 0.1), 
                          duration: 0.6, 
                          type: "spring",
                          stiffness: 200,
                          damping: 10
                        }}
                      >
                        {count}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.0 + (index * 0.1), duration: 0.4 }}
                      >
                        <Badge className={`text-xs ${config.badgeColor} border-0`}>
                          {percentage}%
                        </Badge>
                      </motion.div>
                    </motion.div>

                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ 
                        delay: 0.6 + (index * 0.2), 
                        duration: 1.2, 
                        ease: "easeOut" 
                      }}
                      className={`w-16 bg-gradient-to-t ${config.color} rounded-t-lg shadow-lg border border-white/20`}
                      style={{ minHeight: '20px' }}
                    />

                    {/* Team Info */}
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + (index * 0.1), duration: 0.5 }}
                    >
                      <motion.div 
                        className="flex items-center justify-center mb-2"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: 1.3 + (index * 0.1), 
                          duration: 0.6,
                          type: "spring",
                          stiffness: 150
                        }}
                      >
                        <IconComponent className={`w-6 h-6 ${config.textColor}`} />
                      </motion.div>
                      <motion.div 
                        className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 + (index * 0.1), duration: 0.4 }}
                      >
                        {config.name}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Total Count at Bottom */}
            <motion.div 
              className="text-center pt-4 border-t border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Detection Rules: <span className="font-semibold text-slate-900 dark:text-slate-100">{totalRules}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
} 