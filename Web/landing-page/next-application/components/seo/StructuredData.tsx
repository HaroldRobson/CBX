'use client';

import { businessData, generateLocalBusinessSchema, generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo/structured-data';

interface StructuredDataProps {
  type?: 'local-business' | 'organization' | 'website' | 'all';
  customData?: any;
}

export function StructuredData({ type = 'all', customData }: StructuredDataProps) {
  const data = customData || businessData;
  
  const schemas = [];
  
  if (type === 'local-business' || type === 'all') {
    schemas.push(generateLocalBusinessSchema(data));
  }
  
  if (type === 'organization' || type === 'all') {
    schemas.push(generateOrganizationSchema(data));
  }
  
  if (type === 'website' || type === 'all') {
    schemas.push(generateWebsiteSchema(data));
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
    </>
  );
}

// Service-specific structured data
export function ServiceStructuredData({ serviceName, description, price }: {
  serviceName: string;
  description: string;
  price?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": businessData.name,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": businessData.address.streetAddress,
        "addressLocality": businessData.address.addressLocality,
        "addressRegion": businessData.address.addressRegion,
        "postalCode": businessData.address.postalCode,
        "addressCountry": businessData.address.addressCountry
      },
      "telephone": businessData.phone
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "USD"
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  );
}