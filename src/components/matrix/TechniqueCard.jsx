
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformIcon from "@/components/PlatformIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TechniqueCard({ 
  technique, 
  ruleCount, 
  onClick, 
  selectedPlatform,
  onDelete,
  onNewRule,
  onEdit,
  isDeleting
}) {
  const getRelevantPlatforms = () => {
    if (selectedPlatform === "all") {
      return technique.platforms || [];
    }
    return technique.platforms?.filter(p => p === selectedPlatform) || [];
  };

  const handleDelete = (e) => {
    console.log('TechniqueCard - handleDelete called for:', technique.name);
    console.log('TechniqueCard - onDelete function available:', !!onDelete);
    console.log('TechniqueCard - isDeleting:', isDeleting);
    
    e.stopPropagation();
    e.preventDefault();
    
    // Add browser confirmation before proceeding with deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete the technique "${technique.name}" (ID: ${technique.technique_id})? This action cannot be undone.`
    );

    if (confirmed) {
      console.log('TechniqueCard - User confirmed deletion for:', technique.name);
      if (onDelete && !isDeleting) {
        console.log('TechniqueCard - Calling onDelete with technique object');
        onDelete(technique);
      } else {
        console.log('TechniqueCard - onDelete not available or isDeleting (pre-call check):', { onDelete: !!onDelete, isDeleting });
      }
    } else {
      console.log('TechniqueCard - Deletion cancelled by user for:', technique.name);
    }
  };

  const handleEdit = (e) => {
    console.log('TechniqueCard - handleEdit called for:', technique.name);
    e.stopPropagation();
    e.preventDefault();
    if (onEdit) {
      onEdit(technique);
    }
  };

  const handleNewRule = (e) => {
    console.log('TechniqueCard - handleNewRule called for:', technique.name);
    e.stopPropagation();
    e.preventDefault();
    if (onNewRule) {
      onNewRule(technique);
    }
  };

  return (
    <TooltipProvider>
      <Card 
        className="relative cursor-pointer hover:shadow-lg transition-all duration-300 border-slate-200/60 bg-white/90 backdrop-blur-sm hover:bg-white group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header with Technique ID and Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border-slate-300 font-mono">
                  {technique.technique_id}
                </Badge>
                {ruleCount > 0 && (
                  <Badge className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-300">
                    {ruleCount} rule{ruleCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {/* Technique Name */}
              <h4 className="font-semibold text-sm text-slate-900 leading-tight group-hover:text-blue-700 transition-colors mb-3">
                {technique.name}
              </h4>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 hover:bg-slate-50 hover:text-slate-600"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit technique</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onNewRule && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600"
                      onClick={handleNewRule}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add new detection rule</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className={`w-8 h-8 text-slate-400 transition-colors ${
                        isDeleting 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-red-50 hover:text-red-600'
                      }`}
                      onClick={handleDelete}
                      disabled={isDeleting}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isDeleting ? 'Deleting...' : 'Delete technique'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Platform Tags */}
          <div className="flex flex-wrap gap-1">
            {getRelevantPlatforms().slice(0, 3).map((platform) => (
              <Badge 
                key={platform}
                variant="outline" 
                className="text-xs px-1.5 py-0.5 bg-slate-50 text-slate-600 border-slate-300 flex items-center gap-1"
              >
                <PlatformIcon platform={platform} className="w-3 h-3" />
                {platform}
              </Badge>
            ))}
            {getRelevantPlatforms().length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-slate-50 text-slate-600 border-slate-300">
                +{getRelevantPlatforms().length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
