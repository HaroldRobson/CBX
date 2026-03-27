'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AccessibleCarousel } from '@/components/ui/AccessibleCarousel';

export function TestimonialsSection() {

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Sustainability Director',
      company: 'GreenTech Solutions',
      content: 'CBX has revolutionized how we approach carbon offsetting. The transparency and NFT receipts give us complete confidence in our environmental impact.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Environmental Consultant',
      company: 'EcoConsult',
      content: 'The fractional retirement feature is game-changing. We can now offset smaller amounts efficiently, making carbon neutrality accessible to all our clients.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      name: 'Emma Thompson',
      role: 'CEO',
      company: 'Clean Energy Corp',
      content: 'Finally, a platform that combines the best of traditional carbon markets with blockchain transparency. The rating system helps us choose quality credits.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  const carouselItems = testimonials.map((testimonial, index) => ({
    id: `testimonial-${index}`,
    ariaLabel: `Testimonial from ${testimonial.name}, ${testimonial.role} at ${testimonial.company}`,
    content: (
      <Card className="bg-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardContent className="p-12">
          <div className="flex items-center justify-center mb-8">
            <Quote className="w-12 h-12 text-green-400" />
          </div>
          
          <blockquote className="text-2xl text-gray-300 leading-relaxed mb-8 text-center">
            "{testimonial.content}"
          </blockquote>
          
          <div className="flex justify-center mb-6">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="text-center">
              <h4 className="font-semibold text-white">
                {testimonial.name}
              </h4>
              <p className="text-gray-400">
                {testimonial.role}
              </p>
              <p className="text-green-400 text-sm font-medium">
                {testimonial.company}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }));

  return (
    <section className="py-20" style={{ backgroundColor: '#171717' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join thousands of organizations and individuals who trust CBX 
            for their carbon offsetting needs.
          </p>
        </motion.div>

        <AccessibleCarousel
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={5000}
          showControls={true}
          showIndicators={true}
          className="max-w-4xl mx-auto"
        />
      </div>
    </section>
  );
}