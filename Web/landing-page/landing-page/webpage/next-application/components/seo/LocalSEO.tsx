'use client';

import { StructuredData } from './StructuredData';
import { businessData } from '@/lib/seo/structured-data';

interface LocalSEOProps {
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string[];
  locationKeywords?: string[];
  servicePage?: {
    serviceName: string;
    serviceDescription: string;
    price?: string;
  };
}

export function LocalSEO({ 
  pageTitle, 
  pageDescription, 
  pageKeywords = [], 
  locationKeywords = [],
  servicePage 
}: LocalSEOProps) {
  const { name, address } = businessData;
  const location = `${address.addressLocality}, ${address.addressRegion}`;
  
  // Generate location-specific keywords
  const defaultLocationKeywords = [
    `${name} ${location}`,
    `carbon credits ${location}`,
    `environmental services ${address.addressLocality}`,
    `blockchain ${address.addressRegion}`,
    `sustainable investing ${location}`
  ];
  
  const allKeywords = [
    ...pageKeywords,
    ...locationKeywords,
    ...defaultLocationKeywords
  ].join(', ');

  const title = pageTitle ? 
    `${pageTitle} | ${name} - ${location}` : 
    `${name} - Carbon Credits & Environmental Services in ${location}`;
    
  const description = pageDescription || 
    `Leading carbon credit platform in ${location}. Fractional retirement, blockchain verification, and NFT receipts. Serving ${address.addressLocality} and surrounding areas.`;

  return (
    <>
      {/* Meta tags for local SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      
      {/* Geographic meta tags */}
      <meta name="geo.region" content="GB-ENG" />
      <meta name="geo.placename" content={address.addressLocality} />
      <meta name="geo.position" content={`${businessData.coordinates.latitude};${businessData.coordinates.longitude}`} />
      <meta name="ICBM" content={`${businessData.coordinates.latitude}, ${businessData.coordinates.longitude}`} />
      
      {/* Open Graph local tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="business.business" />
      <meta property="og:url" content={businessData.website} />
      <meta property="og:image" content={businessData.image} />
      <meta property="og:locale" content="en_GB" />
      <meta property="business:contact_data:locality" content={address.addressLocality} />
      <meta property="business:contact_data:region" content={address.addressRegion} />
      <meta property="business:contact_data:country_name" content={address.addressCountry} />
      <meta property="business:contact_data:phone_number" content={businessData.phone} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={businessData.image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={businessData.website} />
      
      {/* Structured Data */}
      <StructuredData type="all" />
      
      {/* Service-specific structured data if provided */}
      {servicePage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": servicePage.serviceName,
              "description": servicePage.serviceDescription,
              "provider": {
                "@type": "LocalBusiness",
                "name": name,
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": address.streetAddress,
                  "addressLocality": address.addressLocality,
                  "addressRegion": address.addressRegion,
                  "postalCode": address.postalCode,
                  "addressCountry": address.addressCountry
                }
              },
              ...(servicePage.price && {
                "offers": {
                  "@type": "Offer",
                  "price": servicePage.price,
                  "priceCurrency": "USD"
                }
              })
            }, null, 2)
          }}
        />
      )}
    </>
  );
}