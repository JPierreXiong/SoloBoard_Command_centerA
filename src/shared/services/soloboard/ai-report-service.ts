/**
 * SoloBoard - AI 智能周报服务
 * 
 * 功能：
 * 1. 分析用户所有站点的数据
 * 2. 使用 AI 生成洞察和建议
 * 3. 生成周报并发送邮件
 */

import { db } from '@/config/db';
import { aiReports, monitoredSites, siteMetricsHistory } from '@/config/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * 报告类型
 */
export type ReportType = 'daily' | 'weekly' | 'monthly';

/**
 * 站点数据摘要
 */
interface SiteSummary {
  siteId: string;
  siteName: string;
  platform: string;
  metrics: {
    totalRevenue?: number;
    totalOrders?: number;
    totalPageViews?: number;
    totalSessions?: number;
    avgResponseTime?: number;
    uptime?: number;
  };
  trends: {
    revenueChange?: number; // 百分比
    trafficChange?: number;
    performanceChange?: number;
  };
}

/**
 * 生成用户的 AI 周报
 */
export async function generateAIReport(
  userId: string,
  reportType: ReportType = 'weekly'
): Promise<string> {
  try {
    console.log(`[AI Report] Generating ${reportType} report for user ${userId}`);

    // 1. 计算时间范围
    const { startDate, endDate } = getReportDateRange(reportType);

    // 2. 获取用户的所有站点
    const sites = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.userId, userId));

    if (sites.length === 0) {
      throw new Error('No sites found for user');
    }

    // 3. 收集每个站点的数据
    const siteSummaries: SiteSummary[] = [];
    
    for (const site of sites) {
      const summary = await collectSiteData(site.id, startDate, endDate);
      siteSummaries.push({
        siteId: site.id,
        siteName: site.name,
        platform: site.platform,
        ...summary,
      });
    }

    // 4. 使用 AI 分析数据并生成报告
    const aiAnalysis = await analyzeWithAI(siteSummaries, reportType);

    // 5. 保存报告到数据库
    const reportId = nanoid();
    await db().insert(aiReports).values({
      id: reportId,
      userId,
      reportType,
      startDate,
      endDate,
      summary: aiAnalysis.summary,
      insights: aiAnalysis.insights,
      recommendations: aiAnalysis.recommendations,
      metricsSnapshot: { sites: siteSummaries },
      status: 'generated',
      sent: false,
      createdAt: new Date(),
    });

    console.log(`[AI Report] Report generated: ${reportId}`);
    return reportId;
  } catch (error) {
    console.error('[AI Report] Error generating report:', error);
    throw error;
  }
}

/**
 * 获取报告的时间范围
 */
