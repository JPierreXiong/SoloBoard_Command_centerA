/**
 * SoloBoard 管理员仪表板内容组件
 * 
 * 功能:
 * - 统计卡片
 * - 站点列表表格
 * - 使用量图表
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { 
  Globe, 
  Users, 
  RefreshCw, 
  AlertCircle, 
  Search,
  Trash2,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalSites: number;
  activeUsers: number;
  todaySyncs: number;
  errorSites: number;
  syncSuccessRate: number;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  platform: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  userName: string;
  userEmail: string;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SoloBoardAdminContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesByPlan, setSitesByPlan] = useState<any[]>([]);
  const [sitesByPlatform, setSitesByPlatform] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/soloboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
      setSitesByPlan(data.sitesByPlan);
      setSitesByPlatform(data.sitesByPlatform);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  // 加载站点列表
  const loadSites = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);

      const response = await fetch(`/api/admin/soloboard/sites?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.sites);
    } catch (error) {
      console.error('Failed to load sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  // 删除站点
  const deleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const response = await fetch(`/api/admin/soloboard/sites/${siteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete site');
      toast.success('Site deleted successfully');
      loadSites();
      loadStats();
    } catch (error) {
      console.error('Failed to delete site:', error);
      toast.error('Failed to delete site');
    }
  };

  useEffect(() => {
    loadStats();
    loadSites();
  }, []);

  useEffect(() => {
    loadSites();
  }, [search, statusFilter, platformFilter]);

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          label="Total Sites"
          value={stats.totalSites.toString()}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers.toString()}
          color="green"
        />
        <StatCard
          icon={RefreshCw}
          label="Today's Syncs"
          value={stats.todaySyncs.toString()}
          color="purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Error Sites"
          value={stats.errorSites.toString()}
          color={stats.errorSites > 0 ? 'red' : 'green'}
        />
      </div>

      {/* 同步成功率 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sync Success Rate (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-green-600">
              {stats.syncSuccessRate}%
            </div>
            <div className="flex-1 bg-muted rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ width: `${stats.syncSuccessRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 按套餐统计 */}
        <Card>
          <CardHeader>
            <CardTitle>Sites by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sitesByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 按平台统计 */}
        <Card>
          <CardHeader>
            <CardTitle>Sites by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sitesByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.platform}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sitesByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>All Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="UPTIME">Uptime</SelectItem>
                <SelectItem value="SHOPIFY">Shopify</SelectItem>
                <SelectItem value="GA4">GA4</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 站点表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : sites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sites found
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{site.name}</div>
                          <div className="text-sm text-muted-foreground">{site.domain}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{site.userName}</div>
                          <div className="text-sm text-muted-foreground">{site.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{site.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            site.lastSyncStatus === 'success'
                              ? 'default'
                              : site.lastSyncStatus === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {site.lastSyncStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {site.lastSyncAt
                          ? new Date(site.lastSyncAt).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(site.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/soloboard/${site.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSite(site.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-orange-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





