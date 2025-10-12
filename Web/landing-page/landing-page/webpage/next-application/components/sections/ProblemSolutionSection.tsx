'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView as useFramerInView } from 'framer-motion';
import { useAnimateOnce } from '../../hooks/useOneDirectionalAnimation';

// Remove the old bidirectional animation system entirely
// and replace with one-directional animations

// Custom hook to detect when an element is in the viewport (keeping for compatibility)
const useInView = (options: IntersectionObserverInit): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Update state based on whether element is in view.
      setIsInView(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isInView];
};

// Animated Row component for table comparisons
interface AnimatedRowProps {
  children: React.ReactNode;
  index: number;
}

const AnimatedRow: React.FC<AnimatedRowProps> = ({ children, index }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const style = {
    transition: 'all 0.3s ease-out',
    transitionDelay: `${index * 0.05}s`,
    opacity: isInView ? 1 : 0,
    transform: isInView ? 'translateY(0)' : 'translateY(20px)',
  };

  return (
    <div ref={ref} style={style} key={isInView ? 'visible' : 'hidden'}>
      {children}
    </div>
  );
};

export function ProblemSolutionSection() {
  const titleAnimation = useAnimateOnce<HTMLDivElement>();
  const col1Animation = useAnimateOnce<HTMLDivElement>();
  const col2Animation = useAnimateOnce<HTMLDivElement>();
  const col3Animation = useAnimateOnce<HTMLDivElement>();

  const comparisons = [
    {
      feature: 'Fees',
      cbx: '0.5-2% total',
      traditional: '20-40% of credit value',
    },
    {
      feature: 'Minimum Amount',
      cbx: 'Any amount (0.01 tonnes)',
      traditional: 'Full tonnes only (1+ tonnes)',
    },
    {
      feature: 'Transparency',
      cbx: 'Full project ratings visible',
      traditional: 'Limited information shared',
    },
    {
      feature: 'Settlement',
      cbx: 'Instant on-chain',
      traditional: '2-6 weeks processing',
    },
    {
      feature: 'Proof of Retirement',
      cbx: 'Immutable NFT receipts',
      traditional: 'PDF certificates (forgeable)',
    },
    {
      feature: 'Credit Quality',
      cbx: 'VCS Gold standard only',
      traditional: 'Mixed quality sources',
    },
  ];

  // Styled comparison row component
  const ComparisonRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex items-center h-16 ${className}`}>
      {children}
    </div>
  );

  return (
    <section className="py-24 bg-white dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={titleAnimation.ref}
          initial={{ opacity: 0, y: 20 }}
          animate={titleAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Why CBX
              </span>
            </h2>
          </div>
        </motion.div>

        {/* Main Comparison Table Container */}
        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout - Stacked */}
          <div className="block md:hidden space-y-8">
            {/* Mobile CBX Card */}
            <motion.div
              ref={col2Animation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={col2Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
              className="bg-gradient-to-b from-green-600 to-emerald-800 rounded-2xl shadow-2xl shadow-green-500/20 mx-4"
            >
              <div className="h-20 flex items-center justify-center">
                <h3 className="text-white font-bold text-3xl">CBX</h3>
              </div>
              <div className="space-y-3 px-6 pb-6">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.cbx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={col2Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.25 + (index * 0.05), ease: "easeOut" }}
                    className="bg-white/10 rounded-lg p-4"
                  >
                    <div className="mb-2">
                      <span className="text-green-200 font-medium text-sm uppercase tracking-wide">
                        {comparison.feature}
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium text-sm leading-relaxed">
                        {comparison.cbx}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Mobile Traditional Brokers Card */}
            <motion.div
              ref={col3Animation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={col3Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl mx-4"
            >
              <div className="h-20 flex items-center justify-center">
                <h3 className="text-gray-400 font-bold text-2xl text-center px-4">Traditional Brokers</h3>
              </div>
              <div className="space-y-3 px-6 pb-6">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.traditional}
                    initial={{ opacity: 0, y: 20 }}
                    animate={col3Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.3 + (index * 0.05), ease: "easeOut" }}
                    className="bg-gray-700/30 rounded-lg p-4"
                  >
                    <div className="mb-2">
                      <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">
                        {comparison.feature}
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-400 font-medium text-sm leading-relaxed">
                        {comparison.traditional}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Desktop Layout - 3 Column Grid */}
          <div className="hidden md:grid grid-cols-3 items-start gap-x-8 lg:gap-x-12">
            
            {/* Column 1: Feature Labels (Right aligned to be closer to the center column) */}
            <motion.div
              ref={col1Animation.ref}
              initial={{ opacity: 0, x: -20 }}
              animate={col1Animation.isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
              className="text-right pr-4 lg:pr-8"
            >
              <div className="h-32"></div> {/* Spacer to align with headers */}
              <div className="space-y-2">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.feature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={col1Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.2 + (index * 0.05), ease: "easeOut" }}
                  >
                    <ComparisonRow className="justify-end">
                      <span className="text-gray-800 dark:text-gray-300 font-medium text-base lg:text-lg">
                        {comparison.feature}
                      </span>
                    </ComparisonRow>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Column 2: CBX (Single Card) */}
            <motion.div
              ref={col2Animation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={col2Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
              className="bg-gradient-to-b from-green-600 to-emerald-800 rounded-2xl shadow-2xl shadow-green-500/20"
            >
              <div className="h-32 flex items-center justify-center">
                <h3 className="text-white font-bold text-4xl lg:text-5xl">CBX</h3>
              </div>
              <div className="space-y-2 px-6 lg:px-10 pb-6">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.cbx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={col2Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.25 + (index * 0.05), ease: "easeOut" }}
                  >
                    <ComparisonRow className="justify-start">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-medium text-sm lg:text-base">
                          {comparison.cbx}
                        </span>
                      </div>
                    </ComparisonRow>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Column 3: Traditional Brokers (Left Aligned) */}
            <motion.div
              ref={col3Animation.ref}
              initial={{ opacity: 0, x: 20 }}
              animate={col3Animation.isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
              className="text-left pl-4 lg:pl-8"
            >
              <div className="h-32 flex items-center justify-center">
                <h3 className="text-gray-400 font-bold text-2xl lg:text-3xl text-center">Traditional Brokers</h3>
              </div>
              <div className="space-y-2">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.traditional}
                    initial={{ opacity: 0, y: 20 }}
                    animate={col3Animation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.3 + (index * 0.05), ease: "easeOut" }}
                  >
                    <ComparisonRow className="justify-start">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 lg:w-6 lg:h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm lg:text-base">
                          {comparison.traditional}
                        </span>
                      </div>
                    </ComparisonRow>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
