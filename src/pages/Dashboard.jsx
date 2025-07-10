import React, { useState, useEffect } from "react";
import { DetectionRule, MitreTechnique } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Shield, AlertTriangle, Target, Activity, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

import SecurityPosture from "../components/dashboard/SecurityPosture";
import ThreatLandscape from "../components/dashboard/ThreatLandscape";
import DetectionEffectiveness from "../components/dashboard/DetectionEffectiveness";
import RecentActivity from "../components/dashboard/RecentActivity";
import RiskAssessment from "../components/dashboard/RiskAssessment";
import CoverageGaps from "../components/dashboard/CoverageGaps";

export default function DashboardPage() {
  const [rules, setRules] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ruleData, techniqueData, analytics] = await Promise.all([
        DetectionRule.list("-updated_date"),
        MitreTechnique.list(),
        fetchAnalytics()
      ]);
      setRules(ruleData);
      setTechniques(techniqueData);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
    setIsLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return null;
    }
  };

  const getDashboardMetrics = () => {
    const activeRules = rules.filter(r => r.status === "Active");
    const testingRules = rules.filter(r => r.status === "Testing");
    const highSeverityRules = rules.filter(r => r.severity === "Critical" || r.severity === "High");
    
    // Use coverage calculation from backend analytics API (same method as analytics.js)
    const coveragePercentage = analyticsData?.coverage_percentage || 0;
    
    // Risk score calculation (0-100)
    const riskFactors = {
      lowCoverage: coveragePercentage < 60 ? 30 : coveragePercentage < 80 ? 15 : 0,
      inactiveRules: (rules.length - activeRules.length) > 10 ? 20 : 0,
      missingHighSeverity: highSeverityRules.length < 5 ? 25 : 0,
      testingBacklog: testingRules.length > 20 ? 15 : 0
    };
    
    const riskScore = Math.min(100, Object.values(riskFactors).reduce((sum, val) => sum + val, 0));
    
    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      testingRules: testingRules.length,
      coveragePercentage,
      riskScore,
      highSeverityRules: highSeverityRules.length,
      coveredTechniques: analyticsData?.total_techniques || 0,
      totalTechniques: techniques.length
    };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Security Operations Dashboard</h1>
              <p className="text-slate-600 text-sm font-medium">Executive overview of threat detection capabilities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="relative overflow-hidden border-slate-200 bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-emerald-500 rounded-full opacity-10" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Active Rules</p>
                      <CardTitle className="text-3xl font-bold mt-1 text-slate-900">
                        {metrics.activeRules}
                      </CardTitle>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50">
                      <Activity className="w-5 h-5 text-emerald-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      {Math.round((metrics.activeRules / metrics.totalRules) * 100)}% of total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="relative overflow-hidden border-slate-200 bg-white/90 backdrop-blur-sm">
                <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${metrics.riskScore > 50 ? 'bg-red-500' : metrics.riskScore > 25 ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full opacity-10`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Risk Score</p>
                      <CardTitle className={`text-3xl font-bold mt-1 ${metrics.riskScore > 50 ? 'text-red-700' : metrics.riskScore > 25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {metrics.riskScore}
                      </CardTitle>
                    </div>
                    <div className={`p-3 rounded-xl ${metrics.riskScore > 50 ? 'bg-red-50' : metrics.riskScore > 25 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                      <AlertTriangle className={`w-5 h-5 ${metrics.riskScore > 50 ? 'text-red-700' : metrics.riskScore > 25 ? 'text-amber-700' : 'text-emerald-700'}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge className={`text-xs ${metrics.riskScore > 50 ? 'bg-red-100 text-red-700' : metrics.riskScore > 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {metrics.riskScore > 50 ? 'High Risk' : metrics.riskScore > 25 ? 'Medium Risk' : 'Low Risk'}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="relative overflow-hidden border-slate-200 bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-purple-500 rounded-full opacity-10" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Critical Rules</p>
                      <CardTitle className="text-3xl font-bold mt-1 text-slate-900">
                        {metrics.highSeverityRules}
                      </CardTitle>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50">
                      <Zap className="w-5 h-5 text-purple-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    High severity detections
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SecurityPosture rules={rules} techniques={techniques} isLoading={isLoading} />
            <ThreatLandscape rules={rules} techniques={techniques} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <DetectionEffectiveness rules={rules} isLoading={isLoading} />
            <RiskAssessment rules={rules} techniques={techniques} isLoading={isLoading} />
            <CoverageGaps rules={rules} techniques={techniques} isLoading={isLoading} />
          </div>

          <RecentActivity rules={rules} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}