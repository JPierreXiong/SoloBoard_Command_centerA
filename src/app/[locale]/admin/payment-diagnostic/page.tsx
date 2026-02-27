/**
 * 支付状态诊断和修复工具
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Search, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Database,
  User,
  CreditCard,
} from 'lucide-react';

export default function PaymentDiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [orderNo, setOrderNo] = useState('ORD-19C8E9D935F268BE');
  const [userId, setUserId] = useState('');
  const [fixResult, setFixResult] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    setReport(null);
    try {
      const params = new URLSearchParams();
      if (orderNo) params.append('orderNo', orderNo);
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/admin/check-payment-status?${params}`);
      const data = await response.json();
      setReport(data);
    } catch (error: any) {
      console.error('检查失败:', error);
      alert('检查失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixPayment = async (orderNo: string) => {
    if (!confirm(`确定要修复订单 ${orderNo} 吗？`)) {
      return;
    }

    setLoading(true);
    setFixResult(null);
    try {
      const response = await fetch('/api/admin/fix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo }),
      });
      const data = await response.json();
      setFixResult(data);
      
      if (data.success) {
        alert('修复成功！');
        // 重新检查状态
        await checkStatus();
      } else {
        alert('修复失败: ' + data.error);
      }
    } catch (error: any) {
      console.error('修复失败:', error);
      alert('修复失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">支付状态诊断工具</h1>
        <p className="text-muted-foreground mt-2">
          检查和修复支付后订阅未创建的问题
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            查询条件
          </CardTitle>
          <CardDescription>
            输入订单号或用户ID来检查支付状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNo">订单号</Label>
              <Input
                id="orderNo"
                placeholder="ORD-19C8E9D935F268BE"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">用户ID（可选）</Label>
              <Input
                id="userId"
                placeholder="user_xxx"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={checkStatus} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                检查中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                开始检查
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">
              <Database className="h-4 w-4 mr-2" />
              概览
            </TabsTrigger>
            <TabsTrigger value="orders">
              <CreditCard className="h-4 w-4 mr-2" />
              订单
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              订阅
            </TabsTrigger>
            <TabsTrigger value="issues">
              <AlertTriangle className="h-4 w-4 mr-2" />
              问题 ({report.issues?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>系统概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">总订单数</p>
                    <p className="text-2xl font-bold">{report.summary?.totalOrders || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">已支付</p>
                    <p className="text-2xl font-bold text-green-600">{report.summary?.paidOrders || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">总订阅数</p>
                    <p className="text-2xl font-bold">{report.summary?.totalSubscriptions || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">活跃订阅</p>
                    <p className="text-2xl font-bold text-blue-600">{report.summary?.activeSubscriptions || 0}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">诊断结果</h3>
                  <Alert variant={report.issues?.length > 0 ? 'destructive' : 'default'}>
                    <AlertTitle className="flex items-center gap-2">
                      {report.issues?.length > 0 ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          发现问题
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          正常
                        </>
                      )}
                    </AlertTitle>
                    <AlertDescription>{report.diagnosis}</AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {report.orders?.map((order: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.orderNo}</CardTitle>
                    <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">金额:</span>{' '}
                      <span className="font-semibold">{order.amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">用户:</span>{' '}
                      <span className="font-mono text-xs">{order.userId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">支付时间:</span>{' '}
                      <span>{order.paidAt || '未支付'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">用户计划:</span>{' '}
                      <Badge variant="outline">{order.userPlanType || 'N/A'}</Badge>
                    </div>
                  </div>

                  {order.status === 'paid' && !order.hasSubscription && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>问题</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>订单已支付但未创建订阅</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fixPayment(order.orderNo)}
                          disabled={loading}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          立即修复
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {order.hasSubscription && (
                    <Alert className="mt-4">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>正常</AlertTitle>
                      <AlertDescription>
                        订阅状态: {order.subscriptionStatus}, 计划: {order.subscriptionPlan}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            {report.subscriptions?.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>无订阅记录</AlertTitle>
                <AlertDescription>
                  数据库中没有任何订阅记录
                </AlertDescription>
              </Alert>
            ) : (
              report.subscriptions?.map((sub: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{sub.subscriptionNo}</CardTitle>
                      <Badge>{sub.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">计划:</span>{' '}
                        <span className="font-semibold">{sub.planName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">金额:</span>{' '}
                        <span className="font-semibold">{sub.amount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">周期开始:</span>{' '}
                        <span>{new Date(sub.currentPeriodStart).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">周期结束:</span>{' '}
                        <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {report.issues?.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>没有发现问题</AlertTitle>
                <AlertDescription>
                  所有订单和订阅状态正常
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {report.issues?.map((issue: any, index: number) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{issue.type}</AlertTitle>
                    <AlertDescription>
                      <p>{issue.message}</p>
                      <p className="mt-2 text-xs">
                        订单: {issue.orderNo} | 用户: {issue.userId}
                      </p>
                    </AlertDescription>
                  </Alert>
                ))}

                {report.recommendations?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>修复建议</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {report.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <p className="font-semibold">{rec.issue}</p>
                          <p className="text-sm text-muted-foreground">{rec.solution}</p>
                          <code className="block bg-muted p-2 rounded text-xs">
                            {rec.action}
                          </code>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {fixResult && (
        <Alert variant={fixResult.success ? 'default' : 'destructive'}>
          <AlertTitle className="flex items-center gap-2">
            {fixResult.success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                修复成功
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                修复失败
              </>
            )}
          </AlertTitle>
          <AlertDescription>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(fixResult, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

