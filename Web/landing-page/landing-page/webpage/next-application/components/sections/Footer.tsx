'use client';

import { motion } from 'framer-motion';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    Product: [
      { name: 'Rate Credits', href: '#rate-credits' },
      { name: 'How it Works', href: '#how-it-works' },
      { name: 'Features', href: '#' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Contact', href: '#waitlist' },
      { name: 'Blog', href: '#' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: '#waitlist', label: 'Contact' },
  ];

  return (
    <footer className="bg-white dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ margin: "-10% 0px -10% 0px" }}
              className="mb-6"
            >
              <p className="text-gray-700 dark:text-gray-400 leading-relaxed text-sm">
                The leading carbon credit platform. Retire any amount of credits. 
                Get blockchain verification and complete transparency.
              </p>
            </motion.div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  viewport={{ margin: "-10% 0px -10% 0px" }}
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 bg-gray-200 dark:bg-[#232323] border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: categoryIndex * 0.02 }}
              viewport={{ margin: "-10% 0px -10% 0px" }}
            >
              <h3 className="text-lg font-semibold mb-4 text-white">{category}</h3>
              <ul className="space-y-2">
                {links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-900 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          viewport={{ margin: "-10% 0px -10% 0px" }}
          className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © 2025 CBX. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Powered by</span>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Etherlink L2
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}