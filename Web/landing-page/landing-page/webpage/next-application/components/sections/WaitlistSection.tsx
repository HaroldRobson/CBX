'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimateOnce } from '../../hooks/useOneDirectionalAnimation';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidEmailFormat, setIsValidEmailFormat] = useState(true);
  
  const mainAnimation = useAnimateOnce<HTMLDivElement>();
  const titleAnimation = useAnimateOnce<HTMLHeadingElement>();
  const descriptionAnimation = useAnimateOnce<HTMLParagraphElement>();
  const formAnimation = useAnimateOnce<HTMLFormElement>();

  // Retry failed submissions on component mount
  useEffect(() => {
    const retryFailedSubmissions = () => {
      const failedEmails = JSON.parse(localStorage.getItem('failedEmailSubmissions') || '[]');
      if (failedEmails.length > 0) {
        console.log(`Retrying ${failedEmails.length} failed email submissions...`);
        failedEmails.forEach((submission: any) => {
          submitEmailInBackground(submission.email);
        });
      }
    };

    // Retry failed submissions after a short delay
    const timeout = setTimeout(retryFailedSubmissions, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Client-side email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input change with real-time validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError(''); // Clear any previous errors
    
    // Real-time validation
    if (newEmail.trim() === '') {
      setIsValidEmailFormat(true); // Don't show error for empty field
    } else {
      setIsValidEmailFormat(isValidEmail(newEmail.trim()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailToSubmit = email.trim();
    
    // Quick client-side validation
    if (!isValidEmail(emailToSubmit)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Immediate optimistic UI update
    setIsLoading(true);
    setError('');
    
    // Quick validation and immediate success feedback
    setTimeout(() => {
      setIsSubmitted(true);
      setEmail('');
      setIsLoading(false);
    }, 50); // Even faster feedback
    
    // Background processing - don't await this
    submitEmailInBackground(emailToSubmit);
  };

  const submitEmailInBackground = async (email: string) => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      // Check if response has content before trying to parse JSON
      let data = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Response is not JSON, get as text for debugging
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned ${response.status}: ${textResponse || 'Unknown error'}`);
      }

      if (!response.ok) {
        console.error('Background submission failed:', data?.error || 'Unknown error');
        // Store in localStorage for retry later
        const failedEmails = JSON.parse(localStorage.getItem('failedEmailSubmissions') || '[]');
        failedEmails.push({
          email,
          timestamp: new Date().toISOString(),
          error: data?.error || `HTTP ${response.status}`,
          status: response.status
        });
        localStorage.setItem('failedEmailSubmissions', JSON.stringify(failedEmails));
      } else {
        console.log('Email successfully submitted to Google Sheets');
        // Remove from failed submissions if it was there
        const failedEmails = JSON.parse(localStorage.getItem('failedEmailSubmissions') || '[]');
        const filteredEmails = failedEmails.filter((item: any) => item.email !== email);
        localStorage.setItem('failedEmailSubmissions', JSON.stringify(filteredEmails));
      }
    } catch (err) {
      console.error('Background email submission error:', err);
      // Store in localStorage for retry later
      const failedEmails = JSON.parse(localStorage.getItem('failedEmailSubmissions') || '[]');
      failedEmails.push({
        email,
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Network error'
      });
      localStorage.setItem('failedEmailSubmissions', JSON.stringify(failedEmails));
    }
  };

  return (
    <section id="waitlist" className="py-24 bg-white dark:bg-[#171717]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {!isSubmitted ? (
          <motion.div
            ref={mainAnimation.ref}
            initial={{ opacity: 0, y: 20 }}
            animate={mainAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.h2
              ref={titleAnimation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={titleAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Join the Waitlist
            </motion.h2>
            
            <motion.p
              ref={descriptionAnimation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={descriptionAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              Be among the first to experience the future of carbon credits.
            </motion.p>

            <motion.form
              ref={formAnimation.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={formAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto"
            >
              {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    autoComplete="off"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className={`w-full pl-6 pr-6 py-4 bg-white dark:bg-[#232323] border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-lg transition-colors ${
                      email.trim() === '' 
                        ? 'border-gray-300 dark:border-gray-600 focus:border-green-500' 
                        : isValidEmailFormat 
                          ? 'border-green-400 dark:border-green-500 focus:border-green-500' 
                          : 'border-red-400 dark:border-red-500 focus:border-red-500'
                    }`}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !isValidEmailFormat}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-lg flex items-center justify-center whitespace-nowrap h-[60px]"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <span>Join Waitlist</span>
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">
              Welcome to CBX Early Access!
            </h3>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We'll email you first when CBX launches. Get ready for lower fees and transparent carbon credits.
            </p>

            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Invite a Colleague
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}