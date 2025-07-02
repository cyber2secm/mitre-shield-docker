import React, { useState, useEffect } from "react";
import { DetectionRule, FutureRule, MitreTechnique } from "@/api/entities";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Plus, Target, Trash2, Shield, Settings, FileText } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmationDialog from "../shared/ConfirmationDialog";

const TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact"
];

// Cloud-specific tactics (no Command and Control)
const CLOUD_TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Exfiltration", "Impact"
];

// Container-specific tactics (no Collection and Command and Control)
const CONTAINER_TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Exfiltration", "Impact"
];

const ALL_PLATFORMS = ["Windows", "macOS", "Linux", "AWS", "Azure", "GCP", "Oracle", "Containers", "AI"];

export default function TechniqueForm({ isOpen, onClose, onSave, technique = null, tacticId = null }) {
  const getInitialData = () => {
    if (technique) {
      return {
        technique_id: technique.technique_id || "",
        name: technique.name || "",
        description: technique.description || "",
        tactic: technique.tactic || tacticId || "Initial Access",
        platforms: technique.platforms || [],
        data_sources: technique.data_sources || []
      };
    } else {
      // When creating new technique, determine default platforms based on current context
      const urlParams = new URLSearchParams(window.location.search);
      const currentPlatform = urlParams.get('platform');
      
      let defaultPlatforms = [];
      if (currentPlatform === "Cloud") {
        // For Cloud platform, automatically select ALL cloud providers
        defaultPlatforms = ["AWS", "Azure", "GCP", "Oracle"];
      } else if (currentPlatform && currentPlatform !== "all") {
        defaultPlatforms = [currentPlatform];
      } else {
        defaultPlatforms = ["Windows"]; // Default fallback
      }

      return {
        technique_id: "",
        name: "",
        description: "",
        tactic: tacticId || "Initial Access",
        platforms: defaultPlatforms,
        data_sources: []
      };
    }
  };
  
  const [formData, setFormData] = useState(getInitialData());
  const [newDataSource, setNewDataSource] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialData());
    }
  }, [technique, tacticId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('TechniqueForm - Submitting technique data:', formData);
      
      const techniqueData = {
        ...formData,
        subtechniques: []
      };

      if (technique) {
              console.log('TechniqueForm - Updating existing technique:', technique._id || technique.id);
      const techniqueId = technique._id || technique.id;
      await MitreTechnique.update(techniqueId, techniqueData);
      } else {
        console.log('TechniqueForm - Creating new technique');
        const result = await MitreTechnique.create(techniqueData);
        console.log('TechniqueForm - Create result:', result);
      }
      
      console.log('TechniqueForm - Success! Calling onSave...');
      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error("TechniqueForm - Failed to save technique:", error);
      alert(`Failed to save technique: ${error.message || 'Please try again.'}`);
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!technique) return;

    setIsLoading(true);
    try {
        const techniqueMitreId = technique.technique_id;

        // Cascade Delete
        const detectionRules = await DetectionRule.filter({ technique_id: techniqueMitreId });
        await Promise.all(detectionRules.map(r => DetectionRule.delete(r._id || r.id)));

        const futureRules = await FutureRule.filter({ technique_id: techniqueMitreId });
        await Promise.all(futureRules.map(r => FutureRule.delete(r._id || r.id)));

        // Delete technique
        const techniqueId = technique._id || technique.id;
        await MitreTechnique.delete(techniqueId);

        onSave(); // Refreshes data
        onClose(); // Closes form
    } catch (error) {
        console.error("Failed to delete technique from form:", error);
        alert(`Failed to delete technique: ${error.message || 'Please try again.'}`);
    } finally {
        setIsLoading(false);
        setIsDeleteDialogOpen(false);
    }
  };

  const resetForm = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPlatform = urlParams.get('platform');
    
    let defaultPlatforms = [];
    if (currentPlatform === "Cloud") {
      // For Cloud platform, automatically select ALL cloud providers
      defaultPlatforms = ["AWS", "Azure", "GCP", "Oracle"];
    } else if (currentPlatform && currentPlatform !== "all") {
      defaultPlatforms = [currentPlatform];
    } else {
      defaultPlatforms = ["Windows"];
    }

    setFormData({
      technique_id: "",
      name: "",
      description: "",
      tactic: tacticId || "Initial Access",
      platforms: defaultPlatforms,
      data_sources: []
    });
    setNewDataSource("");
  };

  const handlePlatformToggle = (platform) => {
    const updatedPlatforms = formData.platforms.includes(platform)
      ? formData.platforms.filter(p => p !== platform)
      : [...formData.platforms, platform];
    
    setFormData(prev => ({ ...prev, platforms: updatedPlatforms }));
  };

  const addDataSource = () => {
    if (newDataSource.trim() && !formData.data_sources.includes(newDataSource.trim())) {
      setFormData(prev => ({
        ...prev,
        data_sources: [...prev.data_sources, newDataSource.trim()]
      }));
      setNewDataSource("");
    }
  };

  const removeDataSource = (sourceToRemove) => {
    setFormData(prev => ({
      ...prev,
      data_sources: prev.data_sources.filter(source => source !== sourceToRemove)
    }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get available tactics based on current platform context
  const getAvailableTactics = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPlatform = urlParams.get('platform');
    
    if (currentPlatform === "Cloud") {
      return CLOUD_TACTICS;
    } else if (currentPlatform === "Containers") {
      return CONTAINER_TACTICS;
    }
    
    return TACTICS;
  };

  // Get current platform context for UI display
  const getCurrentPlatformContext = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('platform');
  };

  const currentPlatformContext = getCurrentPlatformContext();

  if (!isOpen) return null;

  return (
    <>
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${technique?.name}"?`}
        description="This will permanently delete the technique and all associated rules. This action cannot be undone."
        confirmText={isLoading ? "Deleting..." : "Delete"}
        isConfirmDisabled={isLoading}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {technique ? "Edit Technique" : "Create New Technique"}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Configure MITRE ATT&CK technique details and platforms
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
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Technique ID *</Label>
                      <Input
                        placeholder="e.g., T1059"
                        value={formData.technique_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, technique_id: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Technique Name *</Label>
                      <Input
                        placeholder="Enter technique name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tactic *</Label>
                      <Select
                        value={formData.tactic}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tactic: value }))}
                      >
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                          <SelectValue placeholder="Select tactic" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTactics().map((tactic) => (
                            <SelectItem key={tactic} value={tactic}>
                              {tactic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Configuration Section */}
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Platform Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentPlatformContext === "Cloud" && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Cloud Platform:</strong> This technique will automatically apply to all cloud providers (AWS, Azure, GCP, Oracle).
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platforms *</Label>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                      {ALL_PLATFORMS.map((platform) => (
                        <div key={platform} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform}
                            checked={formData.platforms.includes(platform)}
                            onCheckedChange={() => handlePlatformToggle(platform)}
                            disabled={currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)}
                          />
                          <Label htmlFor={platform} className={`text-sm font-normal cursor-pointer ${
                            currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-slate-700 dark:text-slate-300"
                          }`}>
                            {platform}
                            {currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform) && 
                              <span className="ml-1 text-xs">(Auto)</span>
                            }
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {formData.platforms.length === 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">Please select at least one platform</p>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selected Platforms</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary" className={`${
                            currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                          }`}>
                            {platform}
                            {!(currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)) && (
                              <button
                                type="button"
                                onClick={() => handlePlatformToggle(platform)}
                                className="ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description & Data Sources Section */}
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Description & Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                    <Textarea
                      placeholder="Describe the technique and what it does..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="h-24 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Sources</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add data source..."
                        value={newDataSource}
                        onChange={(e) => setNewDataSource(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDataSource())}
                        className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      />
                      <Button 
                        type="button" 
                        onClick={addDataSource} 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.data_sources.map((source) => (
                        <Badge key={source} variant="outline" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                          {source}
                          <button
                            type="button"
                            onClick={() => removeDataSource(source)}
                            className="ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {technique && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isLoading}
                      className="px-6 py-2.5"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Technique
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading || formData.platforms.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : (technique ? 'Update Technique' : 'Create Technique')}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
