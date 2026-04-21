import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Shield, AlertTriangle, CheckCircle, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/export/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `productivity_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data Exported Successfully",
        description: "Your complete productivity data has been downloaded as a backup file.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/backup/create', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Backup creation failed');
      }

      const result = await response.json();
      
      toast({
        title: "Backup Created",
        description: `Backup created with ${result.totalRecords} records at ${new Date(result.timestamp).toLocaleString()}`,
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/export/zip', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('ZIP export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `productivity_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "ZIP Downloaded",
        description: "Complete backup with CSV files downloaded successfully!",
      });
    } catch (error) {
      console.error('ZIP export error:', error);
      toast({
        title: "ZIP Export Failed",
        description: "Failed to export ZIP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle>Export Your Data</CardTitle>
          </div>
          <CardDescription>
            Download a complete backup of all your productivity data including tasks, habits, goals, and session history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Includes all tasks, habits, goals, and time tracking data</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>JSON format for easy data portability</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Complete history and metadata preservation</span>
          </div>
          
          <Button 
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Download JSON"}
          </Button>
          
          <Button 
            onClick={handleExportZip}
            disabled={isExportingZip}
            variant="outline"
            className="w-full mt-2"
          >
            <Archive className="mr-2 h-4 w-4" />
            {isExportingZip ? "Creating ZIP..." : "Download ZIP with CSV Files"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Create Backup</CardTitle>
          </div>
          <CardDescription>
            Create an instant backup snapshot of your current data for safety verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            variant="outline"
            className="w-full"
          >
            <Shield className="mr-2 h-4 w-4" />
            {isCreatingBackup ? "Creating Backup..." : "Create Backup Snapshot"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800 dark:text-orange-200">Data Protection Notice</CardTitle>
          </div>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            We strongly recommend regularly backing up your productivity data to prevent any potential loss.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}