'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, Building, Leaf } from 'lucide-react';
import { businessData } from '@/lib/seo/structured-data';

export function LocationContent() {
  const { address } = businessData;
  const city = address.addressLocality;
  const state = address.addressRegion;

  const locationStats = [
    {
      icon: Building,
      value: '500+',
      label: 'Local Businesses Served',
      description: `Helping ${city} companies achieve carbon neutrality`
    },
    {
      icon: Users,
      value: '2,500+',
      label: 'Community Members',
      description: `Active environmental advocates in ${city}`
    },
    {
      icon: Leaf,
      value: '10,000+',
      label: 'Tonnes CO₂ Offset',
      description: `Carbon impact reduced in ${state}`
    },
    {
      icon: MapPin,
      value: '50+',
      label: 'Partner Locations',
      description: `Verified projects across ${state}`
    }
  ];

  const localServices = [
    {
      title: 'Corporate Carbon Consulting',
      description: `Specialized consulting for ${city} businesses looking to implement comprehensive carbon reduction strategies.`,
      features: ['Carbon footprint assessment', 'Reduction planning', 'Offset strategy development']
    },
    {
      title: 'Local Project Verification',
      description: `On-site verification of carbon offset projects throughout ${state} and surrounding regions.`,
      features: ['Project site visits', 'Quality assurance', 'Compliance verification']
    },
    {
      title: 'Community Education Programs',
      description: `Educational workshops and seminars for ${city} organizations and community groups.`,
      features: ['Sustainability workshops', 'Carbon literacy training', 'Best practices sharing']
    }
  ];

  return (
    <section className="py-20" style={{ backgroundColor: '#171717' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Location Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Serving{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {city}
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            As a leading carbon credit platform based in {city}, {state}, we're committed to helping local businesses 
            and individuals make a meaningful environmental impact through transparent, verified carbon offsetting.
          </p>
        </motion.div>

        {/* Location Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {locationStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
                <stat.icon className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.label}</h3>
              <p className="text-gray-500 text-sm">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Local Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-4xl font-bold text-white text-center mb-12">
            Local Services in {city}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {localServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + (index * 0.1) }}
                viewport={{ once: true }}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-8"
              >
                <h4 className="text-xl font-bold text-white mb-4">{service.title}</h4>
                <p className="text-gray-400 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Local Partnerships */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-6">
            Proud Partner of {city} Sustainability Initiative
          </h3>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            We work closely with local government, businesses, and environmental organizations 
            to advance {city}'s climate goals and create a more sustainable future for our community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full">
              {city} Climate Action Plan
            </span>
            <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full">
              {state} Green Business Network
            </span>
            <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full">
              Local Environmental Council
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}