'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

import { signIn } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
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

export function SignIn({
  configs,
  callbackUrl = '/',
}: {
  configs: Record<string, string>;
  callbackUrl: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common.sign');
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // 从 URL 参数中获取 email（如果从注册页面跳转过来）
  useEffect(() => {
    const emailFromUrl = searchParams?.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      // 显示友好提示
      toast.info('Please sign in with your existing account', {
        duration: 3000,
      });
    }
  }, [searchParams]);

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

  const handleSignIn = async (e?: React.FormEvent) => {
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

    if (!trimmedEmail || !trimmedPassword) {
      toast.error('email and password are required');
      return;
    }

    await signIn.email(
      {
        email: trimmedEmail,
        password: trimmedPassword,
        callbackURL: processedCallbackUrl,
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          setLoading(false);
        },
        onSuccess: (ctx) => {
          // 显示成功提示
          toast.success('Sign in successful! Redirecting...', {
            duration: 1500,
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
          toast.error(e?.error?.message || 'sign in failed');
          setLoading(false);
        },
      }
    );
  };

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>{t('sign_in_title')}</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>{t('sign_in_description')}</h2>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="grid gap-4">
          {isEmailAuthEnabled && (
            <>
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
                <div className="flex items-center">
                  <Label htmlFor="password">{t('password_title')}</Label>
                  {/* <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link> */}
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              onClick={() => {
                setRememberMe(!rememberMe);
              }}
            />
            <Label htmlFor="remember">Remember me</Label>
          </div> */}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p> {t('sign_in_title')} </p>
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
              {t('no_account')}
              <Link href="/sign-up" className="underline">
                <span className="cursor-pointer dark:text-white/70">
                  {t('sign_up_title')}
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
