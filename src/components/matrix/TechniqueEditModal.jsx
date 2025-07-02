import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TechniqueEditor from "./TechniqueEditor";
import { MitreTechnique } from "@/api/entities";

export default function TechniqueEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  technique = null,
  tacticId = null 
}) {
  const handleSave = async (techniqueData) => {
    try {
      console.log('TechniqueEditModal - Saving technique:', techniqueData);
      
      if (technique) {
        // Update existing technique
        const techniqueId = technique._id || technique.id;
        await MitreTechnique.update(techniqueId, techniqueData);
      } else {
        // Create new technique
        const newTechniqueData = {
          ...techniqueData,
          tactic: techniqueData.tactic || tacticId || "Initial Access"
        };
        await MitreTechnique.create(newTechniqueData);
      }
      
      // Call the parent onSave to refresh data
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save technique:", error);
      alert(`Failed to save technique: ${error.message || 'Please try again.'}`);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <TechniqueEditor
          technique={technique}
          onSave={handleSave}
          onCancel={handleCancel}
          isNewTechnique={!technique}
        />
      </DialogContent>
    </Dialog>
  );
} 