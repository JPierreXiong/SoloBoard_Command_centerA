/**
 * 插入测试数据到 SoloBoard
 * 用于快速验证功能
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { nanoid } from 'nanoid';

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function insertTestData() {
  console.log('🚀 Inserting test data into SoloBoard...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  const sql = postgres(databaseUrl);

  try {
    // 1. 获取所有站点
    const sites = await sql`SELECT id, name, domain FROM monitored_sites`;
    
    if (sites.length === 0) {
      console.log('❌ No sites found. Please add a site first.');
      await sql.end();
      return;
    }

    console.log(`\n📊 Found ${sites.length} site(s):`);
    sites.forEach((site, index) => {
      console.log(`  ${index + 1}. ${site.name} (${site.domain}) - ID: ${site.id}`);
    });

    // 2. 为每个站点插入测试数据
    for (const site of sites) {
      console.log(`\n📝 Inserting test data for: ${site.name}`);

      // 插入今天的数据
      const today = new Date().toISOString().split('T')[0];
      await sql`
        INSERT INTO site_metrics_daily (
          id, site_id, date, revenue, visitors, orders, conversion_rate, avg_order_value
        ) VALUES (
          ${nanoid()},
          ${site.id},
          ${today},
          156.00,
          1203,
          12,
          1.0,
          13.00
        )
        ON CONFLICT (site_id, date) DO UPDATE SET
          revenue = 156.00,
          visitors = 1203,
          orders = 12,
          conversion_rate = 1.0,
          avg_order_value = 13.00
      `;
      console.log(`  ✅ Today's data inserted`);

      // 插入过去7天的数据
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const revenue = (Math.random() * 200 + 100).toFixed(2);
        const visitors = Math.floor(Math.random() * 1000 + 800);
        const orders = Math.floor(Math.random() * 15 + 5);
        const conversionRate = ((orders / visitors) * 100).toFixed(2);
        const avgOrderValue = (parseFloat(revenue) / orders).toFixed(2);

        await sql`
          INSERT INTO site_metrics_daily (
            id, site_id, date, revenue, visitors, orders, conversion_rate, avg_order_value
          ) VALUES (
            ${nanoid()},
            ${site.id},
            ${dateStr},
            ${revenue},
            ${visitors},
            ${orders},
            ${conversionRate},
            ${avgOrderValue}
          )
          ON CONFLICT (site_id, date) DO UPDATE SET
            revenue = ${revenue},
            visitors = ${visitors},
            orders = ${orders},
            conversion_rate = ${conversionRate},
            avg_order_value = ${avgOrderValue}
        `;
      }
      console.log(`  ✅ 7 days of historical data inserted`);
    }

    console.log('\n🎉 Test data inserted successfully!');
    console.log('\n📍 Next steps:');
    console.log('  1. Visit: http://localhost:3003/soloboard');
    console.log('  2. Click on your site to view details');
    console.log('  3. You should now see real data instead of mock data!');

    await sql.end();
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
    await sql.end();
    throw error;
  }
}

// 运行脚本
insertTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


