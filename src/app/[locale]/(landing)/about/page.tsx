import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { User, Eye, Shield } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Us - SoloBoard',
    description: 'Learn about SoloBoard\'s mission to help solopreneurs manage multiple SaaS products efficiently. Built by founders, for founders.',
    openGraph: {
      title: 'About Us - SoloBoard',
      description: 'Learn about SoloBoard\'s mission to help solopreneurs manage multiple SaaS products efficiently. Built by founders, for founders.',
    },
  };
}

export default async function AboutPage() {
  const values = [
    {
      title: 'Founder-First Design',
      description: 'Every feature is designed with the solopreneur\'s workflow in mind. No bloat, no complexity—just what you need.',
      icon: User,
    },
    {
      title: 'Transparency',
      description: 'We build in public. Follow our journey on Twitter/X and see how we\'re constantly improving based on real user feedback.',
      icon: Eye,
    },
    {
      title: 'Security by Default',
      description: 'Your data security isn\'t an afterthought—it\'s our foundation. AES-256 encryption and read-only access ensure your business stays safe.',
      icon: Shield,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Built for the Army of One
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          SoloBoard was born out of a simple frustration: Managing 10 SaaS products shouldn't feel like a chore.
        </p>
      </div>

      {/* Story */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
        <p className="text-lg leading-relaxed">
          As a serial entrepreneur, I found myself wasting hours every week manually checking different admin panels. 
          I realized that as my portfolio grew, my focus vanished. I didn't need more complex analytics; I needed a <strong>Pulse Monitor</strong>.
        </p>
        <p className="text-lg leading-relaxed mt-6">
          SoloBoard is our answer to the chaos. Built on top of robust technologies like <strong>Neon</strong> and <strong>ShipAny</strong>, 
          we provide independent founders with the clarity they need to scale. We aren't just a dashboard; we are your digital command center, 
          helping you spend less time monitoring and more time building.
        </p>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-xl text-center mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-center">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-muted/50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-6">Built on Solid Foundations</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-semibold mb-2">Next.js 16</p>
            <p className="text-sm text-muted-foreground">Lightning-fast performance</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Neon PostgreSQL</p>
            <p className="text-sm text-muted-foreground">Serverless database</p>
          </div>
          <div>
            <p className="font-semibold mb-2">ShipAny Framework</p>
            <p className="text-sm text-muted-foreground">Rapid development</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Vercel</p>
            <p className="text-sm text-muted-foreground">Global edge network</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Join the Journey</h2>
        <p className="text-muted-foreground mb-6">
          Follow our build-in-public journey and be part of the community shaping SoloBoard's future.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://twitter.com/SoloBoardApp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Follow on Twitter
          </a>
          <a
            href="/sign-up"
            className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
          >
            Start for Free
          </a>
        </div>
      </div>
    </div>
  );
}























