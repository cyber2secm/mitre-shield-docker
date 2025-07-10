import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, User, Shield, Target, Settings, FileText, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function FutureRuleForm({ rule, onSubmit, onCancel, availableUsers = [] }) {
  const getInitialState = () => (rule || {
    name: "",
    description: "",
    technique_id: "",
    platform: "",
    tactic: "",
    priority: "Medium",
    rule_type: "SOC",
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {rule ? "Edit Future Rule" : "Create Future Rule"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Plan and track future detection rule development
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Shield className="w-5 h-5 text-purple-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rule Name *</label>
                <Input
                  placeholder="Name of the future detection rule"
                  value={currentRule.name}
                  onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Technique ID *</label>
                <Input
                  placeholder="e.g., T1059"
                  value={currentRule.technique_id}
                  onChange={(e) => setCurrentRule({...currentRule, technique_id: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform *</label>
                <Select
                  value={currentRule.platform}
                  onValueChange={(value) => setCurrentRule({...currentRule, platform: value})}
                  required
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
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
                    <SelectItem value="Alibaba">Alibaba</SelectItem>
                    <SelectItem value="Containers">Containers</SelectItem>
                    <SelectItem value="Office Suite">Office Suite</SelectItem>
                    <SelectItem value="Identity Provider">Identity Provider</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="IaaS">IaaS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tactic *</label>
                <Select
                  value={currentRule.tactic}
                  onValueChange={(value) => setCurrentRule({...currentRule, tactic: value})}
                  required
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
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
          </CardContent>
        </Card>

        {/* Project Management Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Settings className="w-5 h-5 text-purple-600" />
              Project Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                <Select
                  value={currentRule.priority}
                  onValueChange={(value) => setCurrentRule({...currentRule, priority: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Critical
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rule Type *</label>
                <Select
                  value={currentRule.rule_type}
                  onValueChange={(value) => setCurrentRule({...currentRule, rule_type: value})}
                  required
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        Product
                      </div>
                    </SelectItem>
                    <SelectItem value="SOC">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        SOC
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <Select
                  value={currentRule.status}
                  onValueChange={(value) => setCurrentRule({...currentRule, status: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Planned
                      </div>
                    </SelectItem>
                    <SelectItem value="In Progress">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="Ready for Review">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Ready for Review
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Effort</label>
                <Select
                  value={currentRule.estimated_effort}
                  onValueChange={(value) => setCurrentRule({...currentRule, estimated_effort: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select effort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small (1-2 days)</SelectItem>
                    <SelectItem value="Medium">Medium (3-5 days)</SelectItem>
                    <SelectItem value="Large">Large (1+ weeks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    >
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned To</label>
                <Select
                  value={currentRule.assigned_to}
                  onValueChange={(value) => setCurrentRule({...currentRule, assigned_to: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <User className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user.split('@')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Notes Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <FileText className="w-5 h-5 text-purple-600" />
              Description & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Textarea
                placeholder="Describe what this rule will detect and any specific requirements..."
                value={currentRule.description}
                onChange={(e) => setCurrentRule({...currentRule, description: e.target.value})}
                className="h-24 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <Textarea
                placeholder="Additional notes, requirements, or implementation details..."
                value={currentRule.notes}
                onChange={(e) => setCurrentRule({...currentRule, notes: e.target.value})}
                className="h-24 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button 
            type="submit" 
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
