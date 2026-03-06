/**
 * Email Alert Service - 邮件提醒服务
 * 
 * 用途：使用 Resend 发送提醒邮件
 * 不改变 ShipAny 结构，仅扩展功能
 */

import { Resend } from 'resend';
import { AlertType } from './alert-service';

// 延迟初始化 Resend（避免构建时错误）
let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alerts@soloboard.com';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'SoloBoard Alerts';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

interface AlertEmailData {
  type: AlertType;
  siteName: string;
  domain: string;
  userEmail: string;
  data: {
    todayValue?: number;
    avgValue?: number;
    changePercentage?: number;
    lastChecked?: string;
    [key: string]: any;
  };
}

interface SendAlertConfig {
  userId: string;
  userEmail: string;
  userName?: string;
  siteName: string;
  siteUrl: string;
  alertType: 'site_down' | 'no_sales' | 'low_traffic' | 'revenue_drop';
  details: {
    lastChecked?: string;
    errorMessage?: string;
    avgRevenue7d?: number;
    todayVisitors?: number;
    avgVisitors7d?: number;
    dropPercentage?: number;
    [key: string]: any;
  };
}

/**
 * 发送告警邮件（统一接口）
 */
export async function sendAlert(config: SendAlertConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn('Resend client not initialized. Skipping email alert.');
      return { success: false, error: 'Resend not configured' };
    }

    let subject: string;
    let html: string;
    
    const emailData: AlertEmailData = {
      type: config.alertType as AlertType,
      siteName: config.siteName,
      domain: config.siteUrl,
      userEmail: config.userEmail,
      data: config.details,
    };

    switch (config.alertType) {
      case 'site_down':
        subject = `🔴 Alert: ${config.siteName} is offline`;
        html = getOfflineEmailTemplate(emailData);
        break;
      
      case 'revenue_drop':
        subject = `📉 Alert: Revenue drop detected on ${config.siteName}`;
        html = getRevenueDropEmailTemplate(emailData);
        break;
      
      case 'low_traffic':
        subject = `📉 Alert: Traffic drop on ${config.siteName}`;
        html = getTrafficSpikeEmailTemplate(emailData);
        break;
      
      case 'no_sales':
        subject = `⚠️ Alert: No sales today on ${config.siteName}`;
        html = getNoSalesEmailTemplate(emailData);
        break;
      
      default:
        console.error(`Unknown alert type: ${config.alertType}`);
        return { success: false, error: 'Unknown alert type' };
    }

    const result = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: config.userEmail,
      subject: subject,
      html: html,
    });

    if (result.error) {
      console.error('Failed to send alert email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Alert email sent: ${result.data?.id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 发送提醒邮件
 */
export async function sendAlertEmail(
  rule: any,
  site: any
): Promise<void> {
  try {
    const emailData: AlertEmailData = {
      type: rule.type,
      siteName: site.name,
      domain: site.domain,
      userEmail: site.userEmail || 'user@example.com', // TODO: 从 user 表获取
      data: {},
    };
    
    // 根据提醒类型选择模板
    let subject: string;
    let html: string;
    
    switch (rule.type) {
      case AlertType.OFFLINE:
        subject = `🔴 Alert: ${site.name} is offline`;
        html = getOfflineEmailTemplate(emailData);
        break;
      
      case AlertType.REVENUE_DROP:
        subject = `📉 Alert: Revenue drop detected on ${site.name}`;
        html = getRevenueDropEmailTemplate(emailData);
        break;
      
      case AlertType.TRAFFIC_SPIKE:
        subject = `📈 Alert: Traffic spike on ${site.name}`;
        html = getTrafficSpikeEmailTemplate(emailData);
        break;
      
      case AlertType.NO_SALES:
        subject = `⚠️ Alert: No sales today on ${site.name}`;
        html = getNoSalesEmailTemplate(emailData);
        break;
      
      default:
        console.error(`Unknown alert type: ${rule.type}`);
        return;
    }
    
    // 发送邮件
    const client = getResendClient();
    if (!client) {
      console.error('Resend client not initialized. Please set RESEND_API_KEY.');
      return;
    }
    
    const result = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: emailData.userEmail,
      subject: subject,
      html: html,
    });
    
    if (result.error) {
      console.error('Failed to send alert email:', result.error);
    } else {
      console.log(`Alert email sent: ${result.data?.id}`);
    }
  } catch (error) {
    console.error('Failed to send alert email:', error);
    throw error;
  }
}

/**
 * 网站离线邮件模板
 */
