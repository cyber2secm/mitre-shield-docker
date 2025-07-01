import React, { useState, useEffect } from "react";
import { DetectionRule } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus, Trash2, Play, TestTube, User } from "lucide-react";
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
      false_positive_rate: "Medium",
      assigned_user: ""
    }
  );

  useEffect(() => {
    if (rule) {
      setCurrentRule({
        ...rule,
        tags: rule.tags || []
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
      // Prepare the rule data
      const ruleData = {
        ...currentRule,
        tags: currentRule.tags || []
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
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Rule ID *
              </label>
              <Input
                placeholder="e.g., RULE-001"
                value={currentRule.rule_id}
                onChange={(e) => setCurrentRule({...currentRule, rule_id: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Rule Name *
              </label>
              <Input
                placeholder="Descriptive name for the rule"
                value={currentRule.name}
                onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Technique ID *
              </label>
              <Input
                placeholder="e.g., T1059"
                value={currentRule.technique_id}
                onChange={(e) => setCurrentRule({...currentRule, technique_id: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Assigned User
              </label>
              <Select
                value={currentRule.assigned_user}
                onValueChange={(value) => setCurrentRule({...currentRule, assigned_user: value})}
              >
                <SelectTrigger>
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {TEAM_MEMBERS.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Platform *
              </label>
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
                  <SelectItem value="AI">AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Tactic *
              </label>
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

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Status
              </label>
              <Select
                value={currentRule.status}
                onValueChange={(value) => setCurrentRule({...currentRule, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="Testing">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-amber-600" />
                      Testing
                    </div>
                  </SelectItem>
                  <SelectItem value="Inactive">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-slate-600" />
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Severity
              </label>
              <Select
                value={currentRule.severity}
                onValueChange={(value) => setCurrentRule({...currentRule, severity: value})}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                False Positive Rate
              </label>
              <Select
                value={currentRule.false_positive_rate}
                onValueChange={(value) => setCurrentRule({...currentRule, false_positive_rate: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Description
          </label>
          <Textarea
            placeholder="Describe what this rule detects and when it should trigger..."
            value={currentRule.description}
            onChange={(e) => setCurrentRule({...currentRule, description: e.target.value})}
            className="h-24"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            XQL Query *
          </label>
          <Textarea
            placeholder="Enter your XQL detection query here..."
            value={currentRule.xql_query}
            onChange={(e) => setCurrentRule({...currentRule, xql_query: e.target.value})}
            className="h-32 font-mono text-sm"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Tags
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {currentRule.tags && currentRule.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentRule.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : isPromotion ? "Promote Rule" : (rule && (rule._id || rule.id)) ? "Update Rule" : "Create Rule"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}