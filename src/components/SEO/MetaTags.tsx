import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

/**
 * MetaTags Component
 *
 * A comprehensive SEO component that handles all meta tags, Open Graph tags,
 * Twitter Card tags, canonical URLs, and structured data (JSON-LD).
 *
 * @example
 * <MetaTags
 *   title="Análise de Alojamento Local | Maria Faz"
 *   description="Optimize your short-term rental with AI-powered insights"
 *   keywords="alojamento local, short-term rental, airbnb, booking.com"
 *   ogImage="https://example.com/og-image.jpg"
 *   canonicalUrl="https://example.com/"
 * />
 */
const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonicalUrl,
  noindex = false,
  structuredData,
}) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://alojamento-insight-analyzer.mariafaz.com';
  const defaultOgImage = `${siteUrl}/og-image.jpg`;

  // Use provided values or fall back to defaults
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalOgImage = ogImage || defaultOgImage;
  const finalOgUrl = ogUrl || canonicalUrl || siteUrl;
  const finalTwitterTitle = twitterTitle || finalOgTitle;
  const finalTwitterDescription = twitterDescription || finalOgDescription;
  const finalTwitterImage = twitterImage || finalOgImage;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Robots Meta */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:site_name" content="Maria Faz - Alojamento Insight Analyzer" />
      <meta property="og:locale" content="pt_PT" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      <meta name="twitter:image" content={finalTwitterImage} />
      <meta name="twitter:image:alt" content={finalTwitterTitle} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData]
          )}
        </script>
      )}
    </Helmet>
  );
};

export default MetaTags;
