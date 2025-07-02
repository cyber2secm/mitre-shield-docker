import React, { useState, useEffect } from "react";
import { DetectionRule } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus, Trash2, Play, TestTube, User, Shield, Code, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";

const TEAM_MEMBERS = [
  "Isaac Krzywanowski",
  "Leeroy Perera", 
  "Alexey Didusenko",
  "Chava Connack",
  "Adir Amar",
  "Maria Prusskov"
];

export default function RuleEditor({ rule, technique, onSave, onCancel, isPromotion = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");

  const [currentRule, setCurrentRule] = useState(
    rule || {
      rule_id: "",
      name: "",
      description: "",
      technique_id: technique?.technique_id || "",
      platform: "",
      tactic: technique?.tactic || "",
      status: "Testing",
      xql_query: "",
      tags: [],
      severity: "Medium",
      rule_type: "SOC",
      false_positive_rate: "Medium",
      assigned_user: "unassigned"
    }
  );

  useEffect(() => {
    if (rule) {
      setCurrentRule({
        ...rule,
        tags: rule.tags || [],
        rule_type: rule.rule_type || "SOC",  // Ensure rule_type defaults to SOC if missing
        assigned_user: rule.assigned_user || "unassigned"  // Handle empty assigned_user
      });
    } else if (technique) {
      // Only update if we have a technique and current rule doesn't have these values
      setCurrentRule(prev => ({
        ...prev,
        technique_id: technique.technique_id || prev.technique_id,
        tactic: technique.tactic || prev.tactic
      }));
    }
  }, [rule, technique]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare the rule data, converting "unassigned" back to empty string for database
      const ruleData = {
        ...currentRule,
        tags: currentRule.tags || [],
        assigned_user: currentRule.assigned_user === "unassigned" ? "" : currentRule.assigned_user
      };
      
      if (isPromotion) {
        // For promotion, just pass the form data to the promotion handler
        // Don't create the rule here - let the promotion API handle it
        onSave(ruleData);
      } else {
        // Normal rule creation/update flow
        let savedRule;
        if (rule && (rule._id || rule.id)) {
          // Update existing rule - use _id or id depending on what's available
          const ruleId = rule._id || rule.id;
          await DetectionRule.update(ruleId, ruleData);
          savedRule = { ...rule, ...ruleData };
        } else {
          // Create new rule (either no rule prop or rule without ID)
          savedRule = await DetectionRule.create(ruleData);
        }
        
        onSave(savedRule);
      }
    } catch (error) {
      console.error("Failed to save rule:", error);
      alert(`Failed to save rule: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !currentRule.tags.includes(newTag.trim())) {
      setCurrentRule({
        ...currentRule,
        tags: [...(currentRule.tags || []), newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setCurrentRule({
      ...currentRule,
      tags: (currentRule.tags || []).filter(tag => tag !== tagToRemove)
    });
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {rule ? "Edit Detection Rule" : isPromotion ? "Promote Future Rule" : "Create New Rule"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {technique ? `For ${technique.technique_id}: ${technique.name}` : "Define your detection logic"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Shield className="w-5 h-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rule ID *
                </label>
                <Input
                  placeholder="e.g., RULE-001"
                  value={currentRule.rule_id}
                  onChange={(e) => setCurrentRule({...currentRule, rule_id: e.target.value})}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rule Name *
                </label>
                <Input
                  placeholder="Descriptive name for the rule"
                  value={currentRule.name}
                  onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Technique ID *
                </label>
                <Input
                  placeholder="e.g., T1059"
                  value={currentRule.technique_id}
                  onChange={(e) => setCurrentRule({...currentRule, technique_id: e.target.value})}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Assigned User
                </label>
                <Select
                  value={currentRule.assigned_user}
                  onValueChange={(value) => setCurrentRule({...currentRule, assigned_user: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <User className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {TEAM_MEMBERS.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Platform *
                </label>
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
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Containers">Containers</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="Office Suite">Office Suite</SelectItem>
                    <SelectItem value="Identity Provider">Identity Provider</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="IaaS">IaaS</SelectItem>
                    <SelectItem value="Network Devices">Network Devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tactic *
                </label>
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

        {/* Advanced Configuration Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Settings className="w-5 h-5 text-blue-600" />
              Advanced Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <Select
                  value={currentRule.status}
                  onValueChange={(value) => setCurrentRule({...currentRule, status: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="Testing">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Testing
                      </div>
                    </SelectItem>
                    <SelectItem value="Inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Severity
                </label>
                <Select
                  value={currentRule.severity}
                  onValueChange={(value) => setCurrentRule({...currentRule, severity: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rule Type *
                </label>
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  False Positive Rate
                </label>
                <Select
                  value={currentRule.false_positive_rate}
                  onValueChange={(value) => setCurrentRule({...currentRule, false_positive_rate: value})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Query Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <FileText className="w-5 h-5 text-blue-600" />
              Description & Query
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Textarea
                placeholder="Describe what this rule detects and when it should trigger..."
                value={currentRule.description}
                onChange={(e) => setCurrentRule({...currentRule, description: e.target.value})}
                className="h-24 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4" />
                XQL Query *
              </label>
              <Textarea
                placeholder="Enter your XQL detection query here..."
                value={currentRule.xql_query}
                onChange={(e) => setCurrentRule({...currentRule, xql_query: e.target.value})}
                className="h-32 font-mono text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Code className="w-5 h-5 text-blue-600" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
              <Button 
                type="button" 
                onClick={addTag} 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {currentRule.tags && currentRule.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentRule.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : isPromotion ? "Promote Rule" : rule ? "Update Rule" : "Create Rule"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}