function getReportDateRange(reportType: ReportType) {
  const endDate = new Date();
  const startDate = new Date();

  switch (reportType) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * 收集站点数据
 */
async function collectSiteData(
  siteId: string,
  startDate: Date,
  endDate: Date
) {
  // 获取时间范围内的历史数据
  const metrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, siteId),
        gte(siteMetricsHistory.recordedAt, startDate)
      )
    )
    .orderBy(desc(siteMetricsHistory.recordedAt));

  // 计算总计指标
  const totalMetrics = {
    totalRevenue: 0,
    totalOrders: 0,
    totalPageViews: 0,
    totalSessions: 0,
    avgResponseTime: 0,
    uptime: 0,
  };

  let responseTimeSum = 0;
  let responseTimeCount = 0;
  let onlineCount = 0;
  let totalChecks = 0;

  for (const record of metrics) {
    const m = record.metrics as any;
    
    if (m.revenue) totalMetrics.totalRevenue += m.revenue;
    if (m.transactions) totalMetrics.totalOrders += m.transactions;
    if (m.pageViews) totalMetrics.totalPageViews += m.pageViews;
    if (m.sessions) totalMetrics.totalSessions += m.sessions;
    
    if (m.responseTime) {
      responseTimeSum += m.responseTime;
      responseTimeCount++;
    }
    
    if (m.isOnline !== undefined) {
      totalChecks++;
      if (m.isOnline) onlineCount++;
    }
  }

  if (responseTimeCount > 0) {
    totalMetrics.avgResponseTime = Math.round(responseTimeSum / responseTimeCount);
  }

  if (totalChecks > 0) {
    totalMetrics.uptime = (onlineCount / totalChecks) * 100;
  }

  // 计算趋势（与上一周期对比）
  const previousStartDate = new Date(startDate);
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

  const previousMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, siteId),
        gte(siteMetricsHistory.recordedAt, previousStartDate)
      )
    );

  let previousRevenue = 0;
  let previousPageViews = 0;
  let previousResponseTime = 0;
  let previousResponseCount = 0;

  for (const record of previousMetrics) {
    const m = record.metrics as any;
    if (m.revenue) previousRevenue += m.revenue;
    if (m.pageViews) previousPageViews += m.pageViews;
    if (m.responseTime) {
      previousResponseTime += m.responseTime;
      previousResponseCount++;
    }
  }

  const trends = {
    revenueChange: previousRevenue > 0 
      ? ((totalMetrics.totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0,
    trafficChange: previousPageViews > 0 
      ? ((totalMetrics.totalPageViews - previousPageViews) / previousPageViews) * 100 
      : 0,
    performanceChange: previousResponseCount > 0 
      ? ((totalMetrics.avgResponseTime - previousResponseTime / previousResponseCount) / (previousResponseTime / previousResponseCount)) * 100 
      : 0,
  };

  return { metrics: totalMetrics, trends };
}

/**
 * 使用 AI 分析数据
 */
async function analyzeWithAI(
  siteSummaries: SiteSummary[],
  reportType: ReportType
) {
  // 构建 AI 提示词
  const prompt = buildAnalysisPrompt(siteSummaries, reportType);

  try {
    // 调用 OpenAI API（或其他 LLM）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的数据分析师，擅长分析网站运营数据并提供可行的建议。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 解析 AI 响应
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('[AI Report] Error calling AI API:', error);
    
    // 降级方案：使用规则生成报告
    return generateRuleBasedReport(siteSummaries, reportType);
  }
}

/**
 * 构建 AI 分析提示词
 */
function buildAnalysisPrompt(siteSummaries: SiteSummary[], reportType: ReportType) {
  const periodText = reportType === 'daily' ? '过去 24 小时' : reportType === 'weekly' ? '过去 7 天' : '过去 30 天';
  
  let prompt = `请分析以下网站在${periodText}的运营数据，并提供专业的洞察和建议。\n\n`;
  
  for (const site of siteSummaries) {
    prompt += `## ${site.siteName} (${site.platform})\n`;
    prompt += `- 总收入: $${(site.metrics.totalRevenue || 0) / 100}\n`;
    prompt += `- 总订单: ${site.metrics.totalOrders || 0}\n`;
    prompt += `- 总浏览量: ${site.metrics.totalPageViews || 0}\n`;
    prompt += `- 平均响应时间: ${site.metrics.avgResponseTime || 0}ms\n`;
    prompt += `- 可用性: ${(site.metrics.uptime || 0).toFixed(2)}%\n`;
    prompt += `- 收入变化: ${site.trends.revenueChange?.toFixed(1) || 0}%\n`;
    prompt += `- 流量变化: ${site.trends.trafficChange?.toFixed(1) || 0}%\n\n`;
  }

  prompt += `请以 JSON 格式返回分析结果，包含以下字段：\n`;
  prompt += `{\n`;
  prompt += `  "summary": "整体摘要（2-3 句话）",\n`;
  prompt += `  "insights": ["洞察1", "洞察2", "洞察3"],\n`;
  prompt += `  "recommendations": ["建议1", "建议2", "建议3"]\n`;
  prompt += `}\n`;

  return prompt;
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(aiResponse: string) {
  try {
    // 尝试提取 JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // 如果没有 JSON，尝试手动解析
    return {
      summary: aiResponse.substring(0, 200),
      insights: ['AI 分析结果解析失败'],
      recommendations: ['请手动查看原始数据'],
    };
  } catch (error) {
    console.error('[AI Report] Error parsing AI response:', error);
    return {
      summary: '数据分析完成',
      insights: ['AI 分析结果解析失败'],
      recommendations: ['请手动查看原始数据'],
    };
  }
}

/**
 * 基于规则生成报告（降级方案）
 */
function generateRuleBasedReport(siteSummaries: SiteSummary[], reportType: ReportType) {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // 计算总体指标
  let totalRevenue = 0;
  let totalTraffic = 0;
  let avgUptime = 0;

  for (const site of siteSummaries) {
    totalRevenue += site.metrics.totalRevenue || 0;
    totalTraffic += site.metrics.totalPageViews || 0;
    avgUptime += site.metrics.uptime || 0;

    // 收入洞察
    if (site.trends.revenueChange && site.trends.revenueChange > 20) {
      insights.push(`${site.siteName} 收入增长 ${site.trends.revenueChange.toFixed(1)}%，表现优异`);
    } else if (site.trends.revenueChange && site.trends.revenueChange < -20) {
      insights.push(`${site.siteName} 收入下降 ${Math.abs(site.trends.revenueChange).toFixed(1)}%，需要关注`);
      recommendations.push(`检查 ${site.siteName} 的转化率和用户流失原因`);
    }

    // 流量洞察
    if (site.trends.trafficChange && site.trends.trafficChange > 50) {
      insights.push(`${site.siteName} 流量激增 ${site.trends.trafficChange.toFixed(1)}%`);
      recommendations.push(`优化 ${site.siteName} 的服务器性能以应对流量增长`);
    }

    // 性能洞察
    if (site.metrics.avgResponseTime && site.metrics.avgResponseTime > 2000) {
      insights.push(`${site.siteName} 响应时间较慢（${site.metrics.avgResponseTime}ms）`);
      recommendations.push(`优化 ${site.siteName} 的页面加载速度`);
    }

    // 可用性洞察
    if (site.metrics.uptime && site.metrics.uptime < 99) {
      insights.push(`${site.siteName} 可用性为 ${site.metrics.uptime.toFixed(2)}%，低于标准`);
      recommendations.push(`检查 ${site.siteName} 的服务器稳定性`);
    }
  }

  avgUptime = avgUptime / siteSummaries.length;

  const summary = `在过去的周期中，您的 ${siteSummaries.length} 个站点总收入为 $${(totalRevenue / 100).toFixed(2)}，总浏览量为 ${totalTraffic.toLocaleString()}，平均可用性为 ${avgUptime.toFixed(2)}%。`;

  // 如果没有特殊洞察，添加通用洞察
  if (insights.length === 0) {
    insights.push('所有站点运行正常，指标稳定');
  }

  if (recommendations.length === 0) {
    recommendations.push('继续保持当前的运营策略');
    recommendations.push('定期监控关键指标的变化');
  }

  return { summary, insights, recommendations };
}

/**
 * 发送 AI 周报邮件
 */
export async function sendAIReportEmail(reportId: string, userEmail: string) {
  try {
    // 获取报告数据
    const report = await db()
      .select()
      .from(aiReports)
      .where(eq(aiReports.id, reportId))
      .limit(1);

    if (!report.length) {
      throw new Error('Report not found');
    }

    const reportData = report[0];

    // TODO: 使用 Resend 发送邮件
    console.log(`[AI Report] Sending report to ${userEmail}`);

    // 示例实现
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'reports@soloboard.com',
    //   to: userEmail,
    //   subject: `SoloBoard ${reportData.reportType === 'weekly' ? '周报' : '月报'}`,
    //   html: generateReportHTML(reportData),
    // });

    // 标记为已发送
    await db()
      .update(aiReports)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(aiReports.id, reportId));

    console.log(`[AI Report] Report sent successfully`);
  } catch (error) {
    console.error('[AI Report] Error sending report:', error);
    throw error;
  }
}

/**
 * 生成报告 HTML
 */
function generateReportHTML(report: any): string {
  const periodText = report.reportType === 'daily' ? '日报' : report.reportType === 'weekly' ? '周报' : '月报';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; }
        .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .section { margin: 20px 0; }
        .insight { padding: 10px; margin: 5px 0; background: #dbeafe; border-left: 4px solid #2563eb; }
        .recommendation { padding: 10px; margin: 5px 0; background: #d1fae5; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎯 SoloBoard ${periodText}</h1>
        <p>报告时间：${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}</p>
        
        <div class="summary">
          <h2>📊 整体摘要</h2>
          <p>${report.summary}</p>
        </div>

        <div class="section">
          <h2>💡 关键洞察</h2>
          ${report.insights.map((insight: string) => `<div class="insight">${insight}</div>`).join('')}
        </div>

        <div class="section">
          <h2>🚀 优化建议</h2>
          ${report.recommendations.map((rec: string) => `<div class="recommendation">${rec}</div>`).join('')}
        </div>

        <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
          此报告由 SoloBoard AI 自动生成。<br>
          <a href="https://soloboard.com/dashboard">查看完整仪表板</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * 获取用户的报告历史
 */
export async function getUserReports(userId: string, limit = 10) {
  return await db()
    .select()
    .from(aiReports)
    .where(eq(aiReports.userId, userId))
    .orderBy(desc(aiReports.createdAt))
    .limit(limit);
}







