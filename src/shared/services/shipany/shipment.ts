/**
 * ShipAny API 服务
 * 用于 Digital Heirloom 物理资产寄送
 * 
 * 注意：此服务不修改 ShipAny 核心结构，仅作为调用封装
 * 遵循 ShipAny API 文档规范，严格按照参数要求
 */

import { envConfigs } from '@/config';

// ============================================
// TypeScript 类型定义（基于 ShipAny API 规范）
// ============================================

/**
 * ShipAny 创建订单请求载荷
 * 严格按照 ShipAny API 文档结构
 */
export interface ShipAnyCreateOrderPayload {
  // 承运商 ID（必须对应 ShipAny 支持的承运商）
  courierId: string; // 'sf_express' | 'dhl' | 'fedex' | 等
  
  // 订单类型（预付模式，费用从平台账号扣除）
  type: 'prepaid';
  
  // 发件人信息（你的仓库/办公地址）
  sender: {
    name: string;
    phone: string;
    email?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      countryCode: string;
    };
  };
  
  // 收件人信息（受益人地址）
  receiver: {
    name: string;
    phone: string;
    email?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      countryCode: string;
    };
  };
  
  // 包裹信息（必须是数组结构，即使只有一个包裹）
  parcels: Array<{
    weight: number; // 重量（kg），建议 0.1-0.5kg 用于物理卡片/备份
    container_type?: string; // 'BOX' | 'ENVELOPE' | 等
    content: string; // 物品描述
    dimensions?: { // 尺寸（可选，单位：cm）
      length: number;
      width: number;
      height: number;
    };
  }>;
  
  // 海关申报（即使是同国模式也建议包含）
  customs_declaration?: {
    currency: string; // 'HKD' | 'CNY' | 'USD'
    total_declared_value: number; // 象征性申报，建议 10.0 左右
  };
  
  // 其他选项
  insurance?: boolean; // 是否需要保险
  cod_amount?: number; // 货到付款金额（如需要）
  reference_number?: string; // 商户订单号（用于关联）
}

/**
 * ShipAny API 响应
 */
export interface ShipAnyOrderResponse {
  // ShipAny 内部单号（重要）
  uid: string;
  
  // 快递追踪号（重要）
  tracking_number: string;
  
  // 追踪链接
  tracking_url?: string;
  
  // 物流面单 URL（PDF）
  label_url?: string;
  
  // 物流面单 Base64（备选）
  label_base64?: string;
  
  // 订单状态
  status: string;
  
  // 预计送达日期
  estimated_delivery_date?: string;
  
  // 费用信息
  shipping_cost?: number;
  currency?: string;
  
  // 原始响应数据（用于调试）
  raw_response?: any;
}

/**
 * ShipAny API 错误响应
 */
export interface ShipAnyErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// ShipAny API 配置
// ============================================

/**
 * 获取 ShipAny API 配置
 */
function getShipAnyConfig() {
  // 在 Node.js 环境中（Next.js API Routes）
  const apiKey = process.env.SHIPANY_API_KEY;
  // 在 Edge Function 环境中（Deno）
  // const apiKey = Deno.env.get('SHIPANY_API_KEY');
  
  const apiUrl = process.env.SHIPANY_API_URL || 'https://api.shipany.io/v1';
  const merchandiseId = process.env.SHIPANY_MERCHANDISE_ID;
  const shopId = process.env.SHIPANY_SHOP_ID; // 如果 API 需要
  
  if (!apiKey) {
    throw new Error('SHIPANY_API_KEY environment variable is not set. Please configure it in .env.local');
  }
  
  if (!merchandiseId) {
    throw new Error('SHIPANY_MERCHANDISE_ID environment variable is not set. Please configure it in .env.local');
  }
  
  return {
    apiKey,
    apiUrl,
    merchandiseId, // ShipAny Merchandise ID (用于创建订单时关联商品)
    shopId,
  };
}

/**
 * 获取默认发件人信息（从环境变量或配置文件）
 */
function getDefaultSender() {
  return {
    name: process.env.SHIPANY_SENDER_NAME || 'Digital Heirloom Vault',
    phone: process.env.SHIPANY_SENDER_PHONE || '',
    email: process.env.SHIPANY_SENDER_EMAIL,
    address: {
      line1: process.env.SHIPANY_SENDER_ADDRESS_LINE1 || '',
      line2: process.env.SHIPANY_SENDER_ADDRESS_LINE2,
      city: process.env.SHIPANY_SENDER_CITY || 'Hong Kong',
      state: process.env.SHIPANY_SENDER_STATE,
      zipCode: process.env.SHIPANY_SENDER_ZIP_CODE || '',
      countryCode: process.env.SHIPANY_SENDER_COUNTRY_CODE || 'HKG',
    },
  };
}

// ============================================
// ShipAny API 客户端
// ============================================

