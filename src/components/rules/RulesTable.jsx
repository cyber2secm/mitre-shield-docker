import React, { useState } from "react";
import { DetectionRule } from "@/api/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Play, Pause, TestTube, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import ConfirmationDialog from "../shared/ConfirmationDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RuleEditor from "../matrix/RuleEditor";

const STATUS_COLORS = {
  Active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  Testing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  Inactive: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
};

const SEVERITY_COLORS = {
  Critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
  High: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700",
  Medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  Low: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
};

const PLATFORM_COLORS = {
  Windows: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  macOS: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  Linux: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  Cloud: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  Containers: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
};

const RULE_TYPE_COLORS = {
  Product: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
  SOC: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
};

export default function RulesTable({ rules, isLoading, onRuleUpdate }) {
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState(null);

  const promptDeleteRule = (ruleId) => {
    setRuleToDelete(ruleId);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    setDeletingRuleId(ruleToDelete);
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
      setDeletingRuleId(null);
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

  const handleRuleSaved = async () => {
    setShowRuleEditor(false);
    setEditingRule(null);
    await onRuleUpdate();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <TestTube className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Rules Found</h3>
        <p className="text-sm">No detection rules match your current filters.</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the detection rule and all associated data."
      />
      
      {showRuleEditor && (
        <Dialog open={showRuleEditor} onOpenChange={() => setShowRuleEditor(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
            <RuleEditor
              rule={editingRule}
              onSave={handleRuleSaved}
              onCancel={() => setShowRuleEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Rule Name</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Technique</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Platform</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Type</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Status</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Severity</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Assigned</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Updated</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <motion.tr
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{rule.name}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{rule.rule_id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600">
                    {rule.technique_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={PLATFORM_COLORS[rule.platform]}>
                    {rule.platform}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={RULE_TYPE_COLORS[rule.rule_type] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}>
                    {rule.rule_type || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[rule.status]}>
                    {rule.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={SEVERITY_COLORS[rule.severity]}>
                    {rule.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.assigned_user ? (
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {rule.assigned_user.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                  {format(new Date(rule.updated_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      className="text-xs"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(rule)}
                      className="text-xs"
                    >
                      {rule.status === "Active" ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => promptDeleteRule(rule.id)}
                      disabled={deletingRuleId === rule.id}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
