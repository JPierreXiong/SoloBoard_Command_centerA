const fs = require('fs');
const path = require('path');

// 中文 disclaimer
const zhDisclaimer = {
  "metadata": {
    "title": "免责声明 - SoloBoard",
    "description": "阅读 SoloBoard 关于服务可用性、数据准确性和责任限制的免责声明。"
  },
  "last_updated": "最后更新：2026年2月12日",
  "sections": [
    {
      "title": ""按原样"服务",
      "content": "SoloBoard 指挥中心按"按原样"和"可用"基础提供。我们不对服务的准确性或可用性做出任何明示或暗示的保证。"
    },
    {
      "title": "非财务建议",
      "content": "SoloBoard 上显示的指标、图表和数据仅供参考。它们不构成财务、投资或法律建议。请始终通过源平台（例如您的 Stripe 仪表盘）直接验证关键数据。"
    },
    {
      "title": "第三方故障",
      "content": "SoloBoard 依赖第三方 API。我们不对以下情况负责：",
      "items": [
        "第三方数据提供商造成的不准确",
        "第三方服务的临时停机",
        "由于 Google 或 Apple 等提供商的 API 更改导致的数据丢失"
      ]
    },
    {
      "title": "责任限制",
      "content": "在法律允许的最大范围内，SoloBoard 不对因您使用服务而产生的任何间接、附带或后果性损害（包括利润损失）承担责任。"
    }
  ],
  "transparency_note": {
    "content": "对我们的免责声明有疑问？我们相信透明度。在 X 上向我们的创始人发送私信",
    "link_text": "@SoloBoardApp"
  }
};

// 中文 terms
const zhTerms = {
  "metadata": {
    "title": "服务条款 - SoloBoard",
    "description": "阅读 SoloBoard 的服务条款，涵盖账户安全、API 使用、订阅和服务范围。"
  },
  "last_updated": "最后更新：2026年2月12日",
  "sections": [
    {
      "number": "1",
      "title": "接受条款",
      "content": "访问 SoloBoard 指挥中心即表示您同意这些条款。SoloBoard 是 SoloBoard（"我们"、"我们的"）的产品。"
    },
    {
      "number": "2",
      "title": "服务范围",
      "content": "SoloBoard 提供可视化工具。我们不拥有您的数据；我们只是提供界面来监控您从第三方提供商（Stripe、GitHub 等）获取的指标。"
    },
    {
      "number": "3",
      "title": "账户安全",
      "items": [
        {
          "subtitle": "API 密钥",
          "content": "您负责保护您的 API 密钥的安全。"
        },
        {
          "subtitle": "只读访问",
          "content": "我们强烈建议为所有第三方集成提供只读权限以最小化风险。"
        },
        {
          "subtitle": "加密",
          "content": "我们使用行业标准的 AES-256 加密来保护您的数据。"
        }
      ]
    },
    {
      "number": "4",
      "title": "订阅和付款",
      "items": [
        {
          "subtitle": "计费",
          "content": "订阅根据您选择的计划（入门版、基础版或专业版）提前计费。"
        },
        {
          "subtitle": "取消",
          "content": "您可以随时取消。您的访问权限将在当前计费周期结束前保持活动状态。"
        },
        {
          "subtitle": "退款",
          "content": "退款在购买后 14 天内根据具体情况处理。"
        }
      ]
    },
    {
      "number": "5",
      "title": "禁止使用",
      "content": "您同意不将 SoloBoard 用于任何非法活动或试图破坏我们的安全基础设施。"
    }
  ],
  "transparency_note": {
    "content": "对我们的法律条款有疑问？我们相信透明度。在 X 上向我们的创始人发送私信",
    "link_text": "@SoloBoardApp"
  }
};

// 写入文件
const disclaimerPath = path.join('D:', 'AIsoftware', 'soloboard', 'src', 'config', 'locale', 'messages', 'zh', 'disclaimer.json');
const termsPath = path.join('D:', 'AIsoftware', 'soloboard', 'src', 'config', 'locale', 'messages', 'zh', 'terms.json');

fs.writeFileSync(disclaimerPath, JSON.stringify(zhDisclaimer, null, 2), 'utf8');
fs.writeFileSync(termsPath, JSON.stringify(zhTerms, null, 2), 'utf8');

console.log('zh/disclaimer.json and zh/terms.json created successfully');









