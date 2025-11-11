// Structured Data for Local Business
export interface LocalBusinessData {
  name: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone: string;
  email: string;
  website: string;
  businessType: string;
  openingHours: string[];
  priceRange: string;
  image: string;
  logo: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  paymentAccepted: string[];
}

export const businessData: LocalBusinessData = {
  name: "CBX",
  description: "Revolutionary carbon credit platform offering fractional retirement with blockchain verification and NFT receipts.",
  address: {
    streetAddress: "London",
    addressLocality: "London",
    addressRegion: "England",
    postalCode: "",
    addressCountry: "GB"
  },
  phone: "+44-20-CBX-EARTH",
  email: "contact@cbx.earth",
  website: "https://cbx.earth",
  businessType: "FinancialService",
  openingHours: [
    "Mo-Fr 09:00-18:00",
    "Sa 10:00-15:00"
  ],
  priceRange: "£££",
  image: "https://cbx.earth/images/office.jpg",
  logo: "https://cbx.earth/images/logo.png",
  socialMedia: {
    twitter: "https://twitter.com/cbxearth",
    linkedin: "https://linkedin.com/company/cbxearth"
  },
  coordinates: {
    latitude: 51.5074,
    longitude: -0.1278
  },
  services: [
    "Carbon Credit Trading",
    "Fractional Carbon Retirement",
    "Blockchain Verification",
    "Environmental Consulting"
  ],
  paymentAccepted: [
    "Credit Card",
    "Bank Transfer (UK)",
    "Cryptocurrency",
    "SEPA Transfer"
  ]
};

export function generateLocalBusinessSchema(data: LocalBusinessData) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": data.website,
    "name": data.name,
    "description": data.description,
    "url": data.website,
    "telephone": data.phone,
    "email": data.email,
    "image": [data.image, data.logo],
    "logo": data.logo,
    "priceRange": data.priceRange,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address.streetAddress,
      "addressLocality": data.address.addressLocality,
      "addressRegion": data.address.addressRegion,
      "postalCode": data.address.postalCode,
      "addressCountry": data.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": data.coordinates.latitude,
      "longitude": data.coordinates.longitude
    },
    "openingHoursSpecification": data.openingHours.map(hours => {
      const [days, time] = hours.split(' ');
      const [opens, closes] = time.split('-');
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": days.split('-').map(day => {
          const dayMap: { [key: string]: string } = {
            'Mo': 'Monday',
            'Tu': 'Tuesday',
            'We': 'Wednesday',
            'Th': 'Thursday',
            'Fr': 'Friday',
            'Sa': 'Saturday',
            'Su': 'Sunday'
          };
          return dayMap[day] || day;
        }),
        "opens": opens,
        "closes": closes
      };
    }),
    "sameAs": Object.values(data.socialMedia).filter(Boolean),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Carbon Credit Services",
      "itemListElement": data.services.map((service, index) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      }))
    },
    "paymentAccepted": data.paymentAccepted,
    "currenciesAccepted": "USD"
  };
}

export function generateOrganizationSchema(data: LocalBusinessData) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.name,
    "url": data.website,
    "logo": data.logo,
    "description": data.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address.streetAddress,
      "addressLocality": data.address.addressLocality,
      "addressRegion": data.address.addressRegion,
      "postalCode": data.address.postalCode,
      "addressCountry": data.address.addressCountry
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": data.phone,
      "contactType": "customer service",
      "email": data.email,
      "availableLanguage": "English"
    },
    "sameAs": Object.values(data.socialMedia).filter(Boolean)
  };
}

export function generateWebsiteSchema(data: LocalBusinessData) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": data.name,
    "url": data.website,
    "description": data.description,
    "publisher": {
      "@type": "Organization",
      "name": data.name,
      "logo": data.logo
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${data.website}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}