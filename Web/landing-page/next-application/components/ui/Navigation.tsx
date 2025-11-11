'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NavigationProps {
  navItems?: { name: string; href: string }[];
  showWaitlistButton?: boolean;
}

export function Navigation({ 
  navItems = [
    { name: 'Rate Credits', href: '#rate-credits' },
    { name: 'Comparison', href: '#comparison' },
    { name: 'How it Works', href: '#how-it-works' },
  ],
  showWaitlistButton = true 
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize immediately after mount
    setIsInitialized(true);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const scrollToWaitlist = () => {
    const element = document.querySelector('#waitlist');
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className={`absolute inset-0 ${scrolled ? 'bg-white/80 dark:bg-[#171717]/80' : 'bg-transparent'}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 relative">
          {/* Logo - Left Side */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: isInitialized ? 0.1 : 0 }}
            className="flex items-center -ml-4 z-10"
          >
            <Link href="/" className="text-4xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
              CBX
            </Link>
          </motion.div>

          {/* Desktop Navigation - Center (absolutely centered) */}
          {navItems.length > 0 && (
            <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center z-0">
              <div className="flex items-center space-x-8">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isInitialized ? index * 0.02 : 0, duration: isInitialized ? 0.1 : 0 }}
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-100 font-medium"
                  >
                    {item.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Right Side - Waitlist Button and Theme Toggle */}
          <div className="flex items-center space-x-4 mr-4">
            {/* Waitlist Button */}
            {showWaitlistButton && (
              <motion.button
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: isInitialized ? 0.1 : 0 }}
                onClick={scrollToWaitlist}
                whileHover={{ scale: 1.02 }}
                className="hidden md:flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-2 rounded-full font-medium transition-all duration-100 mr-4 group"
              >
                <span style={{ color: '#04221b' }}>Waitlist</span>
                <motion.div
                  className="ml-2"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <ArrowRight className="w-5 h-5" style={{ color: '#04221b' }} />
                </motion.div>
              </motion.button>
            )}

            {/* Theme Toggle - Just Icon */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-gray-300 hover:text-white transition-colors duration-100"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-gray-900" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-800 bg-white dark:bg-[#171717]"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-100"
                >
                  {item.name}
                </button>
              ))}
              {showWaitlistButton && (
                <button
                  onClick={scrollToWaitlist}
                  className="flex items-center w-full px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md font-medium transition-colors duration-100"
                >
                  <span style={{ color: '#0a531c' }}>Waitlist</span>
                  <ArrowRight className="ml-2 w-4 h-4" style={{ color: '#0a531c' }} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}