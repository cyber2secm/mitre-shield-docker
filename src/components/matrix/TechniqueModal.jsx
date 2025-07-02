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
import { Plus, Shield, Code, Settings, Target, X } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon";
import ExpandableText from "@/components/ui/expandable-text";

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
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-hidden p-0 flex flex-col bg-white dark:bg-slate-900 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-6 px-8 pt-8 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-800 flex-shrink-0">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3">
                  {technique.technique_id}: {technique.name}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-3 py-1 text-sm font-medium shadow-md">
                    {technique.tactic}
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 px-3 py-1 font-medium">
                    {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Enhanced New Rule Button */}
              <Button 
                onClick={handleNewRule} 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 font-semibold border-0"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Rule
              </Button>
              
              {/* Close Button */}
              <Button 
                onClick={onClose} 
                variant="outline"
                className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl w-12 h-12 p-0 shadow-sm"
                size="lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-8 pt-6 flex-shrink-0">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                  <Code className="w-4 h-4" />
                  Rules ({filteredRules.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="overflow-y-auto flex-1 px-8 pb-8">
              <TabsContent value="overview" className="space-y-8 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      Description
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                      <ExpandableText 
                        text={technique.description || "No description available."}
                        maxLines={6}
                        showMoreText="Show more"
                        showLessText="Show less"
                        className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Target className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      Platforms
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 min-h-[200px] flex flex-col">
                      <div className="flex flex-wrap gap-2 flex-1 content-start">
                        {technique.platforms?.map((platform) => {
                          return (
                            <Badge 
                              key={platform}
                              variant="outline" 
                              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 px-3 py-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm"
                            >
                              <PlatformIcon platform={platform} className="w-4 h-4 mr-2" />
                              {platform}
                            </Badge>
                          );
                        })}
                      </div>
                      
                      {/* Platform count summary */}
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          platform{(technique.platforms?.length || 0) !== 1 ? 's' : ''} supported
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Active Rules</h4>
                      <div className="w-10 h-10 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{getRulesByStatus("Active").length}</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Currently deployed</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300">Testing Rules</h4>
                      <div className="w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">{getRulesByStatus("Testing").length}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Under evaluation</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-300">Inactive Rules</h4>
                      <div className="w-10 h-10 bg-slate-500 dark:bg-slate-600 rounded-full flex items-center justify-center">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-200">{getRulesByStatus("Inactive").length}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-400 mt-1">Not in use</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-6">
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