/**
 * 创建 ShipAny 物流订单
 * 严格按照 ShipAny API 文档规范
 * 
 * @param payload 订单载荷
 * @returns ShipAny 订单响应
 * @throws Error 如果 API 调用失败
 */
export async function createShipAnyOrder(
  payload: ShipAnyCreateOrderPayload
): Promise<ShipAnyOrderResponse> {
  const config = getShipAnyConfig();
  
  try {
    // 构建请求 URL（根据 ShipAny 实际 API 端点调整）
    const url = `${config.apiUrl}/orders/create`;
    // 或者可能是: `${config.apiUrl}/create_order`
    // 或者: `${config.apiUrl}/v1/shipments/create`
    
    // 验证必填字段
    if (!payload.courierId) {
      throw new Error('courierId is required');
    }
    if (!payload.parcels || !Array.isArray(payload.parcels) || payload.parcels.length === 0) {
      throw new Error('parcels must be a non-empty array');
    }
    if (!payload.receiver || !payload.receiver.address) {
      throw new Error('receiver address is required');
    }
    
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      // 或者根据 ShipAny 文档: 'X-API-Key': config.apiKey
    };
    
    // 如果 API 需要 Shop ID
    if (config.shopId) {
      headers['X-Shop-Id'] = config.shopId;
    }
    
    // 构建请求体（严格按照 ShipAny API 文档结构）
    const requestBody: any = {
      // 承运商 ID（必须）
      courier_id: payload.courierId,
      // 或者: courierId (驼峰命名，根据 ShipAny 文档确认)
      
      // 订单类型（必须）
      type: payload.type || 'prepaid',
      
      // 发件人信息
      sender: {
        name: payload.sender.name,
        phone: payload.sender.phone,
        email: payload.sender.email,
        address: {
          line1: payload.sender.address.line1,
          line2: payload.sender.address.line2,
          city: payload.sender.address.city,
          state: payload.sender.address.state,
          zip_code: payload.sender.address.zipCode,
          country_code: payload.sender.address.countryCode,
        },
      },
      
      // 收件人信息
      receiver: {
        name: payload.receiver.name,
        phone: payload.receiver.phone,
        email: payload.receiver.email,
        address: {
          line1: payload.receiver.address.line1,
          line2: payload.receiver.address.line2,
          city: payload.receiver.address.city,
          state: payload.receiver.address.state,
          zip_code: payload.receiver.address.zipCode,
          country_code: payload.receiver.address.countryCode,
        },
      },
      
      // 包裹信息（必须是数组，即使只有一个）
      parcels: payload.parcels.map(parcel => ({
        weight: parcel.weight,
        container_type: parcel.container_type || 'BOX',
        content: parcel.content,
        ...(parcel.dimensions && {
          length: parcel.dimensions.length,
          width: parcel.dimensions.width,
          height: parcel.dimensions.height,
        }),
      })),
      
      // 海关申报（即使是同国模式也建议包含）
      ...(payload.customs_declaration && {
        customs_declaration: {
          currency: payload.customs_declaration.currency || 'HKD',
          total_declared_value: payload.customs_declaration.total_declared_value || 10.0,
        },
      }),
      
      // 其他选项
      ...(payload.insurance !== undefined && { insurance: payload.insurance }),
      ...(payload.cod_amount !== undefined && { cod_amount: payload.cod_amount }),
      ...(payload.reference_number && { reference_number: payload.reference_number }),
    };
    
    // 移除 undefined 字段（确保 JSON 序列化正确）
    const cleanRequestBody = JSON.parse(JSON.stringify(requestBody));
    
    // 发送 API 请求
    console.log(`[ShipAny] Creating order with courier: ${payload.courierId}`);
    console.log(`[ShipAny] Request URL: ${url}`);
    console.log(`[ShipAny] Parcels count: ${payload.parcels.length}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanRequestBody),
    });
    
    // 解析响应
    const responseData = await response.json();
    
    // 处理错误响应
    if (!response.ok) {
      const error: ShipAnyErrorResponse = responseData;
      console.error(`[ShipAny] API Error (${response.status}):`, error);
      throw new Error(
        `ShipAny API Error: ${error.error?.message || response.statusText} (Code: ${error.error?.code || response.status})`
      );
    }
    
    // 解析成功响应（捕获 uid 和 tracking_number）
    // 注意：字段名可能根据 ShipAny 实际响应调整
    const result: ShipAnyOrderResponse = {
      // ShipAny 内部单号（重要）
      uid: responseData.uid || responseData.id || responseData.order_id,
      // 快递追踪号（重要）
      tracking_number: responseData.tracking_number || responseData.trackingNumber || responseData.tracking,
      tracking_url: responseData.tracking_url || responseData.trackingUrl,
      label_url: responseData.label_url || responseData.labelUrl || responseData.shipping_label_url,
      label_base64: responseData.label_base64 || responseData.labelBase64,
      status: responseData.status || responseData.order_status || 'created',
      estimated_delivery_date: responseData.estimated_delivery_date || responseData.estimatedDeliveryDate,
      shipping_cost: responseData.shipping_cost || responseData.cost,
      currency: responseData.currency || 'HKD',
      raw_response: responseData, // 保留原始响应用于调试
    };
    
    // 验证必要字段
    if (!result.uid) {
      console.warn('[ShipAny] Response missing uid field');
    }
    if (!result.tracking_number) {
      console.warn('[ShipAny] Response missing tracking_number field');
    }
    
    console.log(`[ShipAny] Order created successfully:`);
    console.log(`  - UID: ${result.uid}`);
    console.log(`  - Tracking Number: ${result.tracking_number}`);
    console.log(`  - Status: ${result.status}`);
    
    return result;
    
  } catch (error) {
    console.error('[ShipAny] Failed to create order:', error);
    
    // 重新抛出错误，让调用者处理
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`ShipAny API call failed: ${String(error)}`);
  }
}

/**
 * 查询 ShipAny 订单状态
 * 
 * @param orderUid ShipAny 订单 UID 或追踪号
 * @returns 订单状态信息
 */
export async function getShipAnyOrderStatus(
  orderUid: string
): Promise<ShipAnyOrderResponse> {
  const config = getShipAnyConfig();
  
  try {
    const url = `${config.apiUrl}/orders/${orderUid}`;
    // 或者: `${config.apiUrl}/track/${orderUid}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ShipAny API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      uid: data.uid || data.id,
      tracking_number: data.tracking_number || data.tracking,
      status: data.status,
      tracking_url: data.tracking_url,
      // ... 其他字段
    };
  } catch (error) {
    console.error(`[ShipAny] Failed to get order status: ${orderUid}`, error);
    throw error;
  }
}

