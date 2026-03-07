/**
 * Tracking Script 生成 API
 * GET /api/soloboard/sites/[siteId]/tracking-script
 * 
 * 功能:
 * 1. 生成唯一的 tracking script ID
 * 2. 返回可复制的 JS 代码
 * 3. 提供安装说明
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // 1. 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { siteId } = params;

    // 2. 查询站点信息
    const sites = await db()
      .select()
      .from(monitoredSites)
      .where(
        and(
          eq(monitoredSites.id, siteId),
          eq(monitoredSites.userId, session.user.id)
        )
      )
      .limit(1);

    if (!sites || sites.length === 0) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const site = sites[0];

    // 3. 生成或获取 tracking script ID
    let trackingScriptId = site.trackingScriptId;
    
    if (!trackingScriptId) {
      trackingScriptId = nanoid(16);
      
      // 更新数据库
      await db()
        .update(monitoredSites)
        .set({
          trackingScriptId,
          trackingScriptEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(monitoredSites.id, siteId));
    }

    // 4. 生成 tracking script
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soloboard.app';
    
    const trackingScript = `<!-- SoloBoard Tracking Script -->
<script>
(function() {
  'use strict';
  
  // 配置
  var config = {
    siteId: '${trackingScriptId}',
    endpoint: '${appUrl}/api/track',
    debug: false
  };
  
  // 发送追踪数据
  function track() {
    try {
      var data = {
        site_id: config.siteId,
        url: window.location.href,
        referrer: document.referrer || '',
        user_agent: navigator.userAgent,
        screen: window.screen.width + 'x' + window.screen.height,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };
      
      // 使用 sendBeacon (更可靠)
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(config.endpoint, blob);
      } else {
        // 降级到 fetch
        fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(function(err) {
          if (config.debug) console.error('SoloBoard tracking error:', err);
        });
      }
    } catch (err) {
      if (config.debug) console.error('SoloBoard tracking error:', err);
    }
  }
  
  // 页面加载时追踪
  if (document.readyState === 'complete') {
    track();
  } else {
    window.addEventListener('load', track);
  }
  
  // SPA 路由变化追踪 (可选)
  var pushState = history.pushState;
  history.pushState = function() {
    pushState.apply(history, arguments);
    setTimeout(track, 100);
  };
  
  var replaceState = history.replaceState;
  history.replaceState = function() {
    replaceState.apply(history, arguments);
    setTimeout(track, 100);
  };
  
  window.addEventListener('popstate', function() {
    setTimeout(track, 100);
  });
})();
</script>`;

    // 5. 生成安装说明
    const instructions = {
      step1: {
        title: '复制脚本代码',
        description: '复制下面的 JavaScript 代码',
      },
      step2: {
        title: '粘贴到网站',
        description: '将代码粘贴到网站的 <head> 或 </body> 标签之前',
        locations: [
          'HTML 文件的 <head> 部分',
          'WordPress: 主题的 header.php 或使用插件',
          'Shopify: theme.liquid 文件',
          'Next.js: _document.tsx 或 _app.tsx',
          'React: public/index.html',
        ],
      },
      step3: {
        title: '验证安装',
        description: '访问您的网站，然后回到 SoloBoard 查看访客数据',
      },
    };

    // 6. 返回结果
    return NextResponse.json({
      success: true,
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
      },
      tracking: {
        scriptId: trackingScriptId,
        enabled: true,
        script: trackingScript,
        scriptMinified: trackingScript.replace(/\s+/g, ' ').trim(),
        instructions,
      },
      stats: {
        estimatedSize: Buffer.from(trackingScript).length,
        loadTime: '< 50ms',
        impact: 'Minimal',
      },
    });
  } catch (error: any) {
    console.error('[Tracking Script API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate tracking script',
      },
      { status: 500 }
    );
  }
}

/**
 * 禁用 tracking script
 * DELETE /api/soloboard/sites/[siteId]/tracking-script
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { siteId } = params;

    // 禁用 tracking
    await db()
      .update(monitoredSites)
      .set({
        trackingScriptEnabled: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(monitoredSites.id, siteId),
          eq(monitoredSites.userId, session.user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Tracking script disabled',
    });
  } catch (error: any) {
    console.error('[Tracking Script API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to disable tracking script',
      },
      { status: 500 }
    );
  }
}


