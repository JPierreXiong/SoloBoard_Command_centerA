import { Subscription } from '@/shared/models/subscription';
import {
  FAQ as FAQType,
  Testimonials as TestimonialsType,
} from '@/shared/types/blocks/landing';
import { Pricing as PricingType } from '@/shared/types/blocks/pricing';
import { FAQ, Pricing } from '@/themes/default/blocks';
// import { Testimonials } from '@/themes/default/blocks'; // 已删除 - Digital Heirloom 项目不需要

export default async function PricingPage({
  locale,
  pricing,
  currentSubscription,
  faq,
  testimonials,
}: {
  locale?: string;
  pricing: PricingType;
  currentSubscription?: Subscription;
  faq?: FAQType;
  testimonials?: TestimonialsType;
}) {
  return (
    <>
      <Pricing pricing={pricing} currentSubscription={currentSubscription} locale={locale} />
      {faq && <FAQ faq={faq} />}
      {/* {testimonials && <Testimonials testimonials={testimonials} />} */} {/* 已删除 - Digital Heirloom 项目不需要 */}
    </>
  );
}
