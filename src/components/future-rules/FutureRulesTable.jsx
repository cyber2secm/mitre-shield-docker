import React, { useState } from "react";
import { FutureRule } from "@/api/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Calendar, Clock, Rocket, User } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import ConfirmationDialog from "../shared/ConfirmationDialog";
import ExpandableText from "@/components/ui/expandable-text";

const STATUS_COLORS = {
  "Planned": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  "In Progress": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  "Ready for Review": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
};

const PRIORITY_COLORS = {
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

export default function FutureRulesTable({ rules, isLoading, onEdit, onRuleUpdate, onPromote }) {
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const promptDeleteRule = (ruleId) => {
    setRuleToDelete(ruleId);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await FutureRule.delete(ruleToDelete);
      await onRuleUpdate();
    } catch (error) {
      console.error("Failed to delete future rule:", error);
      if (error.message?.includes('404') || error.message?.includes('Entity not found')) {
        alert("This rule has already been deleted or no longer exists. The page will refresh to show current data.");
      } else {
        alert("There was an error deleting the rule. Please try again.");
      }
      await onRuleUpdate(); // Ensure refresh happens even on error
    } finally {
      setRuleToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
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
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Future Rules Found</h3>
        <p className="text-sm">No future rules match your current filters.</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Future Rule?"
        description="This will permanently remove this planned rule. This action cannot be undone."
      />
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Rule Name</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Technique</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Platform</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Type</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Status</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Priority</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Assigned To</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Target Date</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <motion.tr
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{rule.name}</span>
                    {rule.description && (
                      <div className="max-w-xs">
                        <ExpandableText 
                          text={rule.description}
                          maxLines={1}
                          className="text-sm text-slate-500 dark:text-slate-400"
                          showMoreText="more"
                          showLessText="less"
                        />
                      </div>
                    )}
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
                  <Badge className={PRIORITY_COLORS[rule.priority]}>
                    {rule.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.assigned_to && rule.assigned_to !== 'Unassigned' ? (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {rule.assigned_to.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                  {rule.target_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(rule.target_date), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPromote(rule)}
                      className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                      title="Promote to Detection Rule"
                    >
                      <Rocket className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(rule)}
                      className="text-xs"
                      title="Edit Future Rule"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => promptDeleteRule(rule.id)}
                      title="Delete Future Rule"
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