function getOfflineEmailTemplate(data: AlertEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Offline Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #fff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .alert-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 20px;
    }
    .info-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #6b7280;
      width: 40%;
    }
    .status-offline {
      color: #ef4444;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔴 Website Offline Alert</h1>
  </div>
  
  <div class="content">
    <div class="alert-icon">⚠️</div>
    
    <h2>Your website is offline</h2>
    <p><strong>${data.siteName}</strong> (${data.domain}) is currently unreachable.</p>
    
    <table class="info-table">
      <tr>
        <td>Status:</td>
        <td class="status-offline">Offline</td>
      </tr>
      <tr>
        <td>Last Checked:</td>
        <td>${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td>Response:</td>
        <td>Timeout / Connection Failed</td>
      </tr>
    </table>
    
    <p><strong>What to do:</strong></p>
    <ul>
      <li>Check your hosting provider status</li>
      <li>Verify DNS settings</li>
      <li>Check server logs for errors</li>
      <li>Contact your hosting support if needed</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/soloboard" class="button">View Dashboard</a>
    </center>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you enabled offline alerts for ${data.siteName}.</p>
    <p><a href="${APP_URL}/soloboard/settings/alerts">Manage Alert Settings</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * 收入下降邮件模板
 */
function getRevenueDropEmailTemplate(data: AlertEmailData): string {
  const todayRevenue = (data.data.todayValue || 0) / 100;
  const avgRevenue = (data.data.avgValue || 0) / 100;
  const dropPercentage = data.data.changePercentage || 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revenue Drop Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #fff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .metric-card {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #d97706;
      margin: 10px 0;
    }
    .metric-label {
      color: #92400e;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .comparison {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .comparison-item {
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📉 Revenue Drop Detected</h1>
  </div>
  
  <div class="content">
    <h2>Revenue is lower than usual</h2>
    <p>Today's revenue on <strong>${data.siteName}</strong> is significantly below your 7-day average.</p>
    
    <div class="metric-card">
      <div class="metric-label">Revenue Drop</div>
      <div class="metric-value">-${dropPercentage.toFixed(1)}%</div>
    </div>
    
    <div class="comparison">
      <div class="comparison-item">
        <div style="color: #6b7280; font-size: 14px;">Today's Revenue</div>
        <div style="font-size: 24px; font-weight: bold; color: #ef4444;">$${todayRevenue.toFixed(2)}</div>
      </div>
      <div class="comparison-item">
        <div style="color: #6b7280; font-size: 14px;">7-Day Average</div>
        <div style="font-size: 24px; font-weight: bold;">$${avgRevenue.toFixed(2)}</div>
      </div>
    </div>
    
    <p><strong>Possible reasons:</strong></p>
    <ul>
      <li>Seasonal fluctuation</li>
      <li>Marketing campaign ended</li>
      <li>Technical issues affecting checkout</li>
      <li>Increased competition</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/soloboard" class="button">View Detailed Analytics</a>
    </center>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you enabled revenue alerts for ${data.siteName}.</p>
    <p><a href="${APP_URL}/soloboard/settings/alerts">Manage Alert Settings</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * 流量激增邮件模板
 */
function getTrafficSpikeEmailTemplate(data: AlertEmailData): string {
  const todayVisitors = data.data.todayValue || 0;
  const avgVisitors = data.data.avgValue || 0;
  const increasePercentage = data.data.changePercentage || 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traffic Spike Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #fff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .metric-card {
      background: #d1fae5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #059669;
      margin: 10px 0;
    }
    .metric-label {
      color: #065f46;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .comparison {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .comparison-item {
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📈 Traffic Spike Detected</h1>
  </div>
  
  <div class="content">
    <h2>Your website is getting more traffic!</h2>
    <p><strong>${data.siteName}</strong> is experiencing unusually high traffic today.</p>
    
    <div class="metric-card">
      <div class="metric-label">Traffic Increase</div>
      <div class="metric-value">+${increasePercentage.toFixed(1)}%</div>
    </div>
    
    <div class="comparison">
      <div class="comparison-item">
        <div style="color: #6b7280; font-size: 14px;">Current Visitors</div>
        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${todayVisitors.toLocaleString()}</div>
      </div>
      <div class="comparison-item">
        <div style="color: #6b7280; font-size: 14px;">7-Day Average</div>
        <div style="font-size: 24px; font-weight: bold;">${avgVisitors.toLocaleString()}</div>
      </div>
    </div>
    
    <p><strong>What this could mean:</strong></p>
    <ul>
      <li>🎉 Viral content or social media mention</li>
      <li>📰 Press coverage or backlink from popular site</li>
      <li>🚀 Successful marketing campaign</li>
      <li>⚠️ Make sure your server can handle the load</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/soloboard" class="button">View Real-Time Analytics</a>
    </center>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you enabled traffic alerts for ${data.siteName}.</p>
    <p><a href="${APP_URL}/soloboard/settings/alerts">Manage Alert Settings</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * 无销售邮件模板
 */
function getNoSalesEmailTemplate(data: AlertEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>No Sales Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #fff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ No Sales Today</h1>
  </div>
  
  <div class="content">
    <h2>No sales recorded today</h2>
    <p><strong>${data.siteName}</strong> usually has sales, but none have been recorded today.</p>
    
    <div class="alert-box">
      <p style="margin: 0; font-size: 18px;"><strong>Today's Revenue: $0.00</strong></p>
    </div>
    
    <p><strong>Things to check:</strong></p>
    <ul>
      <li>Is your payment gateway working correctly?</li>
      <li>Are there any checkout errors?</li>
      <li>Is your website loading properly?</li>
      <li>Check for any technical issues</li>
      <li>Review your marketing campaigns</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/soloboard" class="button">Check Dashboard</a>
    </center>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you enabled sales alerts for ${data.siteName}.</p>
    <p><a href="${APP_URL}/soloboard/settings/alerts">Manage Alert Settings</a></p>
  </div>
</body>
</html>
  `;
}
