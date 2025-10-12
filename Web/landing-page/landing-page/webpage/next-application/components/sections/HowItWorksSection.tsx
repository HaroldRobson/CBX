'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAnimateOnce } from '../../hooks/useOneDirectionalAnimation';

export function HowItWorksSection() {
  const titleAnimation = useAnimateOnce<HTMLHeadingElement>();
  const descriptionAnimation = useAnimateOnce<HTMLParagraphElement>();
  const timelineAnimation = useAnimateOnce<HTMLDivElement>();

  const steps = [
    {
      number: '1',
      title: 'Source Quality Credits',
      description: 'CBX purchases high-quality VCS Gold rated credits from Verra and pools them for maximum liquidity and transparency.',
    },
    {
      number: '2',
      title: 'Tokenize on Blockchain',
      description: 'Each credit becomes a CBX token on Etherlink L2, enabling fractional ownership, trading, and transparent tracking.',
    },
    {
      number: '3',
      title: 'Fractional Retirement',
      description: 'Our smart contract matches fractional tokens to form integer amounts for efficient retirement with Verra.',
    },
    {
      number: '4',
      title: 'Instant Settlement',
      description: 'On-chain settlement happens instantly with full transparency and immutable records on the blockchain.',
    },
    {
      number: '5',
      title: 'NFT Proof Receipt',
      description: 'Receive immutable NFT retirement receipts from Verra with your fractional amount recorded in the metadata.',
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-white dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Title and Description */}
          <div className="lg:sticky lg:top-32">
            <motion.h2
              ref={titleAnimation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={titleAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-5xl md:text-6xl font-bold leading-tight mb-8"
            >
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                How it works?
              </span>
            </motion.h2>
            <motion.p
              ref={descriptionAnimation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={descriptionAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
              className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8"
            >
              We revolutionize carbon credit markets through blockchain technology, 
              making fractional retirement accessible with full transparency and lower fees.
            </motion.p>
            
            {/* Decorative Arrow - Static, no animation */}
            <div className="hidden lg:block mt-16">
              <svg 
                className="w-64 h-32" 
                viewBox="0 0 256 128" 
                fill="none"
              >
                <path
                  d="M20 100 Q 80 20, 200 60"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  fill="none"
                  className="opacity-60"
                />
                <path
                  d="M190 55 L200 60 L190 65"
                  stroke="#10b981"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-60"
                />
              </svg>
            </div>
          </div>

          {/* Right Side - Steps Timeline */}
          <motion.div
            ref={timelineAnimation.ref}
            initial={{ opacity: 0, x: 20 }}
            animate={timelineAnimation.isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Vertical Line - Static */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-700"></div>
            
            <div className="space-y-8">
              {steps.map((step, index) => {
                const stepAnimation = useAnimateOnce<HTMLDivElement>();
                return (
                  <motion.div
                    key={index}
                    ref={stepAnimation.ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={stepAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: 0.3 + (index * 0.1),
                      ease: "easeOut"
                    }}
                    className="relative flex items-start space-x-6"
                  >
                    {/* Step Number Circle */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{step.number}</span>
                      </div>
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 pb-8">
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}