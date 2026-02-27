/**
 * SEO Data Configuration
 * Multi-language structured data for SoloBoard Command Center
 */

export const getFaqSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isZh
          ? '什么是死信开关？'
          : isFr
            ? "Qu'est-ce qu'un Dead Man's Switch ?"
            : "What is a Dead Man's Switch?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '死信开关是一个自动化系统，如果您在预设的时间内未进行检入（登录），系统将触发预设操作（如释放加密金库）。'
            : isFr
              ? "Un Dead Man's Switch est un système automatisé qui déclenche une action prédéfinie si vous ne vous connectez pas dans un délai spécifique."
              : "A Dead Man's Switch is an automated system that triggers a pre-set action if you fail to check in within a specific timeframe.",
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? 'SoloBoard 真的无法看到我的密码吗？'
          : isFr
            ? 'SoloBoard peut-il vraiment voir mon mot de passe ?'
            : 'Is my master password truly safe with SoloBoard?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '是的。我们采用零知识加密。您的主密码仅用于本地加密，永远不会离开您的设备。'
            : isFr
              ? 'Oui. Nous utilisons le chiffrement Zero-Knowledge. Votre mot de passe principal est uniquement utilisé pour le chiffrement local et ne quitte jamais votre appareil.'
              : 'Yes. We use Zero-Knowledge encryption. Your master password is only used for local encryption and never leaves your device.',
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? '如果丢失了主密码怎么办？'
          : isFr
            ? 'Que se passe-t-il si je perds mon mot de passe principal ?'
            : 'What happens if I lose my master password?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '由于零知识架构，我们无法恢复您的主密码。请务必安全保存您的恢复包（Recovery Kit）PDF 文件。'
            : isFr
              ? "En raison de l'architecture zero-knowledge, nous ne pouvons pas récupérer votre mot de passe principal. Veuillez conserver en sécurité vos fichiers PDF de Kit de Récupération."
              : 'Due to zero-knowledge architecture, we cannot recover your master password. Please securely store your Recovery Kit PDF files.',
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? '心跳检测的频率是多少？'
          : isFr
            ? 'Quelle est la fréquence de vérification du battement de cœur ?'
            : 'How often do I need to check in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? 'Free 计划需要每 180 天检入一次，Base 计划每 90 天，Pro 计划每 30 天。'
            : isFr
              ? 'Le plan gratuit nécessite une vérification tous les 180 jours, le plan de base tous les 90 jours et le plan Pro tous les 30 jours.'
              : 'Free plan requires check-in every 180 days, Base plan every 90 days, and Pro plan every 30 days.',
        },
      },
    ],
  };
};

export const getOrgSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SoloBoard',
    description: isZh
      ? '领先的多站点监控与管理平台'
      : isFr
        ? "Plateforme leader de surveillance et de gestion multi-sites"
        : 'Leading Multi-Site Monitoring & Management Platform',
    url: 'https://www.soloboard.app',
    logo: 'https://www.soloboard.app/logo.png',
    sameAs: [
      // Add your social media links here when available
      // 'https://twitter.com/soloboard_app',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@soloboard.app',
      contactType: 'customer service',
    },
  };
};

export const getSoftwareSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: isZh ? 'SoloBoard 命令中心' : isFr ? 'SoloBoard Centre de Commande' : 'SoloBoard Command Center',
    operatingSystem: 'Web',
    applicationCategory: 'SecurityApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };
};
