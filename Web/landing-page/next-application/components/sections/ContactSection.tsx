'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { NAP } from '@/components/seo/NAP';
import { businessData } from '@/lib/seo/structured-data';

export function ContactSection() {
  const { address, phone, email, openingHours } = businessData;

  const handleDirections = () => {
    const addressString = `${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion} ${address.postalCode}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <section id="contact" className="py-20" style={{ backgroundColor: '#171717' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Get in{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Ready to start your carbon offsetting journey? Contact our team for personalized assistance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Address</h4>
                    <p className="text-gray-400">
                      {address.streetAddress}<br />
                      {address.addressLocality}, {address.addressRegion} {address.postalCode}<br />
                      {address.addressCountry}
                    </p>
                    <button
                      onClick={handleDirections}
                      className="text-green-400 hover:text-green-300 text-sm mt-2 flex items-center"
                    >
                      Get Directions <ExternalLink className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Phone</h4>
                    <a 
                      href={`tel:${phone}`}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Email</h4>
                    <a 
                      href={`mailto:${email}`}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Business Hours</h4>
                    <div className="text-gray-400 space-y-1">
                      {openingHours.map((hours, index) => (
                        <div key={index}>{hours}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Business Profile Integration */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Find Us Online</h3>
              <p className="text-gray-400 mb-4">
                Connect with us on Google Business Profile for reviews, updates, and more information.
              </p>
              <button
                onClick={() => window.open('https://business.google.com/dashboard', '_blank')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                View on Google
              </button>
            </div>
          </motion.div>

          {/* Embedded Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Our Location</h3>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(`${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion}`)}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="CBX Office Location"
              />
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Located in the heart of {address.addressLocality}, we're easily accessible by public transportation and offer convenient parking.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}