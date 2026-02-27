import { Metadata } from 'next';
import Script from 'next/script';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'FAQ - Frequently Asked Questions | SoloBoard',
    description: 'Find answers to common questions about SoloBoard, the all-in-one monitoring dashboard for solopreneurs managing multiple SaaS products.',
    openGraph: {
      title: 'FAQ - Frequently Asked Questions | SoloBoard',
      description: 'Find answers to common questions about SoloBoard, the all-in-one monitoring dashboard for solopreneurs managing multiple SaaS products.',
    },
  };
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'How does SoloBoard connect to my websites?',
      answer: 'We use secure API connections (OAuth and API Keys) to fetch data from providers like Google Analytics 4, Stripe, and Shopify. It takes less than 2 minutes to sync a new site.',
    },
    {
      question: 'Is it safe to share my API keys?',
      answer: 'Yes. We prioritize security above all else. All keys are encrypted using AES-256 and stored in a secure Neon database. We only request Read-Only permissions, so your funds and configurations are never at risk.',
    },
    {
      question: 'Does SoloBoard slow down my website\'s performance?',
      answer: 'Not at all. SoloBoard communicates directly with the platform APIs (like Stripe\'s servers). We do not load any scripts on your actual website, ensuring your page speed remains 100% unaffected.',
    },
    {
      question: 'Can I manage more than 10 websites?',
      answer: 'Absolutely. While our standard Pro plan covers up to 10 sites, our Studio plan offers unlimited monitoring for larger portfolios and agencies.',
    },
    {
      question: 'Why choose SoloBoard over free alternatives?',
      answer: 'While you can check these platforms individually for free, SoloBoard saves you the most valuable asset you have: Time. We consolidate everything into a high-performance, mobile-ready dashboard that a single browser tab simply can\'t match.',
    },
    {
      question: 'What platforms do you support?',
      answer: 'We currently support Google Analytics 4 (GA4) for traffic analytics, Stripe and Lemon Squeezy for payment processing, Shopify for e-commerce, and custom uptime monitoring. More integrations are added regularly based on user requests.',
    },
    {
      question: 'How often does the data refresh?',
      answer: 'Free plan users get hourly updates. Pro plan users enjoy near real-time synchronization (every 5-10 minutes) to ensure you never miss critical changes in your business metrics.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, absolutely. You can cancel your subscription with one click through your billing portal. No hidden fees, no dark patterns, no questions asked.',
    },
  ];

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data for Google Rich Results */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about SoloBoard
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-lg">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-16 text-center p-8 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@soloboard.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </>
  );
}


