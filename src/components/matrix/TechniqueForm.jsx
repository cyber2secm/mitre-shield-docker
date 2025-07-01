
import React, { useState, useEffect } from "react";
import { DetectionRule, FutureRule, MitreTechnique } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, X, Plus, Target, Trash2 } from "lucide-react";
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {technique ? 'Edit Technique' : 'Add New Technique'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="technique_id">Technique ID *</Label>
                  <Input
                    id="technique_id"
                    placeholder="e.g., T1059"
                    value={formData.technique_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, technique_id: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Technique Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter technique name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tactic">Tactic *</Label>
                  <Select
                    value={formData.tactic}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tactic: value }))}
                  >
                    <SelectTrigger>
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

              <div className="space-y-4">
                <div>
                  <Label>Platforms *</Label>
                  {currentPlatformContext === "Cloud" && (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Cloud Platform:</strong> This technique will automatically apply to all cloud providers (AWS, Azure, GCP, Oracle).
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
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
                            ? "text-blue-600 font-medium"
                            : ""
                        }`}>
                          {platform}
                          {currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform) && 
                            <span className="ml-1 text-xs">(Auto-selected)</span>
                          }
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.platforms.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one platform</p>
                  )}
                </div>

                <div>
                  <Label>Selected Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className={
                        currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }>
                        {platform}
                        {!(currentPlatformContext === "Cloud" && ["AWS", "Azure", "GCP", "Oracle"].includes(platform)) && (
                          <button
                            type="button"
                            onClick={() => handlePlatformToggle(platform)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the technique and what it does..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-24"
              />
            </div>

            <div>
              <Label>Data Sources</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add data source..."
                  value={newDataSource}
                  onChange={(e) => setNewDataSource(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDataSource())}
                />
                <Button type="button" onClick={addDataSource} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.data_sources.map((source) => (
                  <Badge key={source} variant="outline" className="bg-slate-50">
                    {source}
                    <button
                      type="button"
                      onClick={() => removeDataSource(source)}
                      className="ml-2 text-slate-600 hover:text-slate-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <div>
                {technique && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Technique
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || formData.platforms.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : (technique ? 'Update Technique' : 'Create Technique')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
