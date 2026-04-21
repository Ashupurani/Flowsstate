import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Video, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  onUploadComplete?: (videoPath: string) => void;
}

export function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file (MP4, WebM, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Get upload URL from backend
      const uploadResponse = await apiRequest('/api/demo/upload', {
        method: 'POST'
      });

      const { uploadURL } = uploadResponse;

      // Upload file directly to object storage
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            // Set ACL policy for the uploaded video
            const updateResponse = await apiRequest('/api/demo/video', {
              method: 'PUT',
              body: JSON.stringify({ videoURL: uploadURL })
            });

            setUploadStatus('success');
            setUploadedVideoPath(updateResponse.objectPath);
            onUploadComplete?.(updateResponse.objectPath);
            
            toast({
              title: "Upload Successful",
              description: "Your demo video has been uploaded successfully!",
            });
          } catch (error) {
            console.error('Error updating video ACL:', error);
            setUploadStatus('error');
            toast({
              title: "Upload Failed",
              description: "Failed to finalize video upload",
              variant: "destructive"
            });
          }
        } else {
          setUploadStatus('error');
          toast({
            title: "Upload Failed",
            description: "Failed to upload video file",
            variant: "destructive"
          });
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        setUploadStatus('error');
        setIsUploading(false);
        toast({
          title: "Upload Failed",
          description: "An error occurred during upload",
          variant: "destructive"
        });
      });

      xhr.open('PUT', uploadURL);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Error getting upload URL:', error);
      setIsUploading(false);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "Failed to initiate upload",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Upload className="h-5 w-5 animate-pulse text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Video className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'success':
        return 'Upload completed successfully!';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Ready to upload demo video';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Upload Demo Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusText()}
        </div>
        
        {uploadStatus === 'uploading' && (
          <Progress value={uploadProgress} className="w-full" />
        )}

        {uploadStatus === 'success' && uploadedVideoPath && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              Video uploaded successfully! It can now be accessed at:
            </p>
            <code className="text-xs text-green-600 dark:text-green-400 break-all">
              {uploadedVideoPath}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload">
            <Button 
              variant="outline" 
              disabled={isUploading}
              className="w-full cursor-pointer"
              asChild
            >
              <span>
                {isUploading ? 'Uploading...' : 'Choose Video File'}
              </span>
            </Button>
          </label>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Supported: MP4, WebM, MOV (max 100MB)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}