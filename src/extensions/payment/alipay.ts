import crypto from 'crypto';
import {
  CheckoutSession,
  PaymentBilling,
  PaymentConfigs,
  PaymentEvent,
  PaymentEventType,
  PaymentInvoice,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  PaymentType,
} from '.';

/**
 * Alipay payment provider configs
 * @docs https://opendocs.alipay.com/
 */
export interface AlipayConfigs extends PaymentConfigs {
  appId: string; // 应用 ID
  privateKey: string; // 应用私钥
  alipayPublicKey: string; // 支付宝公钥
  signType?: 'RSA2' | 'RSA'; // 签名类型，默认 RSA2
  charset?: string; // 字符集，默认 utf-8
  gateway?: string; // 网关地址
  notifyUrl?: string; // 异步通知地址
}

/**
 * Alipay payment provider implementation
 * @website https://www.alipay.com/
 */
export class AlipayProvider implements PaymentProvider {
  readonly name = 'alipay';
  configs: AlipayConfigs;

  private gateway: string;
  private charset: string;
  private signType: 'RSA2' | 'RSA';

  constructor(configs: AlipayConfigs) {
    this.configs = configs;
    this.gateway = configs.gateway || 'https://openapi.alipay.com/gateway.do';
    this.charset = configs.charset || 'utf-8';
    this.signType = configs.signType || 'RSA2';
  }

