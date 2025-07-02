import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, X, Plus, Trash2, Target, Shield, Code, Settings } from "lucide-react";
import { motion } from "framer-motion";
import PlatformIcon from "@/components/PlatformIcon";

const AVAILABLE_PLATFORMS = [
  "Windows", "macOS", "Linux", "Cloud", "Containers", "AI", 
  "Office Suite", "Identity Provider", "SaaS", "IaaS", "Network Devices"
];

const MITRE_TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact"
];

export default function TechniqueEditor({ technique, onSave, onCancel, isNewTechnique = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");

  const [currentTechnique, setCurrentTechnique] = useState(
    technique || {
      technique_id: "",
      name: "",
      description: "",
      tactic: "",
      platforms: [],
      detection_data_sources: [],
      mitigation_recommendations: "",
      references: [],
      version: "1.0",
      created_date: new Date().toISOString().split('T')[0],
      last_modified: new Date().toISOString().split('T')[0]
    }
  );

  useEffect(() => {
    if (technique) {
      setCurrentTechnique({
        ...technique,
        platforms: technique.platforms || [],
        detection_data_sources: technique.detection_data_sources || [],
        references: technique.references || []
      });
    }
  }, [technique]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const techniqueData = {
        ...currentTechnique,
        last_modified: new Date().toISOString().split('T')[0]
      };
      
      // Here you would typically call an API to save the technique
      // For now, we'll just call the onSave callback
      onSave(techniqueData);
    } catch (error) {
      console.error("Failed to save technique:", error);
      alert(`Failed to save technique: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPlatform = () => {
    if (newPlatform && !currentTechnique.platforms.includes(newPlatform)) {
      setCurrentTechnique({
        ...currentTechnique,
        platforms: [...currentTechnique.platforms, newPlatform]
      });
      setNewPlatform("");
    }
  };

  const removePlatform = (platformToRemove) => {
    setCurrentTechnique({
      ...currentTechnique,
      platforms: currentTechnique.platforms.filter(platform => platform !== platformToRemove)
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
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isNewTechnique ? "Create New Technique" : "Edit Technique"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {isNewTechnique ? "Define a new MITRE ATT&CK technique" : `Editing ${currentTechnique.technique_id}`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Technique ID *
                </label>
                <Input
                  placeholder="e.g., T1059.001"
                  value={currentTechnique.technique_id}
                  onChange={(e) => setCurrentTechnique({...currentTechnique, technique_id: e.target.value})}
                  required
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Technique Name *
                </label>
                <Input
                  placeholder="Descriptive name for the technique"
                  value={currentTechnique.name}
                  onChange={(e) => setCurrentTechnique({...currentTechnique, name: e.target.value})}
                  required
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Tactic *
                </label>
                <Select
                  value={currentTechnique.tactic}
                  onValueChange={(value) => setCurrentTechnique({...currentTechnique, tactic: value})}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400">
                    <SelectValue placeholder="Select tactic" />
                  </SelectTrigger>
                  <SelectContent>
                    {MITRE_TACTICS.map((tactic) => (
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Version
                </label>
                <Input
                  placeholder="e.g., 1.0"
                  value={currentTechnique.version}
                  onChange={(e) => setCurrentTechnique({...currentTechnique, version: e.target.value})}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Created Date
                </label>
                <Input
                  type="date"
                  value={currentTechnique.created_date}
                  onChange={(e) => setCurrentTechnique({...currentTechnique, created_date: e.target.value})}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Last Modified
                </label>
                <Input
                  type="date"
                  value={currentTechnique.last_modified}
                  onChange={(e) => setCurrentTechnique({...currentTechnique, last_modified: e.target.value})}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Description
          </h3>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Technique Description *
            </label>
            <Textarea
              placeholder="Detailed description of the technique, how it works, and its purpose..."
              value={currentTechnique.description}
              onChange={(e) => setCurrentTechnique({...currentTechnique, description: e.target.value})}
              className="h-32 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
              required
            />
          </div>
        </div>

        {/* Platforms Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Platforms
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select platform to add" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PLATFORMS.filter(platform => !currentTechnique.platforms.includes(platform)).map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={platform} className="w-4 h-4" />
                        {platform}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addPlatform} variant="outline" className="border-slate-300 dark:border-slate-600">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {currentTechnique.platforms && currentTechnique.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentTechnique.platforms.map((platform, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-3 py-2">
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                    {platform}
                    <button
                      type="button"
                      onClick={() => removePlatform(platform)}
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

        {/* Mitigation Recommendations Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Mitigation Recommendations
            </label>
            <Textarea
              placeholder="Recommendations for mitigating this technique..."
              value={currentTechnique.mitigation_recommendations}
              onChange={(e) => setCurrentTechnique({...currentTechnique, mitigation_recommendations: e.target.value})}
              className="h-24 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : isNewTechnique ? "Create Technique" : "Update Technique"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
} 