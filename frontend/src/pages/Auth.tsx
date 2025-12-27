import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Shield, Loader2, Users, UserCog, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
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
  const [formErrors, setFormErrors] = useState<{
    login?: { email?: string; password?: string };
    signup?: { fullName?: string; email?: string; password?: string; confirmPassword?: string };
  }>({});
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Clear form errors when switching tabs
  const handleTabChange = () => {
    setFormErrors({});
  };

  // Clear form errors when input changes
  const handleLoginInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setLoginEmail(value);
      if (formErrors.login?.email) {
        setFormErrors(prev => ({
          ...prev,
          login: { ...prev.login, email: undefined }
        }));
      }
    } else {
      setLoginPassword(value);
      if (formErrors.login?.password) {
        setFormErrors(prev => ({
          ...prev,
          login: { ...prev.login, password: undefined }
        }));
      }
    }
  };

  const handleSignupInputChange = (field: keyof typeof formErrors.signup, value: string) => {
    switch (field) {
      case 'fullName':
        setSignupFullName(value);
        break;
      case 'email':
        setSignupEmail(value);
        break;
      case 'password':
        setSignupPassword(value);
        break;
      case 'confirmPassword':
        setSignupConfirmPassword(value);
        break;
    }
    
    if (formErrors.signup?.[field]) {
      setFormErrors(prev => ({
        ...prev,
        signup: { ...prev.signup, [field]: undefined }
      }));
    }
  };

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/portal', { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ 
      email: loginEmail, 
      password: loginPassword 
    });
    
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      setFormErrors({
        login: {
          email: errors.email?.[0],
          password: errors.password?.[0]
        }
      });
      
      toast({
        title: 'Validation Error',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFormErrors({});
    
    const { error } = await signIn(loginEmail.trim(), loginPassword);
    
    setIsLoading(false);

    if (error) {
      let errorMessage = error;
      
      // Map common backend errors to user-friendly messages
      if (error.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.includes('account is not active')) {
        errorMessage = 'Your account is not active. Please contact support.';
      } else if (error.includes('network error') || error.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
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
      const errors = validation.error.flatten().fieldErrors;
      setFormErrors({
        signup: {
          fullName: errors.fullName?.[0],
          email: errors.email?.[0],
          password: errors.password?.[0],
          confirmPassword: errors.confirmPassword?.[0]
        }
      });
      
      toast({
        title: 'Validation Error',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFormErrors({});
    
    const { error } = await signUp(
      signupEmail.trim().toLowerCase(), 
      signupPassword, 
      signupFullName.trim()
    );
    
    setIsLoading(false);

    if (error) {
      let errorMessage = error;
      let toastTitle = 'Signup Failed';
      
      // Map common backend errors to user-friendly messages
      if (error.includes('already registered') || error.includes('already exists')) {
        errorMessage = 'This email is already registered. Please login instead.';
        toastTitle = 'Account Exists';
      } else if (error.includes('Invalid email format')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.includes('Password must contain')) {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
      } else if (error.includes('network error') || error.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        title: toastTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Account created successfully! You are now logged in.',
      });
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: 'text-gray-500' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const strengths = [
      { text: 'Very Weak', color: 'text-red-500' },
      { text: 'Weak', color: 'text-orange-500' },
      { text: 'Fair', color: 'text-yellow-500' },
      { text: 'Good', color: 'text-green-500' },
      { text: 'Strong', color: 'text-emerald-500' },
      { text: 'Very Strong', color: 'text-emerald-600' },
    ];
    
    return strengths[Math.min(score, strengths.length - 1)];
  };

  const passwordStrength = getPasswordStrength(signupPassword);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-8 shadow-2xl shadow-blue-600/30 animate-pulse-slow">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Kids League Kenya</h1>
          <p className="text-xl text-slate-300 mb-8">Beneficiary Management System</p>
          <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700">
            <Shield className="h-5 w-5 text-green-400" />
            <span className="text-slate-300">Secure & Reliable Platform</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-cyan-600/10 rounded-full blur-2xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 animate-pulse-slow">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Kids League Kenya</h1>
            <p className="text-slate-400 mt-2">Beneficiary Management System</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 text-center mb-4">I am logging in as:</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserType('admin');
                  setFormErrors({});
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
                  selectedUserType === 'admin'
                    ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-600/20"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200",
                  selectedUserType === 'admin' 
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30" 
                    : "bg-slate-700"
                )}>
                  <UserCog className="h-7 w-7 text-white" />
                </div>
                <span className="font-semibold">Admin</span>
                <span className="text-xs text-slate-500">System Administrator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserType('beneficiary');
                  setFormErrors({});
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
                  selectedUserType === 'beneficiary'
                    ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-600/20"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200",
                  selectedUserType === 'beneficiary' 
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30" 
                    : "bg-slate-700"
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
              <Tabs defaultValue="login" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
                  <TabsTrigger 
                    value="login"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                    disabled={selectedUserType === 'admin'}
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    {formErrors.login && (formErrors.login.email || formErrors.login.password) && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {formErrors.login.email || formErrors.login.password}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => handleLoginInputChange('email', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.login?.email && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.login?.email && (
                        <p className="text-xs text-red-400">{formErrors.login.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={() => {
                            // Add forgot password functionality here
                            toast({
                              title: 'Forgot Password',
                              description: 'Please contact system administrator for password reset.',
                            });
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => handleLoginInputChange('password', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.login?.password && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.login?.password && (
                        <p className="text-xs text-red-400">{formErrors.login.password}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20" 
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
                    {formErrors.signup && Object.values(formErrors.signup).some(Boolean) && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please correct the errors below
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-slate-300">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupFullName}
                        onChange={(e) => handleSignupInputChange('fullName', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.signup?.fullName && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.signup?.fullName && (
                        <p className="text-xs text-red-400">{formErrors.signup.fullName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-300">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => handleSignupInputChange('email', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.signup?.email && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.signup?.email && (
                        <p className="text-xs text-red-400">{formErrors.signup.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-300">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 8 characters)"
                        value={signupPassword}
                        onChange={(e) => handleSignupInputChange('password', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.signup?.password && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {signupPassword && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  passwordStrength.color.replace('text-', 'bg-')
                                )}
                                style={{ 
                                  width: `${(signupPassword.length / 20) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <span className={cn("text-xs font-medium", passwordStrength.color)}>
                            {passwordStrength.text}
                          </span>
                        </div>
                      )}
                      {formErrors.signup?.password && (
                        <p className="text-xs text-red-400">{formErrors.signup.password}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Must contain: uppercase, lowercase, and number
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-slate-300">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => handleSignupInputChange('confirmPassword', e.target.value)}
                        required
                        className={cn(
                          "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200",
                          formErrors.signup?.confirmPassword && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.signup?.confirmPassword && (
                        <p className="text-xs text-red-400">{formErrors.signup.confirmPassword}</p>
                      )}
                      {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                        <p className="text-xs text-red-400">Passwords do not match</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20" 
                      disabled={isLoading || !signupPassword || !signupConfirmPassword}
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
                  
                  <div className="mt-6 space-y-4">
                    <p className="text-xs text-slate-500 text-center">
                      New accounts are registered as beneficiaries.
                      Contact admin for elevated access.
                    </p>
                    
                    <Alert className="bg-slate-900/30 border-slate-700">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-xs text-slate-400">
                        By signing up, you agree to our Terms of Service and Privacy Policy
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <div className="flex items-center justify-center gap-3 text-slate-400">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm">Secure authentication with Django JWT</span>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Your data is protected with industry-standard encryption
            </p>
          </div>
          
          {/* REMOVED: Development mode indicator that was causing the error */}
        </div>
      </div>
    </div>
  );
};

export default Auth;