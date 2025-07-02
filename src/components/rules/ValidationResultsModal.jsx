import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export default function ValidationResultsModal({ 
  isOpen, 
  onClose, 
  validationResults, 
  onProceedWithValid, 
  onFixAndRetry 
}) {
  if (!validationResults) return null;

  const { valid, invalid, warnings, summary } = validationResults;

  const getStatusIcon = (type) => {
    switch (type) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRuleStatusBadge = (rule) => {
    if (rule.errors?.length > 0) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    if (rule.warnings?.length > 0) {
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Warning</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">Valid</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Import Validation Results
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{valid.length}</div>
              <div className="text-sm text-emerald-600">Valid Rules</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{warnings.length}</div>
              <div className="text-sm text-amber-600">With Warnings</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{invalid.length}</div>
              <div className="text-sm text-red-600">Invalid Rules</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{valid.length + warnings.length + invalid.length}</div>
              <div className="text-sm text-blue-600">Total Rules</div>
            </div>
          </div>

          {/* Detailed Results */}
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Rules</TabsTrigger>
              <TabsTrigger value="valid">Valid ({valid.length})</TabsTrigger>
              <TabsTrigger value="warnings">Warnings ({warnings.length})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({invalid.length})</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="all" className="space-y-3 mt-4">
                {[...valid, ...warnings, ...invalid].map((rule, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {rule.rule_id || `Row ${index + 1}`}
                        </Badge>
                        <span className="font-medium">{rule.name || 'Unnamed Rule'}</span>
                        {getRuleStatusBadge(rule)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        {rule.platform && (
                          <Badge variant="secondary" className="text-xs">{rule.platform}</Badge>
                        )}
                      </div>
                    </div>
                    
                    {rule.errors?.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {rule.errors.map((error, i) => (
                          <Alert key={i} variant="destructive" className="py-2">
                            <XCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                    
                    {rule.warnings?.length > 0 && (
                      <div className="space-y-1">
                        {rule.warnings.map((warning, i) => (
                          <Alert key={i} className="py-2 border-amber-200 bg-amber-50">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <AlertDescription className="text-xs text-amber-700">{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="valid" className="space-y-3 mt-4">
                {valid.map((rule, index) => (
                  <div key={index} className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <Badge variant="outline" className="font-mono text-xs">
                        {rule.rule_id}
                      </Badge>
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="secondary" className="text-xs">{rule.platform}</Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="warnings" className="space-y-3 mt-4">
                {warnings.map((rule, index) => (
                  <div key={index} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <Badge variant="outline" className="font-mono text-xs">
                        {rule.rule_id}
                      </Badge>
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="secondary" className="text-xs">{rule.platform}</Badge>
                    </div>
                    {rule.warnings?.map((warning, i) => (
                      <div key={i} className="text-xs text-amber-700 ml-6">{warning}</div>
                    ))}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="errors" className="space-y-3 mt-4">
                {invalid.map((rule, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <Badge variant="outline" className="font-mono text-xs">
                        {rule.rule_id || `Row ${index + 1}`}
                      </Badge>
                      <span className="font-medium">{rule.name || 'Unnamed Rule'}</span>
                      {rule.platform && (
                        <Badge variant="secondary" className="text-xs">{rule.platform}</Badge>
                      )}
                    </div>
                    {rule.errors?.map((error, i) => (
                      <div key={i} className="text-xs text-red-700 ml-6">{error}</div>
                    ))}
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0">
          {invalid.length > 0 && (
            <Button variant="outline" onClick={onFixAndRetry}>
              Fix Issues & Retry
            </Button>
          )}
          {valid.length > 0 && (
            <Button 
              onClick={() => onProceedWithValid(valid)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Import {valid.length} Valid Rules
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 