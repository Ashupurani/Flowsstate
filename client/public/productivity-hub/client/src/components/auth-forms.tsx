import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, Lock, User } from "lucide-react";

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Check if we have a token and should default to login
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('💭 AuthForms - Found existing token, defaulting to login mode');
      setIsLogin(true);
    }
  }, []);
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    name: ""
  });
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      console.log('🔐 Auth mutation started:', { isLogin, data: { email: data.email } });
      const endpoint = isLogin ? "login" : "register";
      
      // Clear any existing tokens to prevent conflicts
      localStorage.removeItem("auth_token");
      console.log('🗑️ Cleared existing token');
      
      try {
        // Build payload based on login vs register - don't send extra fields
        const payload = isLogin 
          ? { email: data.email, password: data.password }
          : { email: data.email, password: data.password, name: data.name! };
        
        console.log('📡 Making request to:', `/api/auth/${endpoint}`, { payload });
        
        const response = await fetch(`/api/auth/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server error response:', errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Auth API response:', result);
        return result;
      } catch (error) {
        console.error('❌ Auth API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        
        if (isLogin) {
          toast({
            title: "Welcome back!",
            description: "You've been logged in successfully.",
          });
          // Redirect to pending invite if one was saved before login
          const pendingInvite = sessionStorage.getItem("pendingInviteUrl");
          if (pendingInvite) {
            sessionStorage.removeItem("pendingInviteUrl");
            setTimeout(() => { window.location.href = pendingInvite; }, 500);
          } else {
            setTimeout(() => window.location.reload(), 500);
          }
        } else {
          // Check if user is already verified (auto-verified in development)
          if (data.user?.isVerified) {
            toast({
              title: "Account created and verified!",
              description: "You can now use the platform.",
            });
            // Force page refresh to reload auth state for verified signup
            setTimeout(() => window.location.reload(), 500);
          } else {
            // Show verification mode for unverified users
            setVerificationMode(true);
            toast({
              title: "Account created!",
              description: "Please check your email and enter the verification code to activate your account.",
            });
          }
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        toast({
          title: "Email verified!",
          description: "Your account is now fully activated.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification token.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted!', { formData, isLogin });
    
    if (!formData.email || !formData.password) {
      console.log('❌ Form validation failed: missing email/password');
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !formData.name) {
      console.log('❌ Form validation failed: missing name for signup');
      toast({
        title: "Missing information", 
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Form validation passed, calling mutation');
    authMutation.mutate(formData);
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationToken) {
      toast({
        title: "Missing token",
        description: "Please enter the verification token from your email.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(verificationToken);
  };

  if (verificationMode) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            We've sent a verification link to <strong>{formData.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-medium">Next steps:</p>
            <p>1. Open the email from Flowsstate</p>
            <p>2. Click the <strong>"Verify My Email"</strong> button</p>
            <p>3. You'll be logged in automatically</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            The link expires in 24 hours. Check your spam folder if you don't see it.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setVerificationMode(false)}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Flowsstate
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={isLogin ? "login" : "signup"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger 
              value="login" 
              onClick={() => setIsLogin(true)}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              onClick={() => setIsLogin(false)}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Enter your password" : "Create a password (6+ characters)"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2"
              disabled={authMutation.isPending}
            >
              {authMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}