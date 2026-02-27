'use client';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Features as FeaturesType } from '@/shared/types/blocks/landing';

export function ZeroKnowledgeSecurity({
  features,
  className,
}: {
  features: FeaturesType;
  className?: string;
}) {
  return (
    <section
      id={features.id}
      className={cn('py-16 md:py-24', features.className, className)}
    >
      <div className={`container space-y-8 md:space-y-16`}>
        <ScrollAnimation>
          <div className="mx-auto max-w-4xl text-center text-balance">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600/20 border-2 border-green-500/50">
                <SmartIcon name="Shield" size={24} className="text-green-500" />
              </div>
              <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {features.title}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6 md:mb-12 lg:mb-16 text-lg">
              {features.description}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="relative mx-auto grid gap-6 sm:grid-cols-2 max-w-4xl">
            {features.items?.map((item, idx) => (
              <div className="flex items-start gap-3" key={idx}>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}




