import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Shield, Loader2, Users, UserCog } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserType = 'admin' | 'beneficiary';

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('beneficiary');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  useEffect(() => {
    if (!loading && user && role) {
      // Check if user's actual role matches their selection
      if (role !== selectedUserType) {
        toast({
          title: 'Access Notice',
          description: `You are logged in as ${role === 'admin' ? 'an Admin' : 'a Beneficiary'}. Redirecting to your dashboard.`,
        });
      }
      
      // Redirect based on actual database role, not UI selection
      if (role === 'admin') {
        navigate('/');
      } else {
        navigate('/portal');
      }
    }
  }, [user, role, loading, navigate, selectedUserType, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({
      fullName: signupFullName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });
    
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account Exists',
          description: 'This email is already registered. Please login instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Success',
        description: 'Account created successfully! You are now logged in.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-blue-600 mb-8 shadow-2xl shadow-blue-600/30">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Kids League Kenya</h1>
          <p className="text-xl text-slate-300 mb-8">Beneficiary Management System</p>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <Shield className="h-5 w-5" />
            <span>Secure & Reliable Platform</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600 mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Kids League Kenya</h1>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <p className="text-sm text-slate-400 text-center mb-4">I am logging in as:</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedUserType('admin')}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                  selectedUserType === 'admin'
                    ? "border-blue-500 bg-blue-600/20 text-white"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  selectedUserType === 'admin' ? "bg-blue-600" : "bg-slate-700"
                )}>
                  <UserCog className="h-7 w-7 text-white" />
                </div>
                <span className="font-semibold">Admin</span>
                <span className="text-xs text-slate-500">System Administrator</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserType('beneficiary')}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                  selectedUserType === 'beneficiary'
                    ? "border-blue-500 bg-blue-600/20 text-white"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  selectedUserType === 'beneficiary' ? "bg-blue-600" : "bg-slate-700"
                )}>
                  <Users className="h-7 w-7 text-white" />
                </div>
                <span className="font-semibold">Beneficiary</span>
                <span className="text-xs text-slate-500">Student Portal</span>
              </button>
            </div>
          </div>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-white text-xl">
                {selectedUserType === 'admin' ? 'Admin Login' : 'Beneficiary Portal'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {selectedUserType === 'admin' 
                  ? 'Access the administration dashboard'
                  : 'Sign in to your student account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
                  <TabsTrigger 
                    value="login"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    disabled={selectedUserType === 'admin'}
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-slate-300">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-300">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-300">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-slate-300">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    New accounts are registered as beneficiaries.
                    Contact admin for elevated access.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Shield className="h-4 w-4" />
            <span>Secure authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
