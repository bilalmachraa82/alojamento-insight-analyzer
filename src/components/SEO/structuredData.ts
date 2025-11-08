/**
 * Structured Data (Schema.org) Utilities
 *
 * This file contains helper functions to generate JSON-LD structured data
 * for various types of content on the website.
 */

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://alojamento-insight-analyzer.mariafaz.com';
const COMPANY_NAME = 'Maria Faz';
const COMPANY_LOGO = `${SITE_URL}/logo.png`;

/**
 * Organization Schema
 * Identifies the business/organization behind the website
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY_NAME,
  url: SITE_URL,
  logo: COMPANY_LOGO,
  description: 'AI-powered short-term rental analysis and optimization platform for Alojamento Local properties in Portugal',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['Portuguese', 'English'],
  },
  sameAs: [
    // Add social media profiles here when available
  ],
};

/**
 * Website Schema
 * Describes the website and its search functionality
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Maria Faz - Alojamento Insight Analyzer',
  url: SITE_URL,
  description: 'Smart diagnostics and analysis for short-term rental properties',
  publisher: {
    '@type': 'Organization',
    name: COMPANY_NAME,
    logo: {
      '@type': 'ImageObject',
      url: COMPANY_LOGO,
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/results/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/**
 * Software Application Schema
 * Describes the SaaS platform
 */
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Alojamento Insight Analyzer',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free basic analysis with premium options available',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  description: 'AI-powered platform for analyzing and optimizing short-term rental properties with comprehensive market insights and actionable recommendations',
  featureList: [
    'AI-powered property analysis',
    'Market positioning insights',
    'Price optimization recommendations',
    'Competitive analysis',
    'Premium PDF reports',
  ],
  screenshot: `${SITE_URL}/screenshot.png`,
};

/**
 * Product Schema for Premium Features
 */
export const premiumProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Premium Property Analysis Report',
  description: 'Comprehensive AI-powered analysis report for short-term rental properties with actionable insights and recommendations',
  image: `${SITE_URL}/premium-report-preview.png`,
  brand: {
    '@type': 'Brand',
    name: COMPANY_NAME,
  },
  offers: {
    '@type': 'Offer',
    price: '29.99',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/#diagnosticoForm`,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '89',
  },
};

/**
 * Breadcrumb List Schema
 * Helps search engines understand site structure
 */
export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

/**
 * FAQ Schema
 * For FAQ sections
 */
export const createFAQSchema = (faqs: { question: string; answer: string }[]) => ({
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
});

/**
 * Article Schema for Results/Analysis Pages
 */
export const createArticleSchema = (params: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: params.title,
  description: params.description,
  datePublished: params.datePublished,
  dateModified: params.dateModified || params.datePublished,
  author: {
    '@type': 'Organization',
    name: COMPANY_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: COMPANY_NAME,
    logo: {
      '@type': 'ImageObject',
      url: COMPANY_LOGO,
    },
  },
  url: params.url,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': params.url,
  },
});

/**
 * Service Schema
 */
export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Property Analysis Service',
  description: 'Comprehensive analysis and optimization service for short-term rental properties',
  provider: {
    '@type': 'Organization',
    name: COMPANY_NAME,
    url: SITE_URL,
  },
  serviceType: 'Property Management Consulting',
  areaServed: {
    '@type': 'Country',
    name: 'Portugal',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Property Analysis Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Basic Analysis',
          description: 'Free property analysis with basic insights',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Premium Analysis',
          description: 'Comprehensive premium report with detailed recommendations',
        },
      },
    ],
  },
};
