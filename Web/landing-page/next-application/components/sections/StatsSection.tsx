'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Leaf, Award } from 'lucide-react';
import { CounterAnimation } from '@/components/ui/CounterAnimation';

export function StatsSection() {
  const stats = [
    {
      icon: Leaf,
      value: 15420,
      suffix: ' tonnes',
      label: 'CO₂ Offset',
      description: 'Total carbon dioxide retired through our platform',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      icon: Award,
      value: 2847,
      suffix: ' credits',
      label: 'Credits Retired',
      description: 'High-quality carbon credits processed',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: Users,
      value: 1205,
      suffix: ' users',
      label: 'Active Users',
      description: 'People making a difference through CBX',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: TrendingUp,
      value: 89,
      suffix: '%',
      label: 'Average Rating',
      description: 'Quality score of credits in our pool',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden" style={{ backgroundColor: '#171717' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0 bg-repeat" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Making Real Impact
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our community is actively fighting climate change through transparent, 
            verifiable carbon credit retirement on the blockchain.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className={`bg-gray-800 border ${stat.borderColor} rounded-2xl p-8 hover:border-opacity-60 transition-all duration-300 group`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                
                <div className="text-4xl font-bold text-white mb-2">
                  <CounterAnimation 
                    value={stat.value} 
                    duration={2000}
                    suffix={stat.suffix}
                  />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-300 mb-3">
                  {stat.label}
                </h3>
                
                <p className="text-gray-500 text-sm">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Powered by Etherlink L2
            </h3>
            <p className="text-gray-400 text-lg">
              Our fractional retirement system is only possible thanks to the low gas costs 
              and high throughput of Etherlink L2, making carbon offsetting accessible to everyone.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}