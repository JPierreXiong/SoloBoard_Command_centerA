/**
 * Email Alert Service
 * 邮件告警服务 - 网站宕机、无销售、流量骤降
 */

// 动态导入 Resend，避免构建时初始化
let ResendClass: any = null;
let resend: any = null;

async function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    try {
      if (!ResendClass) {
        const { Resend } = await import('resend');
        ResendClass = Resend;
      }
      resend = new ResendClass(process.env.RESEND_API_KEY);
    } catch (error) {
      console.error('Failed to initialize Resend:', error);
      return null;
    }
  }
  return resend;
}

export interface AlertConfig {
  userId: string;
  userEmail: string;
  userName?: string;
  siteName: string;
  siteUrl: string;
  alertType: 'downtime' | 'no_sales' | 'traffic_drop';
  details: {
    // For downtime
    lastChecked?: string;
    errorMessage?: string;
    
    // For no sales
    avgRevenue7d?: number;
    lastSaleDate?: string;
    
    // For traffic drop
    todayVisitors?: number;
    avgVisitors7d?: number;
    dropPercentage?: number;
  };
}

/**
 * 发送网站宕机告警
 */
export async function sendDowntimeAlert(config: AlertConfig) {
  const { userEmail, userName, siteName, siteUrl, details } = config;
  
  const resendClient = await getResend();
  if (!resendClient) {
    console.warn('⚠️ Resend API key not configured, skipping email alert');
    return { success: false, error: 'Resend not configured' };
  }
  
  try {
    await resendClient.emails.send({
      from: 'SoloBoard Alerts <alerts@soloboard.com>',
      to: userEmail,
      subject: `🚨 ${siteName} is DOWN!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚨 Website Down Alert</h1>
              
              <p>Hi ${userName || 'there'},</p>
              
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #dc2626;">Your website is offline!</h2>
                <p><strong>Site:</strong> ${siteName}</p>
                <p><strong>URL:</strong> <a href="${siteUrl}">${siteUrl}</a></p>
                <p><strong>Last Checked:</strong> ${details.lastChecked || 'Just now'}</p>
                ${details.errorMessage ? `<p><strong>Error:</strong> ${details.errorMessage}</p>` : ''}
              </div>
              
              <p>We detected that your website is not responding. This could mean:</p>
              <ul>
                <li>Your server is down</li>
                <li>DNS issues</li>
                <li>Network connectivity problems</li>
                <li>Hosting provider issues</li>
              </ul>
              
              <a href="${siteUrl}" class="button">Check Your Site</a>
              
              <div class="footer">
                <p>You're receiving this because you enabled monitoring for ${siteName}.</p>
                <p><a href="https://soloboard.com/settings/notifications">Manage alert settings</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`✅ Downtime alert sent to ${userEmail} for ${siteName}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send downtime alert:`, error);
    return { success: false, error };
  }
}

/**
 * 发送无销售告警
 */
export async function sendNoSalesAlert(config: AlertConfig) {
  const { userEmail, userName, siteName, siteUrl, details } = config;
  
  const resendClient = await getResend();
  if (!resendClient) {
    console.warn('⚠️ Resend API key not configured, skipping email alert');
    return { success: false, error: 'Resend not configured' };
  }
  
  try {
    await resendClient.emails.send({
      from: 'SoloBoard Alerts <alerts@soloboard.com>',
      to: userEmail,
      subject: `⚠️ No sales today on ${siteName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ No Sales Alert</h1>
              
              <p>Hi ${userName || 'there'},</p>
              
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #f59e0b;">No sales detected today</h2>
                <p><strong>Site:</strong> ${siteName}</p>
                <p><strong>7-day average:</strong> $${(details.avgRevenue7d || 0).toFixed(2)}/day</p>
                ${details.lastSaleDate ? `<p><strong>Last sale:</strong> ${details.lastSaleDate}</p>` : ''}
              </div>
              
              <p>Your site usually makes sales by this time. Here are some things to check:</p>
              <ul>
                <li>Is your payment gateway working?</li>
                <li>Are there any checkout errors?</li>
                <li>Is your site loading properly?</li>
                <li>Any recent changes that might affect conversions?</li>
              </ul>
              
              <a href="${siteUrl}" class="button">Check Your Site</a>
              
              <div class="footer">
                <p>You're receiving this because you enabled revenue monitoring for ${siteName}.</p>
                <p><a href="https://soloboard.com/settings/notifications">Manage alert settings</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`✅ No sales alert sent to ${userEmail} for ${siteName}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send no sales alert:`, error);
    return { success: false, error };
  }
}

/**
 * 发送流量骤降告警
 */
export async function sendTrafficDropAlert(config: AlertConfig) {
  const { userEmail, userName, siteName, siteUrl, details } = config;
  
  const resendClient = await getResend();
  if (!resendClient) {
    console.warn('⚠️ Resend API key not configured, skipping email alert');
    return { success: false, error: 'Resend not configured' };
  }
  
  try {
    await resendClient.emails.send({
      from: 'SoloBoard Alerts <alerts@soloboard.com>',
      to: userEmail,
      subject: `📉 Traffic drop detected on ${siteName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📉 Traffic Drop Alert</h1>
              
              <p>Hi ${userName || 'there'},</p>
              
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #f59e0b;">Unusual traffic drop detected</h2>
                <p><strong>Site:</strong> ${siteName}</p>
                <p><strong>Today's visitors:</strong> ${details.todayVisitors || 0}</p>
                <p><strong>7-day average:</strong> ${Math.round(details.avgVisitors7d || 0)}</p>
                <p><strong>Drop:</strong> ${details.dropPercentage || 0}% below average</p>
              </div>
              
              <p>Your traffic is significantly lower than usual. Possible causes:</p>
              <ul>
                <li>SEO ranking changes</li>
                <li>Marketing campaign ended</li>
                <li>Technical issues affecting discoverability</li>
                <li>Seasonal variations</li>
              </ul>
              
              <a href="${siteUrl}" class="button">Check Your Site</a>
              
              <div class="footer">
                <p>You're receiving this because you enabled traffic monitoring for ${siteName}.</p>
                <p><a href="https://soloboard.com/settings/notifications">Manage alert settings</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`✅ Traffic drop alert sent to ${userEmail} for ${siteName}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send traffic drop alert:`, error);
    return { success: false, error };
  }
}

/**
 * 统一的告警发送接口
 */
export async function sendAlert(config: AlertConfig) {
  switch (config.alertType) {
    case 'downtime':
      return sendDowntimeAlert(config);
    case 'no_sales':
      return sendNoSalesAlert(config);
    case 'traffic_drop':
      return sendTrafficDropAlert(config);
    default:
      console.error(`Unknown alert type: ${config.alertType}`);
      return { success: false, error: 'Unknown alert type' };
  }
}

