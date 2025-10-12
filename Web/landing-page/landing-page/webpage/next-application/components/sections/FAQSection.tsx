'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAnimateOnce } from '../../hooks/useOneDirectionalAnimation';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const titleAnimation = useAnimateOnce<HTMLDivElement>();
  const faqsAnimation = useAnimateOnce<HTMLDivElement>();

  const faqs = [
    {
      question: 'What makes CBX different from other carbon credit platforms?',
      answer: 'CBX lets you retire any amount of carbon credits, not just whole tonnes. We charge much lower fees than traditional brokers (who charge 20-40%). You get full transparency through our rating system. Every retirement comes with an NFT receipt. We built everything on Etherlink L2 to keep costs low.',
    },
    {
      question: 'How does fractional retirement work?',
      answer: 'You can retire 0.1 tonnes, 0.5 tonnes, or any amount you want. Our smart contract collects fractional amounts from different users. When we have enough fractions to make whole tonnes, we retire them with Verra. This makes carbon offsetting affordable for everyone.',
    },
    {
      question: 'What are NFT retirement receipts?',
      answer: 'Every time you retire credits with CBX, you get an NFT from Verra. This NFT proves you retired the credits. It cannot be faked or changed. The NFT shows your exact amount in its metadata. This creates a permanent record on the blockchain.',
    },
    {
      question: 'How does the credit rating system work?',
      answer: 'We built an algorithm that checks carbon credit quality. It looks at the project methodology, additionality, permanence, leakage risk, and verification standards. You get a score from 1-100. Higher scores mean better, more reliable credits.',
    },
    {
      question: 'What is Etherlink L2 and why do you use it?',
      answer: 'Etherlink L2 is a blockchain that works on top of Ethereum. It has much lower gas costs than regular Ethereum. This makes our fractional retirement system affordable. You can offset small amounts without paying huge fees.',
    },
    {
      question: 'Are the carbon credits verified?',
      answer: 'Yes, all our credits are verified. They come from Verra, the world\'s largest voluntary carbon standard. We only buy VCS Gold rated credits. These are high-quality credits from established projects.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-32 bg-white dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Side - Title (takes up 5 columns) */}
          <motion.div
            ref={titleAnimation.ref}
            initial={{ opacity: 0, x: -20 }}
            animate={titleAnimation.isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <h2 className="text-6xl md:text-7xl font-bold leading-tight">
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Frequently Asked Questions
              </span>
            </h2>
          </motion.div>

          {/* Right Side - FAQ Cards (takes up 7 columns) */}
          <motion.div
            ref={faqsAnimation.ref}
            initial={{ opacity: 0, x: 20 }}
            animate={faqsAnimation.isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-7 space-y-4"
          >
            {faqs.map((faq, index) => {
              const faqAnimation = useAnimateOnce<HTMLDivElement>();
              return (
                <motion.div
                  key={index}
                  ref={faqAnimation.ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, delay: 0.2 + (index * 0.05), ease: "easeOut" }}
                >
                  <div className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-2xl hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <span className="text-lg font-medium text-gray-800 dark:text-gray-300 pr-4 leading-relaxed">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 border-t border-gray-300 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed pt-4">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}