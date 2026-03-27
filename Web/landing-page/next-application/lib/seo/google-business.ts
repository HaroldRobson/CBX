// Google Business Profile Integration Utilities
export interface GoogleBusinessConfig {
  placeId: string;
  businessName: string;
  apiKey?: string;
}

export const googleBusinessConfig: GoogleBusinessConfig = {
  placeId: 'YOUR_GOOGLE_PLACE_ID', // Replace with actual Place ID
  businessName: 'CBX',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
};

// Generate Google Business Profile URLs
export function generateGoogleBusinessUrls(config: GoogleBusinessConfig) {
  const encodedBusinessName = encodeURIComponent(config.businessName);
  
  return {
    // Direct link to Google Business Profile
    profile: `https://www.google.com/maps/place/${encodedBusinessName}`,
    
    // Link to write a review
    review: `https://search.google.com/local/writereview?placeid=${config.placeId}`,
    
    // Link to view reviews
    reviews: `https://www.google.com/maps/place/${encodedBusinessName}/reviews`,
    
    // Link to get directions
    directions: `https://www.google.com/maps/dir/?api=1&destination_place_id=${config.placeId}`,
    
    // Link to call business
    call: `https://www.google.com/maps/place/${encodedBusinessName}?action=call`,
    
    // Link to view photos
    photos: `https://www.google.com/maps/place/${encodedBusinessName}/photos`
  };
}

// Google Business Profile widget data
export function generateBusinessProfileWidget() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": googleBusinessConfig.businessName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Sarah Johnson"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        },
        "reviewBody": "Excellent service and transparent carbon offsetting. CBX made it easy for our company to achieve carbon neutrality."
      }
    ]
  };
}

// Instructions for Google Business Profile optimization
export const googleBusinessOptimization = {
  profile: {
    title: "Complete your Google Business Profile",
    tasks: [
      "Verify your business address and phone number",
      "Add high-quality photos of your office and team",
      "Write a compelling business description with local keywords",
      "Add your business hours and holiday schedules",
      "Include your website URL and social media links",
      "Add relevant business categories and attributes",
      "Enable messaging and Q&A features"
    ]
  },
  
  posts: {
    title: "Regular Google Business Posts",
    suggestions: [
      "Share updates about new carbon credit projects",
      "Post about local environmental initiatives",
      "Highlight customer success stories",
      "Share educational content about carbon offsetting",
      "Announce company news and events",
      "Post seasonal environmental tips"
    ]
  },
  
  reviews: {
    title: "Review Management Strategy",
    actions: [
      "Respond to all reviews within 24-48 hours",
      "Thank customers for positive reviews",
      "Address concerns in negative reviews professionally",
      "Encourage satisfied customers to leave reviews",
      "Include review requests in follow-up communications",
      "Monitor review trends and feedback themes"
    ]
  },
  
  keywords: {
    title: "Local SEO Keywords to Target",
    primary: [
      "carbon credits London",
      "environmental services London",
      "carbon offsetting UK",
      "sustainability consulting London"
    ],
    secondary: [
      "green business London",
      "climate solutions UK",
      "carbon neutral London",
      "environmental consulting UK"
    ]
  }
};