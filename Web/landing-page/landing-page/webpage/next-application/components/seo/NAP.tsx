'use client';

import { businessData } from '@/lib/seo/structured-data';
import { Phone, Mail, MapPin } from 'lucide-react';

interface NAPProps {
  variant?: 'full' | 'minimal' | 'inline';
  showIcons?: boolean;
  className?: string;
}

export function NAP({ variant = 'full', showIcons = true, className = '' }: NAPProps) {
  const { name, address, phone, email } = businessData;
  
  const formatAddress = () => {
    return `${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion} ${address.postalCode}`;
  };

  if (variant === 'inline') {
    return (
      <span className={`text-gray-600 dark:text-gray-400 ${className}`}>
        {name} • {formatAddress()} • {phone}
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
        <div className="text-gray-600 dark:text-gray-400">{formatAddress()}</div>
        <div className="text-gray-600 dark:text-gray-400">{phone}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="font-bold text-xl text-gray-900 dark:text-white">{name}</div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          {showIcons && <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />}
          <div className="text-gray-600 dark:text-gray-400">
            <div>{address.streetAddress}</div>
            <div>{address.addressLocality}, {address.addressRegion} {address.postalCode}</div>
            <div>{address.addressCountry}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {showIcons && <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />}
          <a 
            href={`tel:${phone}`}
            className="text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
          >
            {phone}
          </a>
        </div>
        
        <div className="flex items-center space-x-3">
          {showIcons && <Mail className="w-5 h-5 text-green-500 flex-shrink-0" />}
          <a 
            href={`mailto:${email}`}
            className="text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}

// Microdata version for additional SEO benefit
export function NAPMicrodata({ className = '' }: { className?: string }) {
  const { name, address, phone, email } = businessData;

  return (
    <div className={className} itemScope itemType="https://schema.org/LocalBusiness">
      <div className="font-bold text-xl" itemProp="name">{name}</div>
      
      <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
        <div itemProp="streetAddress">{address.streetAddress}</div>
        <div>
          <span itemProp="addressLocality">{address.addressLocality}</span>, 
          <span itemProp="addressRegion"> {address.addressRegion}</span> 
          <span itemProp="postalCode">{address.postalCode}</span>
        </div>
        <div itemProp="addressCountry">{address.addressCountry}</div>
      </div>
      
      <div>
        Phone: <span itemProp="telephone">{phone}</span>
      </div>
      
      <div>
        Email: <span itemProp="email">{email}</span>
      </div>
    </div>
  );
}