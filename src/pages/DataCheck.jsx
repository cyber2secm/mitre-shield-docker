
import React, { useState, useEffect } from 'react';
import { MitreTechnique } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ListChecks } from 'lucide-react';

const REQUIRED_TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact"
];

export default function DataCheckPage() {
  const [foundTactics, setFoundTactics] = useState([]);
  const [missingTactics, setMissingTactics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const runCheck = async () => {
    setIsLoading(true);
    setAnalysisComplete(false);
    try {
      const allTechniques = await MitreTechnique.list();
      const macosTechniques = allTechniques.filter(t => t.platforms?.includes('macOS'));
      const presentTactics = [...new Set(macosTechniques.map(t => t.tactic))];

      const found = REQUIRED_TACTICS.filter(t => presentTactics.includes(t));
      const missing = REQUIRED_TACTICS.filter(t => !presentTactics.includes(t));

      setFoundTactics(found);
      setMissingTactics(missing);
    } catch (error) {
      console.error("Failed to check data:", error);
    }
    setIsLoading(false);
    setAnalysisComplete(true);
  };
  
  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-slate-200/60">
          <CardHeader>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <ListChecks className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">macOS Tactic Coverage Check</CardTitle>
                <p className="text-slate-600 text-sm font-medium">Verifying the presence of all required MITRE ATT&CK tactics for macOS.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="text-lg font-semibold">Analyzing your data...</p>
              </div>
            )}

            {analysisComplete && (
              <div className="space-y-8 mt-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Found Tactics ({foundTactics.length}/{REQUIRED_TACTICS.length})</h3>
                  {foundTactics.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {foundTactics.map(tactic => (
                        <Badge key={tactic} className="bg-emerald-100 text-emerald-800 border-emerald-200 text-base py-1 px-3">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {tactic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No required tactics found for macOS.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Missing Tactics ({missingTactics.length}/{REQUIRED_TACTICS.length})</h3>
                  {missingTactics.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {missingTactics.map(tactic => (
                        <Badge key={tactic} className="bg-red-100 text-red-800 border-red-200 text-base py-1 px-3">
                          <XCircle className="w-4 h-4 mr-2" />
                          {tactic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-8 h-8" />
                      <div>
                        <h4 className="font-bold">Excellent!</h4>
                        <p>All required tactics are present in your data for the macOS platform.</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-slate-900 mb-2">Next Steps</h3>
                  {missingTactics.length > 0 ? (
                     <p className="text-slate-600">
                       It appears your data is missing techniques for {missingTactics.length} tactics. To ensure full coverage, I can add a complete, clean dataset for macOS.
                       <br/><br/>
                       However, I cannot delete existing data. **For the best result, please first manually delete all records** from the MitreTechnique entity by going to `Workspace > Data > MitreTechnique`.
                       <br/><br/>
                       Once the data is cleared, please ask me to "add the complete macOS dataset".
                     </p>
                  ) : (
                    <p className="text-slate-600">Your data appears to be complete. No further action is needed regarding tactic coverage. You can ask me to remove this utility page when you're done.</p>
                  )}
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
