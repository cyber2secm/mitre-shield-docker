
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, User } from "lucide-react";
import { motion } from "framer-motion";

const TEAM_MEMBERS = [
  "Isaac Krzywanowski",
  "Leeroy Perera",
  "Alexey Didusenko",
  "Chava Connack",
  "Adir Amar",
  "Maria Prusskov"
];

export default function FutureRuleForm({ rule, onSubmit, onCancel }) {
  const getInitialState = () => (rule || {
    name: "",
    description: "",
    technique_id: "",
    platform: "",
    tactic: "",
    priority: "Medium",
    status: "Planned",
    estimated_effort: "Medium",
    target_date: "",
    assigned_to: "Unassigned",
    notes: ""
  });
  
  const [currentRule, setCurrentRule] = React.useState(getInitialState());

  useEffect(() => {
    setCurrentRule(getInitialState());
  }, [rule]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(currentRule);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          {rule ? 'Edit Future Rule' : 'Add New Future Rule'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rule Name</label>
              <Input
                placeholder="Name of the future detection rule"
                value={currentRule.name}
                onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Technique ID</label>
              <Input
                placeholder="e.g., T1059"
                value={currentRule.technique_id}
                onChange={(e) => setCurrentRule({...currentRule, technique_id: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Platform</label>
              <Select
                value={currentRule.platform}
                onValueChange={(value) => setCurrentRule({...currentRule, platform: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Tactic</label>
              <Select
                value={currentRule.tactic}
                onValueChange={(value) => setCurrentRule({...currentRule, tactic: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tactic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial Access">Initial Access</SelectItem>
                  <SelectItem value="Execution">Execution</SelectItem>
                  <SelectItem value="Persistence">Persistence</SelectItem>
                  <SelectItem value="Privilege Escalation">Privilege Escalation</SelectItem>
                  <SelectItem value="Defense Evasion">Defense Evasion</SelectItem>
                  <SelectItem value="Credential Access">Credential Access</SelectItem>
                  <SelectItem value="Discovery">Discovery</SelectItem>
                  <SelectItem value="Lateral Movement">Lateral Movement</SelectItem>
                  <SelectItem value="Collection">Collection</SelectItem>
                  <SelectItem value="Command and Control">Command and Control</SelectItem>
                  <SelectItem value="Exfiltration">Exfiltration</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
              <Select
                value={currentRule.priority}
                onValueChange={(value) => setCurrentRule({...currentRule, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <Select
                value={currentRule.status}
                onValueChange={(value) => setCurrentRule({...currentRule, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Estimated Effort</label>
              <Select
                value={currentRule.estimated_effort}
                onValueChange={(value) => setCurrentRule({...currentRule, estimated_effort: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select effort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small (1-2 days)</SelectItem>
                  <SelectItem value="Medium">Medium (3-5 days)</SelectItem>
                  <SelectItem value="Large">Large (1+ weeks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Target Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentRule.target_date ? format(new Date(currentRule.target_date), 'PPP') : 'Set target date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={currentRule.target_date ? new Date(currentRule.target_date) : undefined}
                    onSelect={(date) => setCurrentRule({...currentRule, target_date: date})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned To</label>
          <Select
            value={currentRule.assigned_to}
            onValueChange={(value) => setCurrentRule({...currentRule, assigned_to: value})}
          >
            <SelectTrigger>
              <User className="w-4 h-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unassigned">Unassigned</SelectItem>
              {TEAM_MEMBERS.map((member) => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <Textarea
            placeholder="Describe what this rule will detect and any specific requirements..."
            value={currentRule.description}
            onChange={(e) => setCurrentRule({...currentRule, description: e.target.value})}
            className="h-20"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
          <Textarea
            placeholder="Additional notes, requirements, or implementation details..."
            value={currentRule.notes}
            onChange={(e) => setCurrentRule({...currentRule, notes: e.target.value})}
            className="h-20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            {rule ? 'Update Rule' : 'Add Rule'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
