import React, { useState, useEffect } from "react";
import { DetectionRule } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Database, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

import RulesTable from "../components/rules/RulesTable";
import RulesStats from "../components/rules/RulesStats";
import ImportModal from "../components/rules/ImportModal";

const TEAM_MEMBERS = [
  "Isaac Krzywanowski",
  "Leeroy Perera", 
  "Alexey Didusenko",
  "Chava Connack",
  "Adir Amar",
  "Maria Prusskov"
];

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    platform: "all",
    status: "all",
    tactic: "all",
    severity: "all",
    rule_type: "all",
    assigned_user: "all"
  });

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rules, filters]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await DetectionRule.list("-updated_date");
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...rules];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm) ||
        rule.description?.toLowerCase().includes(searchTerm) ||
        rule.technique_id.toLowerCase().includes(searchTerm) ||
        rule.rule_id.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.platform !== "all") {
      filtered = filtered.filter(rule => rule.platform === filters.platform);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(rule => rule.status === filters.status);
    }

    if (filters.tactic !== "all") {
      filtered = filtered.filter(rule => rule.tactic === filters.tactic);
    }

    if (filters.severity !== "all") {
      filtered = filtered.filter(rule => rule.severity === filters.severity);
    }

    if (filters.rule_type !== "all") {
      filtered = filtered.filter(rule => rule.rule_type === filters.rule_type);
    }

    if (filters.assigned_user !== "all") {
      if (filters.assigned_user === "unassigned") {
        filtered = filtered.filter(rule => !rule.assigned_user || rule.assigned_user.trim() === "");
      } else {
        filtered = filtered.filter(rule => rule.assigned_user === filters.assigned_user);
      }
    }

    setFilteredRules(filtered);
  };

  const exportToCSV = () => {
    const csvData = filteredRules.map(rule => ({
      'Rule ID': rule.rule_id,
      'Name': rule.name,
      'Technique ID': rule.technique_id,
      'Platform': rule.platform,
      'Tactic': rule.tactic,
      'Status': rule.status,
      'Severity': rule.severity,
      'Rule Type': rule.rule_type,
      'Created': new Date(rule.created_date).toLocaleDateString(),
      'Updated': new Date(rule.updated_date).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'detection_rules.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (newRules) => {
    try {
      await DetectionRule.bulkCreate(newRules);
      await loadRules(); // Refresh the list
      return { success: true, message: `${newRules.length} rules imported successfully!` };
    } catch (error) {
      console.error("Failed to import rules:", error);
      return { success: false, message: `Import failed: ${error.message}` };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Detection Rules</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Manage and monitor your XQL detection rules</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredRules.length === 0}
                className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 flex items-center gap-2 shadow-lg"
                onClick={() => setShowImportModal(true)}
              >
                <Plus className="w-4 h-4" />
                Import Rules
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <RulesStats rules={rules} />

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Search rules by name, ID, technique, or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex gap-3">
                <Select 
                  value={filters.platform} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="Windows">Windows</SelectItem>
                    <SelectItem value="macOS">macOS</SelectItem>
                    <SelectItem value="Linux">Linux</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                    <SelectItem value="GCP">GCP</SelectItem>
                    <SelectItem value="Oracle">Oracle</SelectItem>
                    <SelectItem value="Containers">Containers</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.severity} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.rule_type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, rule_type: value }))}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="SOC">SOC</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.assigned_user} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_user: value }))}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Assigned User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {TEAM_MEMBERS.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <RulesTable
              rules={filteredRules}
              isLoading={isLoading}
              onRuleUpdate={loadRules}
            />
          </div>
        </div>
      </div>
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  );
}
