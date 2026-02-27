/**
 * 完整的 Edge Function 资产释放逻辑测试脚本
 * 自动完成：创建测试数据 -> 调用 Edge Function -> 验证结果 -> 清理数据
 * 
 * 执行方式：
 * npx tsx scripts/run-complete-test.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vkafrwwskupsyibrvcvd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 错误: SUPABASE_SERVICE_ROLE_KEY 未设置');
  console.error('   请设置环境变量或在 .env.local 中配置');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dead-man-check`;

interface TestData {
  userId: string;
  vaultId: string;
  beneficiaryId: string;
  warningEventId: string;
}

async function sleep(seconds: number) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function createTestData(): Promise<TestData> {
  console.log('📝 Step 1: 创建测试数据...\n');

  const timestamp = Date.now();
  const testEmail = `test-asset-release-${timestamp}@example.com`;
  const beneficiaryEmail = `beneficiary-${timestamp}@example.com`;

  // 1. 创建测试用户（Pro 版）
  const userId = crypto.randomUUID();
  const { error: userError } = await supabase
    .from('user')
    .insert({
      id: userId,
      name: 'Test User Asset Release',
      email: testEmail,
      email_verified: true,
      plan_type: 'pro',
    });

  if (userError) {
    throw new Error(`创建测试用户失败: ${userError.message}`);
  }
  console.log(`✅ 测试用户创建成功 (ID: ${userId})`);

  // 2. 创建数字保险箱（warning 状态）
  const vaultId = crypto.randomUUID();
  const { error: vaultError } = await supabase
    .from('digital_vaults')
    .insert({
      id: vaultId,
      user_id: userId,
      encrypted_data: `test_encrypted_data_${timestamp}`,
      encryption_salt: `test_salt_${timestamp}`,
      encryption_iv: `test_iv_${timestamp}`,
      heartbeat_frequency: 90,
      grace_period: 7,
      dead_man_switch_enabled: true,
      status: 'warning',
      last_seen_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 天前
    });

  if (vaultError) {
    throw new Error(`创建保险箱失败: ${vaultError.message}`);
  }
  console.log(`✅ 保险箱创建成功 (ID: ${vaultId})`);

  // 3. 创建预警事件（8 天前，超过宽限期）
  const warningEventId = crypto.randomUUID();
  const warningSentAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const { error: eventError } = await supabase
    .from('dead_man_switch_events')
    .insert({
      id: warningEventId,
      vault_id: vaultId,
      event_type: 'warning_sent',
      event_data: JSON.stringify({
        triggered_at: warningSentAt.toISOString(),
        heartbeat_frequency: 90,
        grace_period: 7,
      }),
      created_at: warningSentAt.toISOString(),
    });

  if (eventError) {
    throw new Error(`创建预警事件失败: ${eventError.message}`);
  }
  console.log(`✅ 预警事件创建成功 (ID: ${warningEventId})`);

  // 4. 创建受益人（包含完整地址信息）
  const beneficiaryId = crypto.randomUUID();
  const { error: beneficiaryError } = await supabase
    .from('beneficiaries')
    .insert({
      id: beneficiaryId,
      vault_id: vaultId,
      name: 'Test Beneficiary',
      email: beneficiaryEmail,
      relationship: 'friend',
      language: 'en',
      phone: '+852-1234-5678',
      receiver_name: 'Test Beneficiary',
      address_line1: '123 Test Street',
      city: 'Hong Kong',
      zip_code: '000000',
      country_code: 'HKG',
      physical_asset_description: 'Encrypted Recovery Kit - Physical USB Drive',
      status: 'pending',
    });

  if (beneficiaryError) {
    throw new Error(`创建受益人失败: ${beneficiaryError.message}`);
  }
  console.log(`✅ 受益人创建成功 (ID: ${beneficiaryId})`);

  console.log('\n✅ 测试数据创建完成！\n');

  return {
    userId,
    vaultId,
    beneficiaryId,
    warningEventId,
  };
}

async function callEdgeFunction(): Promise<void> {
  console.log('📝 Step 2: 调用 Edge Function...\n');

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`HTTP 状态码: ${response.status}`);
    console.log('响应内容:', JSON.stringify(responseData, null, 2));

    if (response.status === 200 || response.status === 202) {
      console.log('\n✅ Edge Function 调用成功');
    } else {
      console.log('\n⚠️  Edge Function 调用返回非成功状态码');
    }
  } catch (error) {
    throw new Error(`调用 Edge Function 失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n⏳ 等待 10 秒让 Edge Function 处理完成...\n');
  await sleep(10);
}

async function verifyResults(testData: TestData): Promise<boolean> {
  console.log('📝 Step 3: 验证资产释放结果...\n');

  let allPassed = true;

  // 1. 检查保险箱状态（期望: released）
  const { data: vault, error: vaultError } = await supabase
    .from('digital_vaults')
    .select('id, status')
    .eq('id', testData.vaultId)
    .single();

  if (vaultError) {
    console.error(`❌ 查询保险箱失败: ${vaultError.message}`);
    allPassed = false;
  } else {
    if (vault.status === 'released') {
      console.log(`✅ 保险箱状态: released (正确)`);
    } else {
      console.log(`❌ 保险箱状态: ${vault.status} (期望: released)`);
      allPassed = false;
    }
  }

  // 2. 检查受益人状态（期望: notified）
  const { data: beneficiary, error: beneficiaryError } = await supabase
    .from('beneficiaries')
    .select('id, status, release_token')
    .eq('id', testData.beneficiaryId)
    .single();

  if (beneficiaryError) {
    console.error(`❌ 查询受益人失败: ${beneficiaryError.message}`);
    allPassed = false;
  } else {
    if (beneficiary.status === 'notified') {
      console.log(`✅ 受益人状态: notified (正确)`);
    } else {
      console.log(`❌ 受益人状态: ${beneficiary.status} (期望: notified)`);
      allPassed = false;
    }

    if (beneficiary.release_token) {
      console.log(`✅ 释放令牌: 已生成`);
    } else {
      console.log(`❌ 释放令牌: 未生成`);
      allPassed = false;
    }
  }

  // 3. 检查资产释放事件
  const { data: events, error: eventsError } = await supabase
    .from('dead_man_switch_events')
    .select('id, event_type')
    .eq('vault_id', testData.vaultId)
    .eq('event_type', 'assets_released');

  if (eventsError) {
    console.error(`❌ 查询资产释放事件失败: ${eventsError.message}`);
    allPassed = false;
  } else {
    if (events && events.length > 0) {
      console.log(`✅ 资产释放事件: 已记录`);
    } else {
      console.log(`❌ 资产释放事件: 未记录`);
      allPassed = false;
    }
  }

  // 4. 检查物流记录（可选）
  const { data: shippingLogs, error: shippingError } = await supabase
    .from('shipping_logs')
    .select('id, tracking_number')
    .eq('beneficiary_id', testData.beneficiaryId);

  if (shippingError) {
    // 物流记录表可能不存在或未配置，不算错误
    console.log(`⚠️  物流记录: 查询失败（可能未配置 ShipAny API）`);
  } else {
    if (shippingLogs && shippingLogs.length > 0) {
      console.log(`✅ 物流记录: 已创建 (追踪号: ${shippingLogs[0].tracking_number || 'N/A'})`);
    } else {
      console.log(`⚠️  物流记录: 未创建（可能未配置 ShipAny API）`);
    }
  }

  console.log('');
  return allPassed;
}

async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('🧹 清理测试数据...\n');

  // 删除顺序：beneficiaries -> dead_man_switch_events -> digital_vaults -> user
  await supabase.from('beneficiaries').delete().eq('id', testData.beneficiaryId);
  await supabase.from('dead_man_switch_events').delete().eq('vault_id', testData.vaultId);
  await supabase.from('digital_vaults').delete().eq('id', testData.vaultId);
  await supabase.from('user').delete().eq('id', testData.userId);

  console.log('✅ 测试数据清理完成\n');
}

async function runCompleteTest() {
  console.log('========================================');
  console.log('🧪 Edge Function 资产释放逻辑完整测试');
  console.log('========================================\n');

  let testData: TestData | null = null;

  try {
    // Step 1: 创建测试数据
    testData = await createTestData();

    // Step 2: 调用 Edge Function
    await callEdgeFunction();

    // Step 3: 验证结果
    const passed = await verifyResults(testData);

    // Step 4: 清理测试数据
    if (testData) {
      await cleanupTestData(testData);
    }

    // 总结
    console.log('========================================');
    console.log('📊 测试结果总结');
    console.log('========================================\n');

    if (passed) {
      console.log('🎉 资产释放逻辑测试通过！');
      console.log('');
      console.log('✅ 所有关键步骤都已完成：');
      console.log('   - 保险箱状态已更新为 released');
      console.log('   - 受益人状态已更新为 notified');
      console.log('   - 释放令牌已生成');
      console.log('   - 资产释放事件已记录');
    } else {
      console.log('⚠️  部分测试失败，请检查：');
      console.log('   1. Edge Function 是否已部署');
      console.log('   2. 环境变量配置是否正确（RESEND_API_KEY 等）');
      console.log('   3. Edge Function 日志中的错误信息');
    }

    console.log('');
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    
    // 尝试清理测试数据
    if (testData) {
      try {
        await cleanupTestData(testData);
      } catch (cleanupError) {
        console.error('清理测试数据失败:', cleanupError);
      }
    }

    process.exit(1);
  }
}

// 运行测试
runCompleteTest();



