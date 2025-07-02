import React, { useState } from "react";
import { DetectionRule } from "@/api/entities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Play, Pause, TestTube, ChevronDown, ChevronUp, Shield, Code, Tag, User, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationDialog from '../shared/ConfirmationDialog';
import ExpandableText from "@/components/ui/expandable-text";

const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Testing: "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-slate-100 text-slate-700 border-slate-200"
};

const STATUS_ICONS = {
  Active: Play,
  Testing: TestTube,
  Inactive: Pause
};

export default function RulesList({ rules, onEdit, onRuleUpdate }) {
  const [showAll, setShowAll] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const promptDeleteRule = (ruleId) => {
    setRuleToDelete(ruleId);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await DetectionRule.delete(ruleToDelete);
      await onRuleUpdate();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      if (error.message?.includes('404') || error.message?.includes('Entity not found')) {
        alert("This rule has already been deleted or no longer exists. The page will refresh to show current data.");
      } else {
        alert("There was an error deleting the rule. Please try again.");
      }
      await onRuleUpdate();
    } finally {
      setRuleToDelete(null);
    }
  };

  const handleToggleStatus = async (rule) => {
    try {
      const newStatus = rule.status === "Active" ? "Inactive" : "Active";
      const ruleId = rule._id || rule.id;
      await DetectionRule.update(ruleId, { status: newStatus });
      await onRuleUpdate();
    } catch (error) {
      console.error("Failed to update rule status:", error);
      if (error.message?.includes('404') || error.message?.includes('Entity not found')) {
        alert("This rule no longer exists. The page will refresh to show current data.");
      } else {
        alert("There was an error updating the rule status. Please try again.");
      }
      await onRuleUpdate();
    }
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <TestTube className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Detection Rules</h3>
        <p className="text-sm">Create your first rule to start detecting this technique.</p>
      </div>
    );
  }

  const displayedRules = showAll ? rules : rules.slice(0, 3);

  return (
    <>
      <ConfirmationDialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Rule?"
        description="This action cannot be undone. This will permanently delete this detection rule."
      />
      <motion.div layout>
        <div className={`space-y-6 ${showAll ? 'max-h-[50vh] overflow-y-auto pr-2' : ''}`}>
          <AnimatePresence initial={false}>
            {displayedRules.map((rule, index) => {
              const StatusIcon = STATUS_ICONS[rule.status];
              return (
                <motion.div
                  key={rule._id || rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600">
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-700/80 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {rule.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs font-mono bg-slate-100/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-300/60 dark:border-slate-600/60">
                                  {rule.rule_id}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60">
                                  {rule.platform}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <ExpandableText 
                              text={rule.description || "No description provided."}
                              maxLines={2}
                              className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                              showMoreText="Show more"
                              showLessText="Show less"
                            />
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs px-3 py-1 font-medium shadow-sm ${STATUS_COLORS[rule.status]}`}>
                              <StatusIcon className="w-3 h-3 mr-1.5" />
                              {rule.status}
                            </Badge>
                            
                            {rule.severity && (
                              <Badge variant="outline" className={`text-xs px-2 py-1 font-medium ${
                                rule.severity === 'Critical' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-700/60' :
                                rule.severity === 'High' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-700/60' :
                                rule.severity === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/60' :
                                'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/60 dark:border-green-700/60'
                              }`}>
                                {rule.severity}
                              </Badge>
                            )}

                            {rule.rule_type && (
                              <Badge variant="outline" className={`text-xs px-2 py-1 font-medium ${
                                rule.rule_type === 'Product' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-700/60' :
                                'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-700/60'
                              }`}>
                                {rule.rule_type}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(rule)}
                            className={`px-4 py-2 font-medium transition-all duration-200 border-opacity-60 ${
                              rule.status === "Active" 
                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50" 
                                : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            }`}
                          >
                            {rule.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(rule)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => promptDeleteRule(rule._id || rule.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6 pb-6">
                      {/* Enhanced XQL Query Section */}
                      <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 rounded-xl p-6 border border-slate-200/50 dark:border-slate-600/50 shadow-inner">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Code className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900 dark:text-slate-100">XQL Query</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Detection logic and filters</p>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-600/60 p-4 shadow-sm">
                          <pre className="text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                            {rule.xql_query || "No query defined"}
                          </pre>
                        </div>
                      </div>

                      {/* Enhanced Tags Section */}
                      {rule.tags && rule.tags.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rule.tags.map((tag, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 cursor-default"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Metadata */}
                      {(rule.assigned_user || rule.technique_id) && (
                        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center justify-between text-sm">
                            {rule.assigned_user && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <User className="w-4 h-4" />
                                <span>Assigned to: <span className="font-medium text-slate-900 dark:text-slate-100">{rule.assigned_user}</span></span>
                              </div>
                            )}
                            {rule.technique_id && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Target className="w-4 h-4" />
                                <span>Technique: <span className="font-medium text-slate-900 dark:text-slate-100">{rule.technique_id}</span></span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {rules.length > 3 && (
          <div className="mt-6 flex justify-center border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 w-full"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show {rules.length - 3} More Rules
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
}
