
import React, { useState, useEffect } from "react";
import { FutureRule } from "@/api/entities";
import { DetectionRule } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Clock, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import FutureRulesTable from "../components/future-rules/FutureRulesTable";
import FutureRulesStats from "../components/future-rules/FutureRulesStats";
import FutureRuleForm from "../components/future-rules/FutureRuleForm";
import RuleEditor from "../components/matrix/RuleEditor";

export default function FutureRulesPage() {
  const [futureRules, setFutureRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [promotingRule, setPromotingRule] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    platform: "all",
    status: "all",
    priority: "all",
    tactic: "all"
  });

  useEffect(() => {
    loadFutureRules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [futureRules, filters]);

  const loadFutureRules = async () => {
    setIsLoading(true);
    try {
      const data = await FutureRule.list("-created_date");
      setFutureRules(data);
    } catch (error) {
      console.error("Failed to load future rules:", error);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...futureRules];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm) ||
        rule.description?.toLowerCase().includes(searchTerm) ||
        rule.technique_id.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.platform !== "all") {
      filtered = filtered.filter(rule => rule.platform === filters.platform);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(rule => rule.status === filters.status);
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter(rule => rule.priority === filters.priority);
    }

    if (filters.tactic !== "all") {
      filtered = filtered.filter(rule => rule.tactic === filters.tactic);
    }

    setFilteredRules(filtered);
  };

  const handleSubmit = async (ruleData) => {
    try {
      if (editingRule) {
        const ruleId = editingRule._id || editingRule.id;
        await FutureRule.update(ruleId, ruleData);
      } else {
        await FutureRule.create(ruleData);
      }
      setShowForm(false);
      setEditingRule(null);
      loadFutureRules();
    } catch (error) {
      console.error("Failed to save future rule:", error);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handlePromote = (rule) => {
    setPromotingRule(rule);
  };

  const handlePromoteSave = async (newRuleData) => {
    try {
      if (!promotingRule) return;
      
      const ruleId = promotingRule._id || promotingRule.id;
      
      // Debug: Log the entire newRuleData object
      console.log('Full newRuleData received:', newRuleData);
      console.log('rule_id value:', newRuleData.rule_id);
      console.log('rule_id type:', typeof newRuleData.rule_id);
      console.log('rule_id length:', newRuleData.rule_id ? newRuleData.rule_id.length : 'null/undefined');
      
      // Log the data being sent for debugging
      const promotionData = {
        rule_id: newRuleData.rule_id,
        xql_query: newRuleData.xql_query,
        status: newRuleData.status || 'Testing',
        false_positive_rate: newRuleData.false_positive_rate || 'Medium',
        tags: newRuleData.tags || []
      };
      console.log('Promoting rule with data:', promotionData);
      
      // Use the proper promotion API endpoint via apiClient
      const { apiClient } = await import('../api/apiClient');
      
      const result = await apiClient.post(`/future-rules/${ruleId}/promote`, promotionData);
      console.log('Promotion successful:', result);
      
      setPromotingRule(null);
      await loadFutureRules();
      
      // Show success message
      alert(`Successfully promoted "${promotingRule.name}" to detection rule!`);
    } catch (error) {
      console.error("Failed to promote rule:", error);
      console.error("Error details:", error);
      
      // Try to get more detailed error information
      let errorMessage = error.message;
      if (error.message.includes('Rule ID') && error.message.includes('already exists')) {
        errorMessage = `The Rule ID "${newRuleData.rule_id}" is already in use. Please choose a different Rule ID.`;
      }
      
      alert(`Failed to promote rule: ${errorMessage}`);
    }
  };

  const ruleToPromote = promotingRule ? {
    name: promotingRule.name,
    description: promotingRule.description,
    technique_id: promotingRule.technique_id,
    platform: promotingRule.platform,
    tactic: promotingRule.tactic,
    severity: promotingRule.priority, // Map FutureRule priority to DetectionRule severity
    assigned_user: promotingRule.assigned_to === 'Unassigned' ? '' : promotingRule.assigned_to, // Map assigned_to, handle 'Unassigned'
    status: 'Testing', // Default status for promoted rules
    false_positive_rate: 'Medium', // Default FPR
    tags: [], // Default empty tags
    rule_id: "", // Default empty rule_id, to be filled in RuleEditor
    xql_query: "" // Default empty xql_query, to be filled in RuleEditor
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Future Rules</h1>
                <p className="text-slate-600 text-sm font-medium">Plan and track upcoming detection rule implementations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Future Rule
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <FutureRulesStats rules={futureRules} />

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search future rules by name, technique, or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-white border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              
              <div className="flex gap-3">
                <Select 
                  value={filters.platform} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger className="w-40 bg-white border-slate-200">
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
                  <SelectTrigger className="w-40 bg-white border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.priority} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="w-32 bg-white border-slate-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showForm && (
              <div className="mb-6">
                <FutureRuleForm
                  rule={editingRule}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingRule(null);
                  }}
                />
              </div>
            )}

            <FutureRulesTable
              rules={filteredRules}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRuleUpdate={loadFutureRules}
              onPromote={handlePromote}
            />
          </div>
        </div>
      </div>
      
      {promotingRule && (
        <Dialog open={!!promotingRule} onOpenChange={() => setPromotingRule(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Promote to Detection Rule</DialogTitle>
            </DialogHeader>
            <RuleEditor
              rule={ruleToPromote}
              onSave={handlePromoteSave}
              onCancel={() => setPromotingRule(null)}
              isPromotion={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
