import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, Download, FileSpreadsheet, HelpCircle, Eye, Shield, X } from "lucide-react";
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";
import { validateRules } from "@/utils/ruleValidation";
import ValidationResultsModal from "./ValidationResultsModal";
import { motion } from "framer-motion";

// Sample template data
const SAMPLE_RULES = [
  {
    rule_id: "RULE-001",
    name: "Suspicious PowerShell Execution",
    tactic: "Execution",
    technique_id: "T1059.001",
    xql_query: "dataset = xdr_data | filter action_process_image_name contains \"powershell.exe\" and action_process_command_line contains \"-ExecutionPolicy Bypass\"",
    severity: "High",
    rule_type: "SOC",
    description: "Detects PowerShell execution with bypassed execution policy which may indicate malicious activity",
    user: "admin",
    platform: "Windows"
  },
  {
    rule_id: "RULE-002", 
    name: "Credential Dumping via Mimikatz",
    tactic: "Credential Access",
    technique_id: "T1003.001",
    xql_query: "dataset = xdr_data | filter action_process_image_name contains \"mimikatz\" or action_process_command_line contains \"sekurlsa::logonpasswords\"",
    severity: "Critical",
    rule_type: "Product",
    description: "Detects potential credential dumping using Mimikatz or similar tools",
    user: "security-team",
    platform: "Windows"
  }
];

const FIELD_DESCRIPTIONS = {
  rule_id: "Unique identifier for the detection rule (e.g., RULE-001)",
  name: "Human-readable name for the rule",
  tactic: "MITRE ATT&CK tactic (e.g., Execution, Persistence, Defense Evasion)",
  technique_id: "MITRE ATT&CK technique ID (e.g., T1059.001)",
  xql_query: "XQL query logic for detection",
  severity: "Severity level: Critical, High, Medium, or Low",
  rule_type: "Rule type: Product (vendor-provided) or SOC (custom rules)",
  description: "Detailed description of what the rule detects (optional)",
  user: "User responsible for maintaining this rule (optional)",
  platform: "Target platform: Windows, macOS, Linux, AWS, Azure, GCP, Oracle, Containers"
};

