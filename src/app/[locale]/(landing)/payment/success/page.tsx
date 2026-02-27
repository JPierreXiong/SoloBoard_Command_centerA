/**
 * 支付成功页面
 * 显示支付成功信息，并实时检查订阅状态
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle2, ArrowRight, Loader2, Sparkles, CreditCard, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const orderNo = searchParams.get('order_no');
  
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // 最多重试10次，约30秒

  useEffect(() => {
    if (sessionId || orderNo) {
      checkSubscriptionStatus();
    }
  }, [sessionId, orderNo]);

  // 轮询检查订阅状态
  const checkSubscriptionStatus = async () => {
    try {
      console.log('🔍 检查订阅状态...', { sessionId, orderNo, retryCount });
      
      // 获取当前用户信息和订阅
      const response = await fetch('/api/user/me');
      const userData = await response.json();
      
      if (userData.subscription && userData.subscription.status === 'active') {
        // 找到活跃订阅
        console.log('✅ 找到活跃订阅:', userData.subscription);
        setSubscription(userData.subscription);
        setCheckingStatus(false);
        setLoading(false);
        return;
      }

      // 如果还没有订阅，继续重试
      if (retryCount < maxRetries) {
        console.log(`⏳ 订阅尚未创建，3秒后重试 (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          checkSubscriptionStatus();
        }, 3000);
      } else {
        // 超过最大重试次数
        console.warn('⚠️ 订阅创建超时，但支付已成功');
        setCheckingStatus(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ 检查订阅状态失败:', error);
      setCheckingStatus(false);
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            <CardTitle className="text-3xl text-green-700 dark:text-green-400">
              支付成功！
            </CardTitle>
            <CardDescription className="text-base">
              感谢您的购买，您的账户正在升级中
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 订阅状态检查 */}
            {checkingStatus && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>正在激活您的订阅...</AlertTitle>
                <AlertDescription>
                  请稍候，我们正在处理您的订单并激活订阅权益（{retryCount}/{maxRetries}）
                </AlertDescription>
              </Alert>
            )}

            {/* 订阅信息 */}
            {!checkingStatus && subscription && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 dark:text-green-400">
                    订阅已激活！
                  </AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-300">
                    您的 {subscription.planName} 已成功激活，现在可以享受所有高级功能
                  </AlertDescription>
                </Alert>

                <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">订阅计划</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                      {subscription.planName}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">订阅周期</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">订阅金额</span>
                    <span className="font-semibold text-lg">
                      ${(subscription.amount / 100).toFixed(2)}/{subscription.interval === 'month' ? '月' : '年'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">订阅状态</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {subscription.status === 'active' ? '已激活' : subscription.status}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 订阅创建超时提示 */}
            {!checkingStatus && !subscription && (
              <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                <AlertTitle>支付已完成</AlertTitle>
                <AlertDescription>
                  您的支付已成功，订阅正在后台处理中。如果几分钟后仍未看到订阅，请联系客服或访问{' '}
                  <Link href="/settings/billing" className="underline font-semibold">
                    账单页面
                  </Link>{' '}
                  查看。
                </AlertDescription>
              </Alert>
            )}

            {/* 下一步操作 */}
            <div className="space-y-3">
              <h4 className="font-semibold">接下来您可以：</h4>
              
              <div className="grid gap-3">
                <Link href="/soloboard">
                  <Button className="w-full" size="lg" disabled={checkingStatus}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    开始使用 SoloBoard
                  </Button>
                </Link>

                <Link href="/settings/billing">
                  <Button variant="outline" className="w-full" size="lg">
                    <CreditCard className="mr-2 h-5 w-5" />
                    查看订阅详情
                  </Button>
                </Link>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>✨ 欢迎加入 SoloBoard {subscription?.planName || 'Pro'} 会员</p>
              <p className="mt-1">如有问题，请联系客服</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

