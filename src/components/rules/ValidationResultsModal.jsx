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
import { CheckCircle, AlertTriangle, XCircle, Info, X, Shield, FileText } from "lucide-react";

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
      return <Badge className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">Error</Badge>;
    }
    if (rule.warnings?.length > 0) {
      return <Badge className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">Warning</Badge>;
    }
    return <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">Valid</Badge>;
  };

  const getPlatformBadgeColor = (platform) => {
    const colors = {
      'Windows': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'macOS': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      'Linux': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'Cloud': 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
      'Containers': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    };
    return colors[platform] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex flex-col h-full min-h-0">
          {/* Enhanced Header */}
          <DialogHeader className="flex-shrink-0 pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Import Validation Results
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{valid.length}</div>
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Valid Rules</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{warnings.length}</div>
                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">With Warnings</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{invalid.length}</div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Invalid Rules</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{valid.length + warnings.length + invalid.length}</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Rules</div>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <Tabs defaultValue="valid" className="h-full flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 flex-shrink-0">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium"
                >
                  All Rules
                </TabsTrigger>
                <TabsTrigger 
                  value="valid" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium"
                >
                  Valid ({valid.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="warnings" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium"
                >
                  Warnings ({warnings.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="errors" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium"
                >
                  Errors ({invalid.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                <TabsContent value="all" className="space-y-4 mt-0">
                  {[...valid, ...warnings, ...invalid].map((rule, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            {rule.rule_id || `Row ${index + 1}`}
                          </Badge>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{rule.name || 'Unnamed Rule'}</h4>
                          {getRuleStatusBadge(rule)}
                        </div>
                        <div className="flex items-center gap-2">
                          {rule.platform && (
                            <Badge className={`text-xs ${getPlatformBadgeColor(rule.platform)}`}>
                              {rule.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {rule.errors?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {rule.errors.map((error, i) => (
                            <Alert key={i} className="py-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <AlertDescription className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                      
                      {rule.warnings?.length > 0 && (
                        <div className="space-y-2">
                          {rule.warnings.map((warning, i) => (
                            <Alert key={i} className="py-3 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300 font-medium">{warning}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="valid" className="space-y-4 mt-0">
                  {valid.map((rule, index) => (
                    <div key={index} className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-700">
                          {rule.rule_id}
                        </Badge>
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">{rule.name}</h4>
                        <Badge className={`text-xs ${getPlatformBadgeColor(rule.platform)}`}>
                          {rule.platform}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="warnings" className="space-y-4 mt-0">
                  {warnings.map((rule, index) => (
                    <div key={index} className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-700">
                          {rule.rule_id}
                        </Badge>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">{rule.name}</h4>
                        <Badge className={`text-xs ${getPlatformBadgeColor(rule.platform)}`}>
                          {rule.platform}
                        </Badge>
                      </div>
                      {rule.warnings?.map((warning, i) => (
                        <div key={i} className="text-sm text-amber-800 dark:text-amber-300 ml-8 font-medium">{warning}</div>
                      ))}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="errors" className="space-y-4 mt-0">
                  {invalid.map((rule, index) => (
                    <div key={index} className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-slate-800 border-red-200 dark:border-red-700">
                          {rule.rule_id || `Row ${index + 1}`}
                        </Badge>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">{rule.name || 'Unnamed Rule'}</h4>
                        {rule.platform && (
                          <Badge className={`text-xs ${getPlatformBadgeColor(rule.platform)}`}>
                            {rule.platform}
                          </Badge>
                        )}
                      </div>
                      {rule.errors?.map((error, i) => (
                        <div key={i} className="text-sm text-red-800 dark:text-red-300 ml-8 font-medium">{error}</div>
                      ))}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="flex-shrink-0 pt-6 gap-3">
            {invalid.length > 0 && (
              <Button 
                variant="outline" 
                onClick={onFixAndRetry}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Fix Issues & Retry
              </Button>
            )}
            {valid.length > 0 && (
              <Button 
                onClick={() => onProceedWithValid(valid)}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-lg"
              >
                Import {valid.length} Valid Rules
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 