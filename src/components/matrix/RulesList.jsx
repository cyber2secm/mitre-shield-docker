
import React, { useState } from "react";
import { DetectionRule } from "@/api/entities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Play, Pause, TestTube, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationDialog from '../shared/ConfirmationDialog';

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
        <div className={`space-y-4 ${showAll ? 'max-h-[50vh] overflow-y-auto pr-2' : ''}`}>
          <AnimatePresence initial={false}>
            {displayedRules.map((rule) => {
              const StatusIcon = STATUS_ICONS[rule.status];
              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <Card className="border-slate-200 hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900 truncate">{rule.name}</h4>
                            <Badge className={`text-xs px-2 py-1 ${STATUS_COLORS[rule.status]}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {rule.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rule.platform}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {rule.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(rule)}
                            className="text-xs"
                          >
                            {rule.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promptDeleteRule(rule.id)} // Changed to use new confirmation dialog
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-slate-500">XQL Query:</span>
                          <Badge variant="outline" className="text-xs">{rule.rule_id}</Badge>
                        </div>
                        <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap break-all">
                          {rule.xql_query || "No query defined"}
                        </pre>
                      </div>

                      {rule.tags && rule.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {rule.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {tag}
                            </Badge>
                          ))}
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
          <div className="mt-4 flex justify-center border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-full"
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
