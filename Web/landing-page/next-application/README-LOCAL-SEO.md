# Local SEO Implementation Guide

This implementation provides comprehensive local SEO elements for your business website, including structured data markup, Google Business Profile integration, and NAP consistency.

## 🎯 Features Implemented

### 1. Structured Data Markup
- **LocalBusiness Schema**: Complete business information with address, phone, hours
- **Organization Schema**: Company details and contact information  
- **Website Schema**: Site-wide structured data with search functionality
- **Service Schema**: Individual service pages with pricing and descriptions

### 2. NAP (Name, Address, Phone) Consistency
- **Centralized Business Data**: Single source of truth in `lib/seo/structured-data.ts`
- **Reusable NAP Component**: Multiple display variants (full, minimal, inline)
- **Microdata Support**: Additional semantic markup for search engines
- **Consistent Formatting**: Standardized display across all pages

### 3. Google Business Profile Integration
- **Direct Profile Links**: Easy access to Google Business listing
- **Review Management**: Links for customers to leave reviews
- **Directions Integration**: One-click directions to your location
- **Business Hours Display**: Structured opening hours information

### 4. Location-Specific Content
- **Local Landing Pages**: City and region-specific content
- **Community Engagement**: Local partnerships and initiatives
- **Service Area Coverage**: Geographic service boundaries
- **Local Statistics**: Community impact metrics

### 5. Technical SEO Elements
- **Geographic Meta Tags**: Latitude/longitude coordinates
- **Open Graph Local Tags**: Social media optimization
- **Canonical URLs**: Prevent duplicate content issues
- **Sitemap Generation**: Automated sitemap with local pages

## 🚀 Quick Setup

### 1. Update Business Information
Edit `lib/seo/structured-data.ts` with your actual business details:

```typescript
export const businessData: LocalBusinessData = {
  name: "Your Business Name",
  address: {
    streetAddress: "123 Your Street",
    addressLocality: "Your City",
    addressRegion: "Your State",
    postalCode: "12345",
    addressCountry: "US"
  },
  phone: "+1-555-YOUR-PHONE",
  email: "contact@yourbusiness.com",
  // ... other details
};
```

### 2. Add Google Maps API Key
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to your environment variables:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Set Up Google Business Profile
1. Claim your business on [Google Business Profile](https://business.google.com/)
2. Get your Place ID from [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
3. Update `lib/seo/google-business.ts` with your Place ID

## 📱 Components Usage

### LocalSEO Component
Add to any page for comprehensive local SEO:
```tsx
import { LocalSEO } from '@/components/seo/LocalSEO';

<LocalSEO 
  pageTitle="Custom Page Title"
  pageDescription="Page-specific description"
  pageKeywords={['keyword1', 'keyword2']}
  locationKeywords={['city-specific', 'local-terms']}
/>
```

### NAP Component
Display business contact information consistently:
```tsx
import { NAP } from '@/components/seo/NAP';

// Full contact display
<NAP variant="full" showIcons={true} />

// Minimal display
<NAP variant="minimal" showIcons={false} />

// Inline display
<NAP variant="inline" />
```

### Structured Data
Add structured data to specific pages:
```tsx
import { StructuredData, ServiceStructuredData } from '@/components/seo/StructuredData';

// General business data
<StructuredData type="local-business" />

// Service-specific data
<ServiceStructuredData 
  serviceName="Carbon Credit Consulting"
  description="Professional carbon offset consulting services"
  price="$500"
/>
```

## 🎨 Customization

### Adding New Locations
1. Update `businessData.services` array with location-specific services
2. Create location-specific pages in your routing structure
3. Add location URLs to sitemap generation

### Service Pages
Create individual service pages with:
```tsx
<LocalSEO 
  servicePage={{
    serviceName: "Your Service Name",
    serviceDescription: "Detailed service description",
    price: "$100"
  }}
/>
```

### Review Integration
Encourage customer reviews by:
1. Adding review request buttons using `generateGoogleBusinessUrls()`
2. Following up with customers via email
3. Responding to all reviews promptly

## 📊 SEO Benefits

### Search Engine Optimization
- **Rich Snippets**: Enhanced search results with business information
- **Local Pack Rankings**: Improved visibility in "Map Pack" results
- **Knowledge Panel**: Potential inclusion in Google Knowledge Graph
- **Voice Search**: Optimized for "near me" voice queries

### User Experience
- **Quick Contact**: Easy access to phone, email, and directions
- **Business Hours**: Clear availability information
- **Social Proof**: Integration with Google reviews and ratings
- **Mobile Optimization**: Responsive design for all devices

## 🔧 Maintenance

### Regular Updates
- **Business Hours**: Update for holidays and schedule changes
- **Contact Information**: Keep phone and email current
- **Services**: Add new offerings and remove discontinued ones
- **Reviews**: Monitor and respond to customer feedback

### Performance Monitoring
- **Google Search Console**: Track local search performance
- **Google Analytics**: Monitor local traffic and conversions
- **Google Business Profile Insights**: Review customer interactions
- **Schema Markup Testing**: Validate structured data regularly

## 📈 Advanced Features

### Multi-Location Support
For businesses with multiple locations:
1. Create location-specific data objects
2. Generate separate structured data for each location
3. Implement location-based routing
4. Maintain separate Google Business Profiles

### International SEO
For global businesses:
1. Add `hreflang` tags for different languages/regions
2. Create country-specific structured data
3. Implement geo-targeting in meta tags
4. Use appropriate currency and contact formats

This implementation provides a solid foundation for local SEO success. Regular maintenance and optimization based on performance data will help maximize your local search visibility.