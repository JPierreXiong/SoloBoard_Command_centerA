import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Mail, Twitter, Handshake, MapPin } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us - SoloBoard',
    description: 'Get in touch with the SoloBoard team. We\'re here to help with support, partnerships, and feature requests.',
    openGraph: {
      title: 'Contact Us - SoloBoard',
      description: 'Get in touch with the SoloBoard team. We\'re here to help with support, partnerships, and feature requests.',
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('landing.contact');

  const channels = [
    {
      title: 'Direct Support',
      description: 'Response time: Usually under 12 hours',
      email: 'support@soloboard.app',
      icon: Mail,
    },
    {
      title: 'Build in Public',
      description: 'Follow our journey and get real-time updates',
      url: 'https://twitter.com/SoloBoardApp',
      handle: '@SoloBoardApp',
      icon: Twitter,
    },
    {
      title: 'Partnerships',
      description: 'For collaborations or agency inquiries',
      email: 'partners@soloboard.app',
      icon: Handshake,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Let's Talk Shop
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Have a feature request, a bug to report, or just want to chat about the solopreneur life? We're always listening.
        </p>
      </div>

      {/* Contact Channels */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          return (
            <div
              key={index}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{channel.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {channel.description}
              </p>
              {channel.email && (
                <a
                  href={`mailto:${channel.email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {channel.email}
                </a>
              )}
              {channel.url && (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {channel.handle}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Location */}
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <p className="text-lg font-medium">
            Based in the cloud, serving founders worldwide 🌍
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Response Times</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-4 border rounded-lg">
            <p className="font-semibold mb-2">Support Requests</p>
            <p className="text-muted-foreground">Usually under 12 hours</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold mb-2">Partnership Inquiries</p>
            <p className="text-muted-foreground">Within 2 business days</p>
          </div>
        </div>
      </div>
    </div>
  );
}