  /**
   * 创建支付
   */
  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    try {
      if (!order.price) {
        throw new Error('price is required');
      }

      // 支付宝金额单位是元，需要转换
      const totalAmount = (order.price.amount / 100).toFixed(2);

      // 构建业务参数
      const bizContent: any = {
        out_trade_no: order.orderNo || this.generateOrderNo(),
        product_code: 'FAST_INSTANT_TRADE_PAY', // 电脑网站支付
        total_amount: totalAmount,
        subject: order.description || '商品支付',
        body: order.description,
      };

      // 如果有自定义字段
      if (order.metadata) {
        bizContent.passback_params = encodeURIComponent(
          JSON.stringify(order.metadata)
        );
      }

      // 构建公共参数
      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.page.pay', // 电脑网站支付
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      // 添加异步通知地址
      if (this.configs.notifyUrl) {
        params.notify_url = this.configs.notifyUrl;
      }

      // 添加同步返回地址
      if (order.successUrl) {
        params.return_url = order.successUrl;
      }

      // 生成签名
      const sign = this.sign(params);
      params.sign = sign;

      // 构建支付 URL
      const checkoutUrl = this.buildUrl(params);

      return {
        provider: this.name,
        checkoutParams: params,
        checkoutInfo: {
          sessionId: bizContent.out_trade_no,
          checkoutUrl: checkoutUrl,
        },
        checkoutResult: params,
        metadata: order.metadata || {},
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建手机网站支付
   */
  async createMobilePayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    try {
      if (!order.price) {
        throw new Error('price is required');
      }

      const totalAmount = (order.price.amount / 100).toFixed(2);

      const bizContent: any = {
        out_trade_no: order.orderNo || this.generateOrderNo(),
        product_code: 'QUICK_WAP_WAY', // 手机网站支付
        total_amount: totalAmount,
        subject: order.description || '商品支付',
        body: order.description,
      };

      if (order.metadata) {
        bizContent.passback_params = encodeURIComponent(
          JSON.stringify(order.metadata)
        );
      }

      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.wap.pay', // 手机网站支付
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      if (this.configs.notifyUrl) {
        params.notify_url = this.configs.notifyUrl;
      }

      if (order.successUrl) {
        params.return_url = order.successUrl;
      }

      const sign = this.sign(params);
      params.sign = sign;

      const checkoutUrl = this.buildUrl(params);

      return {
        provider: this.name,
        checkoutParams: params,
        checkoutInfo: {
          sessionId: bizContent.out_trade_no,
          checkoutUrl: checkoutUrl,
        },
        checkoutResult: params,
        metadata: order.metadata || {},
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建 APP 支付
   */
  async createAppPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    try {
      if (!order.price) {
        throw new Error('price is required');
      }

      const totalAmount = (order.price.amount / 100).toFixed(2);

      const bizContent: any = {
        out_trade_no: order.orderNo || this.generateOrderNo(),
        product_code: 'QUICK_MSECURITY_PAY', // APP 支付
        total_amount: totalAmount,
        subject: order.description || '商品支付',
        body: order.description,
      };

      if (order.metadata) {
        bizContent.passback_params = encodeURIComponent(
          JSON.stringify(order.metadata)
        );
      }

      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.app.pay', // APP 支付
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      if (this.configs.notifyUrl) {
        params.notify_url = this.configs.notifyUrl;
      }

      const sign = this.sign(params);
      params.sign = sign;

      // APP 支付返回的是 orderString，不是 URL
      const orderString = this.buildOrderString(params);

      return {
        provider: this.name,
        checkoutParams: params,
        checkoutInfo: {
          sessionId: bizContent.out_trade_no,
          checkoutUrl: orderString, // APP 支付返回订单字符串
        },
        checkoutResult: params,
        metadata: order.metadata || {},
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    try {
      if (!sessionId) {
        throw new Error('sessionId (out_trade_no) is required');
      }

      const bizContent = {
        out_trade_no: sessionId,
      };

      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.query', // 查询订单
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.sign(params);
      params.sign = sign;

      // 发送请求
      const response = await this.request(params);

      if (!response || response.code !== '10000') {
        throw new Error(
          response?.sub_msg || response?.msg || 'Query payment failed'
        );
      }

      const tradeStatus = response.trade_status;
      const paymentStatus = this.mapAlipayStatus(tradeStatus);

      return {
        provider: this.name,
        paymentStatus: paymentStatus,
        paymentInfo: {
          transactionId: response.trade_no, // 支付宝交易号
          paymentAmount: parseFloat(response.total_amount) * 100, // 转换为分
          paymentCurrency: 'CNY',
          paymentEmail: response.buyer_logon_id,
          paymentUserId: response.buyer_user_id,
          paidAt: response.send_pay_date
            ? new Date(response.send_pay_date)
            : undefined,
        },
        paymentResult: response,
        metadata: response.passback_params
          ? JSON.parse(decodeURIComponent(response.passback_params))
          : {},
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 处理支付宝异步通知
   */
  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    try {
      const formData = await req.formData();
      const params: Record<string, string> = {};

      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      // 验证签名
      const isValid = this.verify(params);
      if (!isValid) {
        throw new Error('Invalid signature');
      }

      // 获取交易状态
      const tradeStatus = params.trade_status;
      const eventType = this.mapAlipayEventType(tradeStatus);

      // 构建支付会话
      const paymentSession: PaymentSession = {
        provider: this.name,
        paymentStatus: this.mapAlipayStatus(tradeStatus),
        paymentInfo: {
          transactionId: params.trade_no,
          paymentAmount: parseFloat(params.total_amount) * 100,
          paymentCurrency: 'CNY',
          paymentEmail: params.buyer_logon_id,
          paymentUserId: params.buyer_id,
          paidAt: params.gmt_payment
            ? new Date(params.gmt_payment)
            : undefined,
        },
        paymentResult: params,
        metadata: params.passback_params
          ? JSON.parse(decodeURIComponent(params.passback_params))
          : {},
      };

      return {
        eventType: eventType,
        eventResult: params,
        paymentSession: paymentSession,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 退款
   */
  async refundPayment({
    transactionId,
    refundAmount,
    refundReason,
  }: {
    transactionId: string;
    refundAmount: number;
    refundReason?: string;
  }): Promise<any> {
    try {
      const bizContent: any = {
        out_trade_no: transactionId,
        refund_amount: (refundAmount / 100).toFixed(2),
        refund_reason: refundReason || '退款',
      };

      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.refund',
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.sign(params);
      params.sign = sign;

      const response = await this.request(params);

      if (!response || response.code !== '10000') {
        throw new Error(
          response?.sub_msg || response?.msg || 'Refund failed'
        );
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder({ orderNo }: { orderNo: string }): Promise<any> {
    try {
      const bizContent = {
        out_trade_no: orderNo,
      };

      const params: any = {
        app_id: this.configs.appId,
        method: 'alipay.trade.close',
        charset: this.charset,
        sign_type: this.signType,
        timestamp: this.formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.sign(params);
      params.sign = sign;

      const response = await this.request(params);

      if (!response || response.code !== '10000') {
        throw new Error(
          response?.sub_msg || response?.msg || 'Close order failed'
        );
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 生成签名
   */
  private sign(params: Record<string, any>): string {
    // 排序并拼接参数
    const sortedParams = this.sortParams(params);
    const signString = this.buildSignString(sortedParams);

    // 使用私钥签名
    const sign = crypto.createSign(
      this.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1'
    );
    sign.update(signString, 'utf8');

    return sign.sign(this.formatPrivateKey(this.configs.privateKey), 'base64');
  }

  /**
   * 验证签名
   */
  private verify(params: Record<string, string>): boolean {
    const sign = params.sign;
    const signType = params.sign_type;

    if (!sign) {
      return false;
    }

    // 移除 sign 和 sign_type
    const verifyParams = { ...params };
    delete verifyParams.sign;
    delete verifyParams.sign_type;

    // 排序并拼接参数
    const sortedParams = this.sortParams(verifyParams);
    const signString = this.buildSignString(sortedParams);

    // 使用支付宝公钥验证
    const verify = crypto.createVerify(
      signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1'
    );
    verify.update(signString, 'utf8');

    return verify.verify(
      this.formatPublicKey(this.configs.alipayPublicKey),
      sign,
      'base64'
    );
  }

  /**
   * 发送请求到支付宝
   */
  private async request(params: Record<string, any>): Promise<any> {
    const url = this.buildUrl(params);

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Alipay request failed: ${response.statusText}`);
    }

    const text = await response.text();
    const json = JSON.parse(text);

    // 提取响应数据
    const method = params.method.replace(/\./g, '_') + '_response';
    return json[method];
  }

  /**
   * 构建支付 URL
   */
  private buildUrl(params: Record<string, any>): string {
    const queryString = Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return `${this.gateway}?${queryString}`;
  }

  /**
   * 构建订单字符串（用于 APP 支付）
   */
  private buildOrderString(params: Record<string, any>): string {
    return Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * 排序参数
   */
  private sortParams(params: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    Object.keys(params)
      .sort()
      .forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          sorted[key] = params[key];
        }
      });
    return sorted;
  }

  /**
   * 构建签名字符串
   */
  private buildSignString(params: Record<string, any>): string {
    return Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');
  }

  /**
   * 格式化私钥
   */
  private formatPrivateKey(privateKey: string): string {
    if (privateKey.includes('BEGIN PRIVATE KEY')) {
      return privateKey;
    }

    return `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }

  /**
   * 格式化公钥
   */
  private formatPublicKey(publicKey: string): string {
    if (publicKey.includes('BEGIN PUBLIC KEY')) {
      return publicKey;
    }

    return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    return `ALI${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 映射支付宝交易状态到系统状态
   */
  private mapAlipayStatus(tradeStatus: string): PaymentStatus {
    switch (tradeStatus) {
      case 'WAIT_BUYER_PAY':
        return PaymentStatus.PROCESSING;
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        return PaymentStatus.SUCCESS;
      case 'TRADE_CLOSED':
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  /**
   * 映射支付宝事件类型
   */
  private mapAlipayEventType(tradeStatus: string): PaymentEventType {
    switch (tradeStatus) {
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        return PaymentEventType.PAYMENT_SUCCESS;
      case 'TRADE_CLOSED':
        return PaymentEventType.PAYMENT_FAILED;
      default:
        return PaymentEventType.CHECKOUT_SUCCESS;
    }
  }
}

/**
 * Create Alipay provider with configs
 */
export function createAlipayProvider(configs: AlipayConfigs): AlipayProvider {
  return new AlipayProvider(configs);
}






















