
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

const STATUS_COLORS = {
  "Planned": "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Ready for Review": "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const PRIORITY_COLORS = {
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
      <div className="text-center py-12 text-slate-500">
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
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Rule Name</TableHead>
              <TableHead className="font-semibold">Technique</TableHead>
              <TableHead className="font-semibold">Platform</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Assigned To</TableHead>
              <TableHead className="font-semibold">Target Date</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
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
                    {rule.description && (
                      <span className="text-sm text-slate-500 truncate max-w-xs">
                        {rule.description}
                      </span>
                    )}
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
                  <Badge className={PRIORITY_COLORS[rule.priority]}>
                    {rule.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.assigned_to && rule.assigned_to !== 'Unassigned' ? (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-700 font-medium">
                        {rule.assigned_to.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {rule.target_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(rule.target_date), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPromote(rule)}
                      className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
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
                      className="text-red-600 hover:text-red-700"
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
