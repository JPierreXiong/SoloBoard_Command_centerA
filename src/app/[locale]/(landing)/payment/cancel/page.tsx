/**
 * 支付取消页面
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="container max-w-2xl py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            <CardTitle className="text-3xl text-orange-700 dark:text-orange-400">
              支付已取消
            </CardTitle>
            <CardDescription className="text-base">
              您已取消本次支付，订单未完成
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 提示信息 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">可能的原因：</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>您主动取消了支付</li>
                <li>支付页面超时</li>
                <li>支付信息填写有误</li>
                <li>网络连接中断</li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <h4 className="font-semibold">您可以：</h4>
              
              <div className="grid gap-3">
                <Link href="/pricing">
                  <Button className="w-full" size="lg">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    重新购买
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button variant="outline" className="w-full" size="lg">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    返回控制台
                  </Button>
                </Link>
              </div>
            </div>

            {/* 帮助信息 */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>如需帮助，请联系客服</p>
              <p className="mt-1">邮箱: support@example.com</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

