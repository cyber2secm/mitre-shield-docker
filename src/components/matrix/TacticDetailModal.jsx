import React, { useState, useCallback } from "react";
import { DetectionRule, FutureRule, MitreTechnique } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, ArrowLeft, Filter, Trash2 } from "lucide-react";

import TechniqueCard from "./TechniqueCard";
import TechniqueModal from "./TechniqueModal";
import TechniqueForm from "./TechniqueForm";

export default function TacticDetailModal({
  tactic,
  techniques,
  rules,
  onClose,
  onRuleUpdate,
  currentPlatform,
  currentCloudProvider,
  currentCloudService
}) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [startRuleEditor, setStartRuleEditor] = useState(false);
  const [showTechniqueForm, setShowTechniqueForm] = useState(false);
  const [filterByRules, setFilterByRules] = useState(false);
  const [editingTechnique, setEditingTechnique] = useState(null);
  const [deletingTechniqueIds, setDeletingTechniqueIds] = useState(new Set());

  const handleNewRuleForTechnique = useCallback((technique) => {
    console.log('TacticDetailModal - handleNewRuleForTechnique called:', technique.name);
    setSelectedTechnique(technique);
    setStartRuleEditor(true);
  }, []);

  const handleEditTechnique = useCallback((technique) => {
    console.log('TacticDetailModal - handleEditTechnique called:', technique.name);
    setEditingTechnique(technique);
    setShowTechniqueForm(true);
  }, []);

  const handleDeleteTechnique = useCallback(async (technique) => {
    console.log('TacticDetailModal - handleDeleteTechnique called:', technique.name);
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${technique.name}"?\n\nThis will permanently delete the technique and all associated rules. This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

          setDeletingTechniqueIds(prev => new Set(prev).add(technique._id || technique.id));

    try {
      const allDetectionRules = await DetectionRule.list();
      const relatedDetectionRules = allDetectionRules.filter(rule => rule.technique_id === technique.technique_id);
      
      const allFutureRules = await FutureRule.list();
      const relatedFutureRules = allFutureRules.filter(rule => rule.technique_id === technique.technique_id);
      
      console.log('Deleting related rules:', { detectionRules: relatedDetectionRules.length, futureRules: relatedFutureRules.length });
      
      for (const rule of relatedDetectionRules) {
        try { 
          const ruleId = rule._id || rule.id;
          await DetectionRule.delete(ruleId); 
        } 
        catch (err) { if (!err.message?.includes('404')) console.warn(`Could not delete detection rule ${rule._id || rule.id}:`, err); }
      }
      
      for (const rule of relatedFutureRules) {
        try { 
          const ruleId = rule._id || rule.id;
          await FutureRule.delete(ruleId); 
        } 
        catch (err) { if (!err.message?.includes('404')) console.warn(`Could not delete future rule ${rule._id || rule.id}:`, err); }
      }
      
      const techniqueId = technique._id || technique.id;
      console.log('Deleting technique:', techniqueId);
      await MitreTechnique.delete(techniqueId);
      console.log('Technique deleted successfully');
      
      await onRuleUpdate();
      
    } catch (error) {
      console.error('Delete operation failed:', error);
      if (!error.message?.includes('404')) {
        alert(`Failed to delete technique "${technique.name}": ${error.message || 'Unknown error'}`);
      }
      await onRuleUpdate();
    } finally {
      setDeletingTechniqueIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(technique._id || technique.id);
        return newSet;
      });
    }
  }, [onRuleUpdate]);

  const handleCloseTechniqueModal = () => {
    setSelectedTechnique(null);
    setStartRuleEditor(false);
  };

  const handleTechniqueSaved = async () => {
    setShowTechniqueForm(false);
    setEditingTechnique(null);
    await onRuleUpdate();
  };

  const getRuleCountForTechnique = (techniqueId) => {
    let filteredRules = rules.filter(rule =>
      rule.technique_id === techniqueId &&
      rule.tactic === tactic
    );

    if (currentPlatform === "Cloud") {
      filteredRules = filteredRules.filter(r => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(r.platform));

      if (currentCloudProvider && currentCloudProvider !== "all") {
        filteredRules = filteredRules.filter(r => r.platform === currentCloudProvider);
      }

      // Apply cloud service filter if specified
      if (currentCloudService && currentCloudService !== "all") {
        filteredRules = filteredRules.filter(r => {
          switch (currentCloudService) {
            case 'Office Suite':
              // For Office Suite, check if rule has Office Suite platform or contains office-related keywords
              return r.platform === 'Office Suite' || 
                     r.name?.toLowerCase().includes('office') || 
                     r.name?.toLowerCase().includes('365') || 
                     r.name?.toLowerCase().includes('sharepoint');
            case 'Identity Provider':
              const ruleName = r.name?.toLowerCase() || '';
              return ruleName.includes('identity') || ruleName.includes('authentication') || ruleName.includes('sso');
            case 'SaaS':
              const saasRuleName = r.name?.toLowerCase() || '';
              return saasRuleName.includes('saas') || saasRuleName.includes('application');
            case 'IaaS':
              const iaasRuleName = r.name?.toLowerCase() || '';
              return iaasRuleName.includes('iaas') || iaasRuleName.includes('infrastructure') || iaasRuleName.includes('compute');
            default:
              return true;
          }
        });
      }
    } else if (currentPlatform !== "all") {
      filteredRules = filteredRules.filter(r => r.platform === currentPlatform);
    }

    return filteredRules.length;
  };

  const getTechniqueRules = (techniqueId) => {
    let filteredRules = rules.filter(rule =>
      rule.technique_id === techniqueId &&
      rule.tactic === tactic
    );

    if (currentPlatform === "Cloud") {
      filteredRules = filteredRules.filter(r => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(r.platform));

      if (currentCloudProvider && currentCloudProvider !== "all") {
        filteredRules = filteredRules.filter(r => r.platform === currentCloudProvider);
      }

      // Apply cloud service filter if specified
      if (currentCloudService && currentCloudService !== "all") {
        filteredRules = filteredRules.filter(r => {
          switch (currentCloudService) {
            case 'Office Suite':
              // For Office Suite, check if rule has Office Suite platform or contains office-related keywords
              return r.platform === 'Office Suite' || 
                     r.name?.toLowerCase().includes('office') || 
                     r.name?.toLowerCase().includes('365') || 
                     r.name?.toLowerCase().includes('sharepoint');
            case 'Identity Provider':
              const ruleName = r.name?.toLowerCase() || '';
              return ruleName.includes('identity') || ruleName.includes('authentication') || ruleName.includes('sso');
            case 'SaaS':
              const saasRuleName = r.name?.toLowerCase() || '';
              return saasRuleName.includes('saas') || saasRuleName.includes('application');
            case 'IaaS':
              const iaasRuleName = r.name?.toLowerCase() || '';
              return iaasRuleName.includes('iaas') || iaasRuleName.includes('infrastructure') || iaasRuleName.includes('compute');
            default:
              return true;
          }
        });
      }
    } else if (currentPlatform !== "all") {
      filteredRules = filteredRules.filter(r => r.platform === currentPlatform);
    }

    return filteredRules;
  };

  const getTacticRulesCount = () => {
    let tacticTechniques = techniques.filter(t => t.tactic === tactic);

    if (currentPlatform === "Cloud") {
      tacticTechniques = tacticTechniques.filter(t =>
        t.platforms?.some(p => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(p))
      );
    } else if (currentPlatform !== "all") {
      tacticTechniques = tacticTechniques.filter(t =>
        t.platforms?.includes(currentPlatform)
      );
    }

    const techniqueIds = tacticTechniques.map(t => t.technique_id);

    let filteredRules = rules.filter(rule =>
      rule.tactic === tactic &&
      techniqueIds.includes(rule.technique_id)
    );

    if (currentPlatform === "Cloud") {
      filteredRules = filteredRules.filter(r => ['AWS', 'Azure', 'GCP', 'Oracle'].includes(r.platform));

      if (currentCloudProvider && currentCloudProvider !== "all") {
        filteredRules = filteredRules.filter(r => r.platform === currentCloudProvider);
      }

      // Apply cloud service filter if specified
      if (currentCloudService && currentCloudService !== "all") {
        filteredRules = filteredRules.filter(r => {
          switch (currentCloudService) {
            case 'Office Suite':
              // For Office Suite, check if rule has Office Suite platform or contains office-related keywords
              return r.platform === 'Office Suite' || 
                     r.name?.toLowerCase().includes('office') || 
                     r.name?.toLowerCase().includes('365') || 
                     r.name?.toLowerCase().includes('sharepoint');
            case 'Identity Provider':
              const ruleName = r.name?.toLowerCase() || '';
              return ruleName.includes('identity') || ruleName.includes('authentication') || ruleName.includes('sso');
            case 'SaaS':
              const saasRuleName = r.name?.toLowerCase() || '';
              return saasRuleName.includes('saas') || saasRuleName.includes('application');
            case 'IaaS':
              const iaasRuleName = r.name?.toLowerCase() || '';
              return iaasRuleName.includes('iaas') || iaasRuleName.includes('infrastructure') || iaasRuleName.includes('compute');
            default:
              return true;
          }
        });
      }
    } else if (currentPlatform !== "all") {
      filteredRules = filteredRules.filter(r => r.platform === currentPlatform);
    }

    return filteredRules.length;
  };

  const getTacticColor = (tactic) => {
    const colors = {
      "Initial Access": "from-red-600 to-red-700",
      "Execution": "from-orange-600 to-orange-700",
      "Persistence": "from-amber-600 to-amber-700",
      "Privilege Escalation": "from-yellow-600 to-yellow-700",
      "Defense Evasion": "from-lime-600 to-lime-700",
      "Credential Access": "from-emerald-600 to-emerald-700",
      "Discovery": "from-teal-600 to-teal-700",
      "Lateral Movement": "from-cyan-600 to-cyan-700",
      "Collection": "from-sky-600 to-sky-700",
      "Command and Control": "from-blue-600 to-blue-700",
      "Exfiltration": "from-indigo-600 to-indigo-700",
      "Impact": "from-purple-600 to-purple-700"
    };
    return colors[tactic] || "from-slate-600 to-slate-700";
  };
  
  const filteredTechniques = filterByRules
    ? techniques.filter(t => getRuleCountForTechnique(t.technique_id) > 0)
    : techniques;

  if (!tactic) return null;

  return (
    <>
      <Dialog open={!!tactic} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-4 px-6 pt-6 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 bg-gradient-to-br ${getTacticColor(tactic)} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                    {tactic}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {techniques.length} technique{techniques.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge
                      variant={filterByRules ? "default" : "outline"}
                      onClick={() => setFilterByRules(!filterByRules)}
                      className={`cursor-pointer transition-all ${
                        filterByRules
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={filterByRules ? "Click to show all techniques" : "Click to show only techniques with rules"}
                    >
                      {filterByRules && <Filter className="w-3 h-3 mr-1.5" />}
                      {getTacticRulesCount()} detection rules
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 pt-2 pr-8">
                <Button
                  onClick={() => setShowTechniqueForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg font-semibold"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Technique
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="bg-white/80 backdrop-blur-sm text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tactics
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTechniques.map((technique) => {
                console.log('Rendering technique card:', technique.name, 'with onDelete:', !!handleDeleteTechnique);
                return (
                  <TechniqueCard
                    key={technique.technique_id}
                    technique={technique}
                    ruleCount={getRuleCountForTechnique(technique.technique_id)}
                    onClick={() => setSelectedTechnique(technique)}
                    selectedPlatform={currentPlatform}
                    onNewRule={handleNewRuleForTechnique}
                    onEdit={handleEditTechnique}
                    onDelete={handleDeleteTechnique}
                    isDeleting={deletingTechniqueIds.has(technique._id || technique.id)}
                  />
                );
              })}
            </div>

            {filteredTechniques.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Techniques Found</h3>
                {filterByRules ? (
                   <div className="space-y-2">
                    <p className="text-sm">No techniques with rules were found for this tactic.</p>
                    <Button variant="link" onClick={() => setFilterByRules(false)} className="h-auto p-0 text-blue-600">
                      Clear filter to see all techniques
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-4">
                      No techniques found in this tactic for the selected platform.
                    </p>
                    <Button
                      onClick={() => setShowTechniqueForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Technique
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TechniqueModal
        technique={selectedTechnique}
        rules={selectedTechnique ? getTechniqueRules(selectedTechnique.technique_id) : []}
        onClose={handleCloseTechniqueModal}
        onRuleUpdate={onRuleUpdate}
        startWithRuleEditor={startRuleEditor}
      />

      <TechniqueForm
        isOpen={showTechniqueForm}
        onClose={() => {
          setShowTechniqueForm(false);
          setEditingTechnique(null);
        }}
        onSave={handleTechniqueSaved}
        technique={editingTechnique}
        tacticId={tactic}
      />
    </>
  );
}