
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
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";

export default function ImportModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRules, setParsedRules] = useState([]);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === "text/csv" || 
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError(null);
      setParsedRules([]);
      setImportResult(null);
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
            technique_id: { type: "string" },
            platform: { type: "string" },
            tactic: { type: "string" },
            xql_query: { type: "string" },
            status: { type: "string" },
            severity: { type: "string" },
            description: { type: "string" },
            tags: { type: "string" },
            false_positive_rate: { type: "string" },
            assigned_user: { type: "string" }
          },
          required: ["rule_id", "name", "technique_id", "platform", "tactic", "xql_query"]
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
        // Handle tags: ensure it's an array, not a string
        if (rule.tags && typeof rule.tags === 'string') {
          rule.tags = rule.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else {
          rule.tags = [];
        }

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

        rule.status = rule.status || "Testing";
        rule.severity = rule.severity || "Medium";
        rule.false_positive_rate = rule.false_positive_rate || "Medium";

        const requiredFields = ["rule_id", "name", "technique_id", "platform", "tactic", "xql_query"];
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
    } catch (e) {
      setError(e.message);
    } finally {
      setIsParsing(false);
    }
  }, [file]);

  const handleConfirmImport = async () => {
    if (parsedRules.length === 0) return;
    
    const result = await onImport(parsedRules);
    setImportResult(result);

    if (result.success) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRules([]);
    setError(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Detection Rules</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your rules. Make sure it includes the required headers: rule_id, name, technique_id, platform, tactic, xql_query.
          </DialogDescription>
        </DialogHeader>

        {importResult ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
            {importResult.success ? (
              <>
                <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Import Successful</h3>
                <p className="text-slate-600">{importResult.message}</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Import Failed</h3>
                <p className="text-slate-600">{importResult.message}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            {file && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    ({file.name.endsWith('.xlsx') ? 'Excel' : 'CSV'})
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleParse} disabled={isParsing}>
                  {isParsing ? "Parsing..." : "Parse File"}
                </Button>
              </div>
            )}
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            {parsedRules.length > 0 && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                <p>Successfully parsed <strong>{parsedRules.length}</strong> rules. Ready to import.</p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="text-xs space-y-1">
                    {parsedRules.slice(0, 5).map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="font-mono text-blue-600">{rule.rule_id}</span>
                        <span>-</span>
                        <span className="truncate">{rule.name}</span>
                      </div>
                    ))}
                    {parsedRules.length > 5 && (
                      <div className="text-slate-500">... and {parsedRules.length - 5} more</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!importResult && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleConfirmImport}
              disabled={parsedRules.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import {parsedRules.length > 0 ? parsedRules.length : ''} Rules
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
