'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { signUp } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import { SocialProviders } from './social-providers';

export function SignUp({
  configs,
  callbackUrl = '/',
}: {
  configs: Record<string, string>;
  callbackUrl: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common.sign');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isGoogleAuthEnabled = configs.google_auth_enabled === 'true';
  const isGithubAuthEnabled = configs.github_auth_enabled === 'true';
  const isEmailAuthEnabled =
    configs.email_auth_enabled !== 'false' ||
    (!isGoogleAuthEnabled && !isGithubAuthEnabled); // no social providers enabled, auto enable email auth

  // Process callbackUrl with locale
  let processedCallbackUrl = callbackUrl;
  if (callbackUrl) {
    if (
      locale !== defaultLocale &&
      callbackUrl.startsWith('/') &&
      !callbackUrl.startsWith(`/${locale}`)
    ) {
      processedCallbackUrl = `/${locale}${callbackUrl}`;
    }
  }

  const reportAffiliate = ({
    userEmail,
    stripeCustomerId,
  }: {
    userEmail: string;
    stripeCustomerId?: string;
  }) => {
    if (typeof window === 'undefined' || !configs) {
      return;
    }

    const windowObject = window as any;

    if (configs.affonso_enabled === 'true' && windowObject.Affonso) {
      windowObject.Affonso.signup(userEmail);
    }

    if (configs.promotekit_enabled === 'true' && windowObject.promotekit) {
      windowObject.promotekit.refer(userEmail, stripeCustomerId);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    // 阻止表单默认提交行为
    if (e) {
      e.preventDefault();
    }

    if (loading) {
      return;
    }

    // 去除首尾空格
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedName) {
      toast.error('email, password and name are required');
      return;
    }

    // Validate password length before sending
    if (trimmedPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    await signUp.email(
      {
        email: trimmedEmail,
        password: trimmedPassword,
        name: trimmedName,
        callbackURL: processedCallbackUrl, // Add callbackURL for better-auth
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('Sign up request:', { email, name, passwordLength: password.length });
          }
        },
        onResponse: (ctx) => {
          setLoading(false);
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('Sign up response:', ctx);
          }
        },
        onSuccess: async (ctx) => {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('Sign up success:', ctx);
          }
          
          // report affiliate
          reportAffiliate({ userEmail: trimmedEmail });
          
          // 显示成功提示
          toast.success('Sign up successful! Redirecting...', {
            duration: 1500,
          });
          
          // Grant free plan credits to new user (不阻塞跳转)
          fetch('/api/user/grant-free-credits', {
            method: 'POST',
          }).catch((error) => {
            // Silently fail - credits grant is not critical for signup flow
            if (process.env.NODE_ENV === 'development') {
              console.log('Failed to grant free credits:', error);
            }
          });
          
          // 延迟跳转，确保 cookie 已设置
          setTimeout(() => {
            // 优先使用 callbackUrl，否则跳转到 soloboard
            const redirectUrl = processedCallbackUrl && processedCallbackUrl !== '/' 
              ? processedCallbackUrl 
              : `/${locale}/soloboard`;
            
            // 使用 router.push 进行客户端导航
            router.push(redirectUrl);
          }, 500);
        },
        onError: (e: any) => {
          setLoading(false);
          
          // Extract error information
          const errorDetails = e?.error || e;
          const errorMessage = errorDetails?.message || e?.message || 'Sign up failed';
          const errorCode = errorDetails?.code || e?.error?.code || e?.code;
          
          // Check if user already exists (multiple error code formats)
          const isUserExistsError = 
            errorCode === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
            errorCode === 'USER_ALREADY_EXISTS' ||
            errorMessage?.toLowerCase().includes('already exists') || 
            errorMessage?.toLowerCase().includes('already in use') ||
            errorMessage?.toLowerCase().includes('user already exists') ||
            errorDetails?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
            errorDetails?.code === 'USER_ALREADY_EXISTS';
          
          if (isUserExistsError) {
            // Silent redirect for existing users - no error logs to console
            // Show friendly info toast
            toast.info(t('email_already_registered') || 'This email is already registered. Redirecting to sign in...', {
              duration: 2000,
              description: t('redirecting_to_signin') || 'Please sign in with your existing account.',
            });
            
            // Smooth redirect to sign-in page with email pre-filled
            setTimeout(() => {
              const signInParams = new URLSearchParams();
              if (processedCallbackUrl && processedCallbackUrl !== '/') {
                signInParams.set('callbackUrl', processedCallbackUrl);
              }
              signInParams.set('email', email);
              const signInUrl = `/${locale}/sign-in?${signInParams.toString()}`;
              router.push(signInUrl);
            }, 1500);
            
            return; // Exit early, no error logging
          }
          
          // For other errors, log only in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn('Sign up error:', {
              code: errorCode,
              message: errorMessage,
              // Only log minimal info in dev mode
            });
          }
          
          // Display user-friendly error messages
          if (errorMessage.includes('password') || errorMessage.includes('Password')) {
            toast.error(t('password_requirements_error') || 'Password does not meet requirements. Please use at least 8 characters.');
          } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            toast.error(t('email_invalid_error') || 'Email is invalid. Please check your email address.');
          } else {
            toast.error(errorMessage);
          }
        },
      }
    );
  };

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>{t('sign_up_title')}</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>{t('sign_up_description')}</h2>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="grid gap-4">
          {isEmailAuthEnabled && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name_title')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('name_placeholder')}
                  required
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  value={name}
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('email_title')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('password_title')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p>{t('sign_up_title')}</p>
                )}
              </Button>
            </>
          )}

          <SocialProviders
            configs={configs}
            callbackUrl={processedCallbackUrl || '/'}
            loading={loading}
            setLoading={setLoading}
          />
        </form>
      </CardContent>
      {isEmailAuthEnabled && (
        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-xs text-neutral-500">
              {t('already_have_account')}
              <Link href="/sign-in" className="underline">
                <span className="cursor-pointer dark:text-white/70">
                  {t('sign_in_title')}
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
