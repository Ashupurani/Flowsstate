import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Mail, Loader2, AlertCircle } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Automatically verify if we have a token from the URL
      verifyMutation.mutate(tokenFromUrl);
    } else {
      setIsProcessing(false);
    }
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      return await apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: verificationToken }),
      });
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        toast({
          title: "Email verified successfully! 🎉",
          description: "Your account is now fully activated. Redirecting to your dashboard...",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      }
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification token.",
        variant: "destructive",
      });
    },
  });

  const handleReturnToLogin = () => {
    setLocation('/');
  };

  if (isProcessing || verifyMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying Your Email...
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your account
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-green-900/20 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Verified! 🎉
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Your account is now fully activated and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Redirecting to your dashboard...
            </p>
            <Button 
              onClick={handleReturnToLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or no token state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-red-900/20 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Verification Failed
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {!token 
              ? "No verification token found in the URL" 
              : "The verification token is invalid or has expired"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">What can you do?</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Check if the verification link in your email is complete</li>
              <li>• Try logging in - you may already be verified</li>
              <li>• Request a new verification email if needed</li>
            </ul>
          </div>
          <Button 
            onClick={handleReturnToLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Mail className="w-4 h-4 mr-2" />
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}