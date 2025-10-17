'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CounterAnimationProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function CounterAnimation({ value, duration = 2000, suffix = '' }: CounterAnimationProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}