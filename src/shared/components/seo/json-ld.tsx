'use client';

import { getFaqSchema, getOrgSchema, getSoftwareSchema } from '@/config/seo-data';

type SchemaType = 'faq' | 'org' | 'software' | 'custom';

interface JsonLdProps {
  locale: string;
  type?: SchemaType;
  customSchema?: Record<string, any>;
}

/**
 * JSON-LD Component for Structured Data
 * Automatically renders the correct schema based on locale
 */
export default function JsonLd({
  locale,
  type = 'faq',
  customSchema,
}: JsonLdProps) {
  let schema: Record<string, any>;

  switch (type) {
    case 'faq':
      schema = getFaqSchema(locale);
      break;
    case 'org':
      schema = getOrgSchema(locale);
      break;
    case 'software':
      schema = getSoftwareSchema(locale);
      break;
    case 'custom':
      if (!customSchema) {
        console.warn('JsonLd: customSchema is required when type is "custom"');
        return null;
      }
      schema = customSchema;
      break;
    default:
      schema = getFaqSchema(locale);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
