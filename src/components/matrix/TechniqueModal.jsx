
import React, { useState, useEffect } from "react";
import { DetectionRule } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Shield, Code, Settings, Target } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon";

import RulesList from "./RulesList";
import RuleEditor from "./RuleEditor";

export default function TechniqueModal({ technique, rules, onClose, onRuleUpdate, startWithRuleEditor }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingRule, setEditingRule] = useState(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  useEffect(() => {
    if (technique) {
      if (startWithRuleEditor) {
        handleNewRule();
      } else {
        // If starting with rule editor, the active tab might become 'rules'
        // If not, ensure it's 'overview' and reset editor state
        setActiveTab("overview");
        setEditingRule(null);
        setShowRuleEditor(false);
      }
    }
  }, [technique, startWithRuleEditor]);

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
    setActiveTab("rules");
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setShowRuleEditor(true);
    setActiveTab("rules");
  };

  const handleRuleSaved = async () => {
    setShowRuleEditor(false);
    setEditingRule(null);
    await onRuleUpdate();
  };

  const getRulesByStatus = (status) => {
    return rules.filter(rule => 
      rule.status === status && 
      rule.technique_id === technique?.technique_id &&
      rule.tactic === technique?.tactic
    );
  };

  const filteredRules = rules.filter(rule => 
    rule.technique_id === technique?.technique_id &&
    rule.tactic === technique?.tactic
  );

  if (!technique) return null;

  return (
    <Dialog open={!!technique} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="border-b border-slate-200 pb-4 px-6 pt-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold text-slate-900 leading-tight mb-2">
                  {technique.technique_id}: {technique.name}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {technique.tactic}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-sm grid-cols-2 bg-slate-100">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Rules ({filteredRules.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Redesigned New Rule Button */}
                <Button 
                  onClick={handleNewRule} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2.5 font-semibold"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Rule
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Description</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {technique.description || "No description available for this technique."}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Platforms</h3>
                    <div className="flex flex-wrap gap-2">
                      {technique.platforms?.map((platform) => {
                        return (
                          <Badge 
                            key={platform}
                            variant="outline" 
                            className="bg-slate-50 text-slate-700 border-slate-300"
                          >
                            <PlatformIcon platform={platform} className="w-4 h-4 mr-2" />
                            {platform}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-800 mb-2">Active Rules</h4>
                    <p className="text-2xl font-bold text-emerald-900">{getRulesByStatus("Active").length}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">Testing Rules</h4>
                    <p className="text-2xl font-bold text-amber-900">{getRulesByStatus("Testing").length}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Inactive Rules</h4>
                    <p className="text-2xl font-bold text-slate-900">{getRulesByStatus("Inactive").length}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-4">
                {showRuleEditor ? (
                  <RuleEditor
                    rule={editingRule}
                    technique={technique}
                    onSave={handleRuleSaved}
                    onCancel={() => setShowRuleEditor(false)}
                  />
                ) : (
                  <RulesList
                    rules={filteredRules}
                    onEdit={handleEditRule}
                    onRuleUpdate={onRuleUpdate}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