// ============================================
// Digital Heirloom 专用封装函数
// ============================================

/**
 * 为 Digital Heirloom 创建物流订单
 * 封装了从受益人信息到 ShipAny 订单的转换逻辑
 * 
 * @param beneficiary 受益人信息（从数据库获取）
 * @param assetDescription 物理资产描述
 * @param courierId 承运商 ID（默认 'sf_express'）
 * @returns ShipAny 订单响应
 */
export async function createLegacyAssetShipment(
  beneficiary: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    receiverName?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    zipCode?: string | null;
    countryCode?: string | null;
    physicalAssetDescription?: string | null;
  },
  assetDescription?: string,
  courierId: string = 'sf_express' // 默认使用顺丰
): Promise<ShipAnyOrderResponse> {
  // 验证必填字段
  if (!beneficiary.receiverName || !beneficiary.addressLine1 || !beneficiary.city || 
      !beneficiary.zipCode || !beneficiary.countryCode) {
    throw new Error('Incomplete recipient address information');
  }
  
  if (!beneficiary.phone) {
    throw new Error('Recipient phone number is required');
  }
  
  // 获取默认发件人信息
  const sender = getDefaultSender();
  
  // 验证发件人信息
  if (!sender.address.line1 || !sender.address.city || !sender.address.zipCode) {
    throw new Error('Sender address configuration is incomplete. Please set SHIPANY_SENDER_* environment variables.');
  }
  
  // 构建 ShipAny 订单载荷（严格按照 API 规范）
  const payload: ShipAnyCreateOrderPayload = {
    courierId: courierId, // 'sf_express' | 'dhl' | 'fedex'
    type: 'prepaid', // 预付模式
    
    // 发件人（仓库/办公地址）
    sender: sender,
    
    // 收件人（受益人地址）
    receiver: {
      name: beneficiary.receiverName,
      phone: beneficiary.phone,
      email: beneficiary.email,
      address: {
        line1: beneficiary.addressLine1,
        city: beneficiary.city,
        zipCode: beneficiary.zipCode,
        countryCode: beneficiary.countryCode || 'HKG',
      },
    },
    
    // 包裹信息（必须是数组结构）
    parcels: [
      {
        weight: 0.5, // 默认重量 0.5kg（物理卡片/U盘等）
        container_type: 'BOX', // 盒子
        content: assetDescription || beneficiary.physicalAssetDescription || 'Legacy Asset: Encrypted Recovery Kit',
      },
    ],
    
    // 海关申报（即使是同国模式也建议包含）
    customs_declaration: {
      currency: 'HKD', // 根据实际货币调整
      total_declared_value: 10.0, // 象征性申报，避免保价费
    },
    
    // 建议为遗产资产购买保险
    insurance: true,
    
    // 商户订单号（用于关联）
    reference_number: `HEIR-${Date.now()}-${beneficiary.id.substring(0, 8)}`,
  };
  
  return createShipAnyOrder(payload);
}

