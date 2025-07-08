import React, { useState, useEffect } from "react";
import { DetectionRule, MitreTechnique } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Shield, Target, Activity, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import CoverageHeatmap from "../components/analytics/CoverageHeatmap";
import PlatformDistribution from "../components/analytics/PlatformDistribution";
import RuleStatusChart from "../components/analytics/RuleStatusChart";
import RuleTeamDistribution from "../components/analytics/RuleTeamDistribution";
import TopTechniques from "../components/analytics/TopTechniques";

export default function AnalyticsPage() {
  const [rules, setRules] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  // Add interval to refresh data periodically to catch external changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ruleData, techniqueData] = await Promise.all([
        DetectionRule.list(),
        MitreTechnique.list()
      ]);
      setRules(ruleData);
      setTechniques(techniqueData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    }
    setIsLoading(false);
  };

  const filteredRules = selectedPlatform === 'all'
    ? rules
    : rules.filter(r => r.platform === selectedPlatform);

  const filteredTechniques = selectedPlatform === 'all'
    ? techniques
    : techniques.filter(t => t.platforms?.includes(selectedPlatform));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  {selectedPlatform === 'all'
                    ? 'Detection coverage and performance insights'
                    : `Insights for ${selectedPlatform}`
                  }
                </p>
              </div>
            </div>
            <div>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                  <SelectItem value="macOS">macOS</SelectItem>
                  <SelectItem value="Linux">Linux</SelectItem>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="Azure">Azure</SelectItem>
                  <SelectItem value="GCP">GCP</SelectItem>
                  <SelectItem value="Containers">Containers</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Platform Distribution takes full width now */}
          <div className="grid grid-cols-1 gap-8">
            <PlatformDistribution 
              rules={filteredRules} 
              isLoading={isLoading}
              onDataUpdate={loadData}
            />
          </div>

          {/* Coverage Heatmap and Top Techniques side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CoverageHeatmap 
              rules={filteredRules} 
              techniques={filteredTechniques} 
              isLoading={isLoading}
              selectedPlatform={selectedPlatform}
              onDataUpdate={loadData}
            />
            <TopTechniques 
              rules={filteredRules} 
              isLoading={isLoading}
              onDataUpdate={loadData}
            />
          </div>

          {/* Rule Status Chart and Team Distribution side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RuleStatusChart 
              rules={filteredRules} 
              isLoading={isLoading}
              onDataUpdate={loadData}
            />
            <RuleTeamDistribution 
              rules={filteredRules} 
              isLoading={isLoading}
              onDataUpdate={loadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
