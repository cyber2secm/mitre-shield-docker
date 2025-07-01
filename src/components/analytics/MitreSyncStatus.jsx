import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  TrendingUp,
  Shield,
  Play,
  Pause,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "@/api/apiClient";

export default function MitreSyncStatus({ onDataUpdate }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [techCounts, setTechCounts] = useState(null);

  useEffect(() => {
    loadSyncStatus();
    loadTechniqueCounts();
    
    // Poll for status updates when syncing
    const interval = setInterval(() => {
      if (isSyncing) {
        loadSyncStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSyncing]);

  const loadSyncStatus = async () => {
    try {
      const response = await apiClient.mitreSyncStatus();
      setSyncStatus(response.data);
      setIsSyncing(response.data.isRunning);
      setProgress(response.data.progress);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sync status:', error);
      setError('Failed to load sync status');
      setIsLoading(false);
    }
  };

  const loadTechniqueCounts = async () => {
    try {
      const response = await apiClient.mitreTechniquesCount();
      setTechCounts(response.data);
    } catch (error) {
      console.error('Error loading technique counts:', error);
    }
  };

  const handleManualSync = async (force = false) => {
    try {
      setIsSyncing(true);
      setError(null);
      setLastSyncResult(null);
      
      console.log(`🔄 Starting MITRE sync (force: ${force})`);
      
      // Use the new non-blocking sync method
      const response = await apiClient.mitreSync(force);
      
      if (response.success) {
        console.log('✅ MITRE sync started successfully');
        
        // Start polling for status updates
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await apiClient.mitreSyncStatus();
            setSyncStatus(statusResponse.data);
            setProgress(statusResponse.data.progress);
            
            if (!statusResponse.data.isRunning) {
              clearInterval(pollInterval);
              setIsSyncing(false);
              
              if (statusResponse.data.progress?.status === 'completed') {
                setLastSyncResult({
                  success: true,
                  message: 'Sync completed successfully',
                  data: statusResponse.data.progress
                });
                
                // Refresh data
                if (onDataUpdate) onDataUpdate();
                await loadTechniqueCounts();
              } else if (statusResponse.data.progress?.status === 'error') {
                setLastSyncResult({
                  success: false,
                  message: 'Sync failed',
                  error: statusResponse.data.progress.errors?.join(', ') || 'Unknown error'
                });
              }
            }
          } catch (pollError) {
            console.error('Error polling sync status:', pollError);
            clearInterval(pollInterval);
            setIsSyncing(false);
            setError('Lost connection to sync process');
          }
        }, 2000);
        
      } else {
        setIsSyncing(false);
        setError(response.message || 'Failed to start sync');
      }
      
    } catch (error) {
      console.error('MITRE sync failed:', error);
      setIsSyncing(false);
      setError(error.message);
      setLastSyncResult({
        success: false,
        message: 'Sync failed',
        error: error.message
      });
    }
  };

  const handleStreamingSync = async (force = false) => {
    try {
      setIsSyncing(true);
      setError(null);
      setLastSyncResult(null);
      
      console.log(`🔄 Starting streaming MITRE sync (force: ${force})`);
      
      const result = await apiClient.mitreSyncStream(force, (progressData) => {
        console.log('📊 Sync progress:', progressData);
        
        if (progressData.type === 'status') {
          setProgress({ status: progressData.status, message: progressData.message });
        }
      });
      
      setIsSyncing(false);
      setLastSyncResult(result);
      
      if (result.success) {
        if (onDataUpdate) onDataUpdate();
        await loadTechniqueCounts();
      }
      
    } catch (error) {
      console.error('Streaming MITRE sync failed:', error);
      setIsSyncing(false);
      setError(error.message);
      setLastSyncResult({
        success: false,
        message: 'Streaming sync failed',
        error: error.message
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getSyncStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (lastSyncResult?.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getSyncStatusColor = () => {
    if (isSyncing) return 'bg-blue-100 text-blue-800';
    if (error) return 'bg-red-100 text-red-800';
    if (lastSyncResult?.success) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    
    const { processedTechniques = 0, totalTechniques = 0, processedTactics = 0, totalTactics = 0 } = progress;
    const totalItems = totalTechniques + totalTactics;
    const processedItems = processedTechniques + processedTactics;
    
    return totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MITRE ATT&CK Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MITRE ATT&CK Sync
          </div>
          <Badge className={getSyncStatusColor()}>
            {getSyncStatusIcon()}
            <span className="ml-1">
              {isSyncing ? 'Syncing' : progress?.status || 'Ready'}
            </span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        {isSyncing && progress && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex justify-between text-sm">
              <span>Sync Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            
            {progress.totalTechniques > 0 && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Techniques</div>
                  <div className="font-medium">
                    {progress.processedTechniques || 0} / {progress.totalTechniques}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Tactics</div>
                  <div className="font-medium">
                    {progress.processedTactics || 0} / {progress.totalTactics}
                  </div>
                </div>
              </div>
            )}
            
            {progress.message && (
              <div className="text-sm text-gray-600 italic">
                {progress.message}
              </div>
            )}
          </motion.div>
        )}

        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Last Sync</div>
            <div className="font-medium">
              {formatDate(syncStatus?.lastSyncTime)}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Duration</div>
            <div className="font-medium">
              {formatDuration(syncStatus?.duration)}
            </div>
          </div>
        </div>

        {/* Technique Counts */}
        {techCounts && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Database Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Techniques</div>
                <div className="font-medium text-lg">{techCounts.total || 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Tactics</div>
                <div className="font-medium text-lg">{techCounts.byTactic?.length || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </motion.div>
        )}

        {/* Success Display */}
        {lastSyncResult?.success && !isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Success</span>
            </div>
            <div className="text-green-600 text-sm mt-1">
              {lastSyncResult.message}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleManualSync(false)}
            disabled={isSyncing}
            className="w-full"
            variant="default"
          >
            {isSyncing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sync Latest Data
              </>
            )}
          </Button>
          
          <Button
            onClick={() => handleManualSync(true)}
            disabled={isSyncing}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Full Sync
          </Button>
        </div>

        {/* Quick Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Syncs with official MITRE ATT&CK TAXII API</div>
          <div>• Updates techniques, tactics, and metadata</div>
          <div>• Preserves existing detection rules</div>
        </div>
      </CardContent>
    </Card>
  );
} 