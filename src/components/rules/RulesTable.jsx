
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RuleEditor from "../matrix/RuleEditor";

const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Testing: "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-slate-100 text-slate-700 border-slate-200"
};

const SEVERITY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-blue-100 text-blue-700 border-blue-200"
};

const PLATFORM_COLORS = {
  Windows: "bg-blue-100 text-blue-700",
  macOS: "bg-gray-100 text-gray-700",
  Linux: "bg-orange-100 text-orange-700",
  Cloud: "bg-sky-100 text-sky-700",
  Containers: "bg-purple-100 text-purple-700"
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
      await DetectionRule.update(rule.id, { status: newStatus });
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
      <div className="text-center py-12 text-slate-500">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Detection Rule</DialogTitle>
            </DialogHeader>
            <RuleEditor
              rule={editingRule}
              onSave={handleRuleSaved}
              onCancel={() => setShowRuleEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Rule Name</TableHead>
              <TableHead className="font-semibold">Technique</TableHead>
              <TableHead className="font-semibold">Platform</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Severity</TableHead>
              <TableHead className="font-semibold">Assigned</TableHead>
              <TableHead className="font-semibold">Updated</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <motion.tr
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{rule.name}</span>
                    <span className="text-sm text-slate-500">{rule.rule_id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700">
                    {rule.technique_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={PLATFORM_COLORS[rule.platform]}>
                    {rule.platform}
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
                    <span className="text-sm text-slate-700 font-medium">
                      {rule.assigned_user.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
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
                      className="text-red-600 hover:text-red-700"
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