export default function ImportModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRules, setParsedRules] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const downloadTemplate = (format) => {
    const headers = Object.keys(FIELD_DESCRIPTIONS);
    
    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...SAMPLE_RULES.map(rule => headers.map(header => JSON.stringify(rule[header] || '')).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'detection_rules_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'excel') {
      // For Excel, we'll create a more detailed CSV that can be opened in Excel
      const csvContent = [
        '# Detection Rules Import Template',
        '# Please follow the format below. Remove these comment lines before importing.',
        '',
        headers.join(','),
        ...SAMPLE_RULES.map(rule => headers.map(header => JSON.stringify(rule[header] || '')).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'detection_rules_template.xlsx.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === "text/csv" || 
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError(null);
      setParsedRules([]);
      setImportResult(null);
      setShowPreview(false);
    } else {
      setError("Please select a valid .csv or .xlsx file.");
      setFile(null);
    }
  };

  const parseFileWithIntegration = async (fileToParse) => {
    try {
      const { file_url } = await UploadFile({ file: fileToParse });
      
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            rule_id: { type: "string" },
            name: { type: "string" },
            tactic: { type: "string" },
            technique_id: { type: "string" },
            xql_query: { type: "string" },
            severity: { type: "string" },
            rule_type: { type: "string" },
            description: { type: "string" },
            user: { type: "string" },
            platform: { type: "string" }
          },
          required: ["rule_id", "name", "tactic", "technique_id", "xql_query", "severity", "rule_type", "platform"]
        }
      };

      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === "error") {
        throw new Error(result.details || "Failed to parse file");
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("The parsed file did not return an array of rules. Please check the file format.");
      }

      const rules = result.data.map((rule, index) => {
        // Handle platform: normalize to match enum capitalization
        if (rule.platform && typeof rule.platform === 'string') {
          const p = rule.platform.toLowerCase();
          const platformMap = {
              'windows': 'Windows',
              'macos': 'macOS',
              'linux': 'Linux',
              'aws': 'AWS',
              'azure': 'Azure',
              'gcp': 'GCP',
              'oracle': 'Oracle',
              'containers': 'Containers'
          };
          rule.platform = platformMap[p] || rule.platform;
        }

        // Map user field to assigned_user for backend compatibility
        if (rule.user) {
          rule.assigned_user = rule.user;
          delete rule.user;
        }

        // Set defaults for optional fields
        rule.status = "Testing"; // Default status
        rule.description = rule.description || "";
        rule.assigned_user = rule.assigned_user || "admin";

        // Validate required fields
        const requiredFields = ["rule_id", "name", "tactic", "technique_id", "xql_query", "severity", "rule_type", "platform"];
        for (const field of requiredFields) {
          if (!rule[field]) {
            throw new Error(`Row ${index + 2}: Missing required field '${field}'`);
          }
        }

        return rule;
      });

      return rules;
    } catch (error) {
      console.error("File parsing error:", error);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  };

  const handleParse = useCallback(async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    
    setIsParsing(true);
    setError(null);
    setParsedRules([]);

    try {
      const rules = await parseFileWithIntegration(file);
      setParsedRules(rules);
      
      // Perform validation
      const validation = validateRules(rules);
      setValidationResults(validation);
      
      if (validation.invalid.length > 0 || validation.warnings.length > 0) {
        setShowValidationModal(true);
      } else {
        setShowPreview(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsParsing(false);
    }
  }, [file]);

  const handleConfirmImport = async (rulesToImport = null) => {
    const rules = rulesToImport || parsedRules;
    if (rules.length === 0) return;
    
    const result = await onImport(rules);
    setImportResult(result);

    if (result.success) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleValidationClose = () => {
    setShowValidationModal(false);
    setShowPreview(true);
  };

  const handleProceedWithValid = async (validRules) => {
    setShowValidationModal(false);
    await handleConfirmImport(validRules);
  };

  const handleFixAndRetry = () => {
    setShowValidationModal(false);
    setFile(null);
    setParsedRules([]);
    setValidationResults(null);
    setError("Please fix the validation errors in your file and try again.");
  };

  const handleClose = () => {
    setFile(null);
    setParsedRules([]);
    setValidationResults(null);
    setShowValidationModal(false);
    setError(null);
    setImportResult(null);
    setShowPreview(false);
    setActiveTab("upload");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        {/* Modern Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 -mx-6 -mt-6 px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                Import Detection Rules
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-base">
                Upload CSV or Excel files with detection rules.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {importResult ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl mx-6 my-6"
          >
            {importResult.success ? (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Import Successful!</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">{importResult.message}</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Import Failed</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">{importResult.message}</p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="upload" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium">
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="template" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium">
                  Download Template
                </TabsTrigger>
                <TabsTrigger value="help" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg font-medium">
                  Field Guide
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-6">
                <TabsContent value="upload" className="space-y-6 mt-0">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Select File
                    </h3>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileChange}
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                  
                  {file && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{file.name}</span>
                          <Badge variant="outline" className="ml-2 bg-white/50 dark:bg-slate-800/50 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300">
                            {file.name.endsWith('.xlsx') ? 'Excel' : 'CSV'}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={handleParse} 
                        disabled={isParsing}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                      >
                        {isParsing ? "Parsing..." : "Parse File"}
                      </Button>
                    </motion.div>
                  )}
                  
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {parsedRules.length > 0 && validationResults && (
                    <div className="space-y-4">
                      {validationResults.invalid.length === 0 ? (
                        <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                            Successfully parsed and validated <strong>{parsedRules.length}</strong> rules.
                            {validationResults.warnings.length > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 ml-2">
                                ({validationResults.warnings.length} with warnings)
                              </span>
                            )}
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => setShowPreview(!showPreview)}
                              className="ml-2 p-0 h-auto text-emerald-700 dark:text-emerald-300 hover:text-emerald-800"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              {showPreview ? 'Hide' : 'Show'} Preview
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-800 dark:text-red-200">
                            Parsed {parsedRules.length} rules with validation issues:
                            <div className="mt-2 space-y-1">
                              <div className="text-emerald-600 dark:text-emerald-400">✅ {validationResults.valid.length} valid</div>
                              <div className="text-amber-600 dark:text-amber-400">⚠️ {validationResults.warnings.length} with warnings</div>
                              <div className="text-red-600 dark:text-red-400">❌ {validationResults.invalid.length} invalid</div>
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => setShowValidationModal(true)}
                              className="ml-2 p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              View Validation Details
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {showPreview && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Rules Preview</h4>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                            {parsedRules.slice(0, 5).map((rule, index) => {
                              const validatedRule = validationResults.valid.find(r => r.rule_id === rule.rule_id) ||
                                                   validationResults.warnings.find(r => r.rule_id === rule.rule_id) ||
                                                   validationResults.invalid.find(r => r.rule_id === rule.rule_id);
                              
                              return (
                                <div key={index} className="flex gap-3 text-sm p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <Badge variant="outline" className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                                    {rule.rule_id}
                                  </Badge>
                                  <span className="flex-1 truncate text-slate-900 dark:text-slate-100">{rule.name}</span>
                                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {rule.platform}
                                  </Badge>
                                  {validatedRule?.errors?.length > 0 && (
                                    <Badge variant="destructive" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Error</Badge>
                                  )}
                                  {validatedRule?.warnings?.length > 0 && validatedRule?.errors?.length === 0 && (
                                    <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">Warning</Badge>
                                  )}
                                </div>
                              );
                            })}
                            {parsedRules.length > 5 && (
                              <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                ... and {parsedRules.length - 5} more rules
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="template" className="space-y-6 mt-0">
                  <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileSpreadsheet className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Download Import Template</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-base mb-8 max-w-md mx-auto">
                      Get started with our pre-formatted templates that include sample data and proper column headers.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                      <Button 
                        onClick={() => downloadTemplate('csv')}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg"
                        size="lg"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV Template
                      </Button>
                      <Button 
                        onClick={() => downloadTemplate('excel')}
                        variant="outline"
                        size="lg"
                        className="border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel Template
                      </Button>
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Templates include sample detection rules with the simplified field structure. 
                      <strong> Required:</strong> rule_id, name, tactic, technique_id, xql_query, severity, rule_type, platform. 
                      <strong> Optional:</strong> description, user.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="help" className="space-y-6 mt-0">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        Field Descriptions
                      </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-6 space-y-4">
                      {Object.entries(FIELD_DESCRIPTIONS).map(([field, description]) => (
                        <div key={field} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow">
                          <Badge variant="outline" className="font-mono text-xs min-w-fit bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                            {field}
                          </Badge>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                        </div>
                      ))}
                      
                      {/* Summary Alert inside scrollable area */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-blue-800 dark:text-blue-200 space-y-2">
                            <div><strong>Required fields:</strong> rule_id, name, tactic, technique_id, xql_query, severity, rule_type, platform</div>
                            <div><strong>Optional fields:</strong> description, user</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {!importResult && parsedRules.length > 0 && validationResults && validationResults.invalid.length === 0 && (
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 -mx-6 -mb-6 px-8 py-4">
            <div className="flex justify-end items-center w-full">
              <Button 
                onClick={() => handleConfirmImport()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {parsedRules.length} Rules
              </Button>
            </div>
          </DialogFooter>
        )}

        {showValidationModal && (
          <ValidationResultsModal
            isOpen={showValidationModal}
            onClose={handleValidationClose}
            validationResults={validationResults}
            onProceedWithValid={handleProceedWithValid}
            onFixAndRetry={handleFixAndRetry}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
