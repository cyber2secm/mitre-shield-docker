import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield, 
  Code, 
  TrendingUp,
  Activity,
  Target,
  Zap,
  Award,
  Heart,
  Handshake
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RuleTeamDistribution({ rules = [], isLoading = false }) {
  const [selectedView, setSelectedView] = useState('overview'); // overview, breakdown

  // Enhanced team categorization focused on SOC vs Product
  const categorizeTeam = (rule) => {
    const ruleType = rule.rule_type?.toLowerCase() || '';
    const platform = rule.platform?.toLowerCase() || '';
    const description = rule.description?.toLowerCase() || '';
    const name = rule.name?.toLowerCase() || '';
    const techniqueId = rule.technique_id?.toLowerCase() || '';
    
    // SOC Team indicators (Security Operations, Threat Detection, Incident Response)
    if (ruleType.includes('soc') || ruleType.includes('security') || 
        ruleType.includes('threat') || ruleType.includes('incident') ||
        ruleType.includes('detection') || ruleType.includes('hunting') ||
        ruleType.includes('malware') || ruleType.includes('attack') ||
        name.includes('threat') || name.includes('malware') || 
        name.includes('attack') || name.includes('suspicious') ||
        description.includes('malware') || description.includes('threat') ||
        description.includes('attack') || description.includes('breach') ||
        ruleType.includes('alert') || ruleType.includes('monitoring')) {
      return 'SOC';
    }
    
    // Product Team indicators (Development, Engineering, Application Security)
    if (ruleType.includes('product') || ruleType.includes('dev') || 
        ruleType.includes('engineering') || ruleType.includes('application') ||
        ruleType.includes('api') || ruleType.includes('web') ||
        ruleType.includes('code') || ruleType.includes('build') ||
        ruleType.includes('deploy') || ruleType.includes('pipeline') ||
        name.includes('app') || name.includes('api') || 
        name.includes('web') || name.includes('service') ||
        description.includes('application') || description.includes('api') ||
        description.includes('service') || description.includes('web') ||
        ruleType.includes('quality') || ruleType.includes('performance')) {
      return 'Product';
    }
    
    // Default assignment based on platform (infrastructure = SOC, application platforms = Product)
    if (['windows', 'linux', 'macos', 'aws', 'azure', 'gcp'].includes(platform)) {
      return 'SOC';  // Infrastructure and Cloud platforms typically managed by SOC
    }
    
    return 'SOC'; // Default to SOC for unclassified rules
  };

  // Calculate comprehensive team statistics
  const calculateTeamStats = () => {
    const teams = {
      'SOC': {
        count: 0,
        active: 0,
        testing: 0,
        inactive: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        recent: 0,
        platforms: new Set(),
        avgSeverity: 0
      },
      'Product': {
        count: 0,
        active: 0,
        testing: 0,
        inactive: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        recent: 0,
        platforms: new Set(),
        avgSeverity: 0
      }
    };
    
    rules.forEach(rule => {
      const team = categorizeTeam(rule);
      teams[team].count++;
      
      // Status distribution
      if (rule.status === 'Active') teams[team].active++;
      else if (rule.status === 'Testing') teams[team].testing++;
      else teams[team].inactive++;
      
      // Severity distribution
      if (rule.severity === 'Critical') teams[team].critical++;
      else if (rule.severity === 'High') teams[team].high++;
      else if (rule.severity === 'Medium') teams[team].medium++;
      else teams[team].low++;
      
      // Platform tracking
      if (rule.platform) teams[team].platforms.add(rule.platform);
      
      // Recent activity (simulate based on rule_id for demo)
      if (rule.updated_date && new Date(rule.updated_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        teams[team].recent++;
      }
    });
    
    // Calculate average severity scores
    Object.keys(teams).forEach(team => {
      const stats = teams[team];
      if (stats.count > 0) {
        stats.avgSeverity = Math.round(
          ((stats.critical * 4) + (stats.high * 3) + (stats.medium * 2) + (stats.low * 1)) / stats.count
        );
      }
    });
    
    return teams;
  };

  const teamStats = calculateTeamStats();
  const totalRules = rules.length;

  // Team configuration focused on collaboration
  const teamConfig = {
    'SOC': {
      name: 'SOC',
      fullName: 'Security Operations Center',
      icon: Shield,
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
      description: 'Threat Detection & Incident Response',
      focus: 'Infrastructure security and threat monitoring',
      specialty: 'Specialized in threat detection and security operations'
    },
    'Product': {
      name: 'Product',
      fullName: 'Product Engineering Team',
      icon: Code,
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
      description: 'Application & Development Security',
      focus: 'Application security and development workflows',
      specialty: 'Focused on application security and business logic protection'
    }
  };

  const getPerformanceScore = (stats) => {
    if (stats.count === 0) return 0;
    const activeRatio = stats.active / stats.count;
    const criticalRatio = stats.critical / stats.count;
    const recentActivity = stats.recent / stats.count;
    return Math.round((activeRatio * 0.5 + criticalRatio * 0.3 + recentActivity * 0.2) * 100);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="w-5 h-5" />
            Team Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse">
                <div className="h-20 bg-slate-200 dark:bg-slate-600 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Users className="w-5 h-5" />
              Team Contributions
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              How our security teams contribute to rule development
            </p>
          </div>
          <div className="flex gap-2">
            {['overview', 'breakdown'].map((view) => (
              <Button
                key={view}
                variant={selectedView === view ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView(view)}
                className="capitalize"
              >
                {view}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {['SOC', 'Product'].map((teamName, index) => {
                const config = teamConfig[teamName];
                const stats = teamStats[teamName];
                const percentage = totalRules > 0 ? Math.round((stats.count / totalRules) * 100) : 0;
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={teamName}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative group cursor-pointer"
                  >
                    <div className={`p-6 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <IconComponent className="w-10 h-10 text-white/90" />
                          <Badge className="bg-white/20 text-white border-0 font-bold text-lg px-3 py-1">
                            {percentage}%
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-4xl font-bold mb-2">{stats.count}</div>
                          <div className="text-lg font-semibold text-white/95 mb-1">{config.name}</div>
                          <div className="text-sm text-white/80">{config.description}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-white/90 mb-4">
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            <span>{stats.active} Active</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            <span>{stats.critical} Critical</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{stats.platforms.size} Platforms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{stats.recent} Recent</span>
                          </div>
                        </div>
                        
                        {/* Performance indicator */}
                        <div className="bg-white/20 rounded-full h-3 mb-2">
                          <div 
                            className="bg-white rounded-full h-3 transition-all duration-1000 flex items-center justify-end pr-2"
                            style={{ width: `${getPerformanceScore(stats)}%` }}
                          >
                            <span className="text-xs font-bold text-slate-800">
                              {getPerformanceScore(stats)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-white/70">Team Performance</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {selectedView === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {['SOC', 'Product'].map((teamName) => {
                const config = teamConfig[teamName];
                const stats = teamStats[teamName];
                const IconComponent = config.icon;

                return (
                  <div key={teamName} className="p-6 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {config.fullName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {config.specialty}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                          {stats.count}
                        </div>
                        <div className="text-sm text-slate-500">Rules Built</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-slate-600 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.active}</div>
                        <div className="text-xs text-slate-500">Active</div>
                        <div className="text-xs text-slate-400">
                          {stats.count > 0 ? Math.round((stats.active / stats.count) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-600 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">{stats.critical}</div>
                        <div className="text-xs text-slate-500">Critical</div>
                        <div className="text-xs text-slate-400">
                          {stats.count > 0 ? Math.round((stats.critical / stats.count) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-600 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600 mb-1">{stats.testing}</div>
                        <div className="text-xs text-slate-500">Testing</div>
                        <div className="text-xs text-slate-400">
                          {stats.count > 0 ? Math.round((stats.testing / stats.count) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-600 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{stats.platforms.size}</div>
                        <div className="text-xs text-slate-500">Platforms</div>
                        <div className="text-xs text-slate-400">Coverage</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Stats */}
        <motion.div 
          className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Combined Team Impact
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Together, our teams have built comprehensive security coverage
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalRules}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Rules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {teamStats.SOC.active + teamStats.Product.active}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active Rules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {teamStats.SOC.critical + teamStats.Product.critical}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Critical Severity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {teamStats.SOC.platforms.size + teamStats.Product.platforms.size}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Platforms</div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
} 