import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { emailSchema, type EmailFormData } from '@/schemas/auth.schema';
import { useRequestOtp, useVerifyOtp } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';

export function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onEmailSubmit = (data: EmailFormData) => {
    setEmail(data.email);
    requestOtp.mutate(data.email, {
      onSuccess: () => setStep('otp'),
    });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter a 6-digit code');
      return;
    }
    verifyOtp.mutate({ email, code: otpCode });
  };

  const handleResend = () => {
    requestOtp.mutate(email);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-xl bg-emerald-600 p-3 mb-4 shadow-lg shadow-emerald-200">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">PropertyPortal</h1>
          <p className="text-slate-500 mt-1">Customer Portal</p>
        </div>

        <Card className="shadow-xl border-0 shadow-slate-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {step === 'email' ? 'Welcome back' : 'Enter access code'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Enter your email to receive an access code'
                : `We've sent a 6-digit code to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="you@example.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={requestOtp.isPending}
                  >
                    {requestOtp.isPending ? 'Sending...' : 'Send Access Code'}
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-2">
                  <label htmlFor="otp-input" className="sr-only">Access Code</label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtpCode(val);
                      setOtpError('');
                    }}
                    style={{
                      width: '100%',
                      height: '48px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      letterSpacing: '0.75em',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      padding: '0 16px',
                      backgroundColor: 'white',
                      color: '#1e293b',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#059669';
                      e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {otpError && (
                    <p className="text-sm font-medium text-destructive">{otpError}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={verifyOtp.isPending}
                >
                  {verifyOtp.isPending ? 'Verifying...' : 'Verify Code'}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtpCode(''); setOtpError(''); }}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={requestOtp.isPending}
                    className="text-primary hover:text-primary/90 font-medium"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          Admin?{' '}
          <Link to="/admin/login" className="text-emerald-600 hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
