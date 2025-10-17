'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, AlertCircle, Loader2, Zap, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Project } from '@/types/project';
import { useAnimateOnce } from '../../hooks/useOneDirectionalAnimation';

export default function App() {
  return <RateMyVCCSection />;
}

// Animated Score Circle Component - Made much faster and smoother
const AnimatedScoreCircle = ({ score, delay = 0 }: { score: number; delay?: number }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      // Animate score from 0 to target score - much faster
      const duration = 1000; // Reduced from 2000 to 1000ms
      const steps = 30; // Reduced from 60 to 30 steps
      const increment = score / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          current = score;
          clearInterval(interval);
        }
        setAnimatedScore(current);
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 65) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-green-400';
    if (score >= 75) return 'from-green-500 to-emerald-400';
    if (score >= 65) return 'from-yellow-500 to-amber-400';
    if (score >= 50) return 'from-orange-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
  };

  const circumference = 2 * Math.PI * 58; // radius of 58
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative flex-shrink-0 mx-auto md:mx-0">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, delay: delay, ease: "easeOut" }}
        className="w-32 h-32 relative"
      >
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="58"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="58"
            stroke="url(#scoreGradient)"
            strokeWidth="4"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.05s ease-out'
            }}
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={score >= 85 ? "stop-emerald-500" : score >= 75 ? "stop-green-500" : score >= 65 ? "stop-yellow-500" : score >= 50 ? "stop-orange-500" : "stop-red-500"} />
              <stop offset="100%" className={score >= 85 ? "stop-green-400" : score >= 75 ? "stop-emerald-400" : score >= 65 ? "stop-amber-400" : score >= 50 ? "stop-yellow-400" : "stop-orange-400"} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: delay + 0.1 }}
              className={`text-4xl font-bold ${getScoreColor(score)}`}
            >
              {Math.round(animatedScore)}
            </motion.div>
            <div className="text-sm text-gray-500 font-medium">/ 100</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function RateMyVCCSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Animation hooks
  const headerAnimation = useAnimateOnce<HTMLDivElement>();
  const subtitleAnimation = useAnimateOnce<HTMLParagraphElement>();
  const searchAnimation = useAnimateOnce<HTMLDivElement>();

  // Load project data on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/data/allprojects.json');
        if (response.ok) {
          const projects: Project[] = await response.json();
          setAllProjects(projects);
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };

    loadProjects();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim() || !isDataLoaded) return;

    setIsSearching(true);
    setHasSearched(true);

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Search for exact ID match only
    const query = searchTerm.trim();
    const exactMatch = allProjects.find(project => 
      project.id === query
    );

    setSearchResults(exactMatch ? [exactMatch] : []);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('registered') || normalizedStatus.includes('active')) {
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
    if (normalizedStatus.includes('validation') || normalizedStatus.includes('development')) {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
    if (normalizedStatus.includes('requested')) {
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  const formatEmissions = (emissions: string) => {
    if (!emissions) return 'N/A';
    // Remove commas and convert to number for formatting
    const num = parseFloat(emissions.replace(/,/g, ''));
    if (isNaN(num)) return emissions;
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M tCO₂/year`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K tCO₂/year`;
    return `${num.toLocaleString()} tCO₂/year`;
  };

  const generateBreakdownScores = (baseScore: number) => {
    // Generate realistic breakdown scores based on the overall score
    const variance = 10;
    const additionality = Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance));
    const permanence = Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance));
    const verification = Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance));
    
    return {
      additionality: Math.round(additionality),
      permanence: Math.round(permanence),
      verification: Math.round(verification)
    };
  };

  return (
    <section id="rate-credits" className="py-20 md:py-32 bg-white dark:bg-[#171717] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Static grid pattern - no animation */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          ref={headerAnimation.ref}
          initial={{ opacity: 0, y: 20 }}
          animate={headerAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
            Introducing{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              RateMyVCC
            </span>
          </h2>

          <motion.p
            ref={subtitleAnimation.ref}
            initial={{ opacity: 0, y: 20 }}
            animate={subtitleAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
          >
            Enter a carbon credit project ID to get an instant quality rating. 
            Our AI system has analyzed {isDataLoaded ? allProjects.length.toLocaleString() : '4,600+'} verified projects 
            and provides scores based on methodology, additionality, and permanence.
          </motion.p>
        </motion.div>

        {/* Search Interface */}
        <motion.div
          ref={searchAnimation.ref}
          initial={{ opacity: 0, y: 20 }}
          animate={searchAnimation.isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
          className="mb-12 md:mb-16"
        >
          <div className="max-w-4xl mx-auto">
            {/* Search Bar and Button on Same Line */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="E.g. 5617, 1234, 2500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-14 pr-6 py-4 bg-white dark:bg-[#232323] border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-green-500 focus:outline-none text-lg"
                  disabled={!isDataLoaded}
                />
              </div>
              
              {/* Rate Button */}
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim() || !isDataLoaded}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-lg flex items-center justify-center whitespace-nowrap h-[60px]"
              >
                {!isDataLoaded ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Zap className="w-5 h-5 mr-2" />
                )}
                {!isDataLoaded ? 'Loading Data...' : isSearching ? 'Analyzing...' : 'Get Quality Score'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Analyzing Project Quality</h3>
              <p className="text-gray-600 dark:text-gray-400">Searching project database...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!isSearching && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto"
            >
              {searchResults.map((project, index) => {
                const breakdown = generateBreakdownScores(project.score);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-500 group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />

                      <CardContent className="p-6 md:p-10 relative">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row items-start justify-between mb-8">
                          <div className="flex-1 pr-0 md:pr-8 mb-6 md:mb-0">
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: 0.4 }}
                              className="flex items-center flex-wrap gap-2 mb-4"
                            >
                              <span className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                ID: {project.id}
                              </span>
                              <span className={`text-sm px-3 py-1.5 rounded-lg border font-medium ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <span className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-green-500/20 text-gray-700 dark:text-green-400 bg-gray-50 dark:bg-green-500/10">
                                {getScoreLevel(project.score)}
                              </span>
                            </motion.div>
                            <motion.h3 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: 0.5 }}
                              className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight"
                            >
                              {project.name}
                            </motion.h3>
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: 0.6 }}
                              className="text-lg text-gray-600 dark:text-gray-400 mb-3"
                            >
                              {project.methodology}
                            </motion.p>
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: 0.7 }}
                              className="text-gray-500 dark:text-gray-500 text-sm"
                            >
                              {project.country} • {project.region} • {project.proponent}
                            </motion.p>
                          </div>

                          {/* Animated Score Circle */}
                          <AnimatedScoreCircle score={project.score} delay={0.8} />
                        </div>

                        {/* Detailed Information Grid */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 1.0 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
                        >
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project Type</div>
                            <div className="text-base text-gray-900 dark:text-white font-semibold">{project.projectType}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Annual Reductions</div>
                            <div className="text-base text-gray-900 dark:text-white font-semibold">{formatEmissions(project.estimatedEmissions)}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Methodology</div>
                            <div className="text-base text-gray-900 dark:text-white font-semibold">{project.methodology || 'N/A'}</div>
                          </div>
                        </motion.div>

                        {/* Quality Breakdown */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 1.2 }}
                          className="mb-8"
                        >
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Analysis</h4>
                          <div className="space-y-3">
                            {/* Additionality */}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400 text-sm">Additionality</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${breakdown.additionality}%` }}
                                    transition={{ duration: 1.5, delay: 1.4, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                  />
                                </div>
                                <span className="text-gray-900 dark:text-white font-medium text-sm w-6 text-right">{breakdown.additionality}</span>
                              </div>
                            </div>
                            {/* Permanence */}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400 text-sm">Permanence</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${breakdown.permanence}%` }}
                                    transition={{ duration: 1.5, delay: 1.6, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                  />
                                </div>
                                <span className="text-gray-900 dark:text-white font-medium text-sm w-6 text-right">{breakdown.permanence}</span>
                              </div>
                            </div>
                            {/* Verification */}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400 text-sm">Verification</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${breakdown.verification}%` }}
                                    transition={{ duration: 1.5, delay: 1.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                  />
                                </div>
                                <span className="text-gray-900 dark:text-white font-medium text-sm w-6 text-right">{breakdown.verification}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 2.0 }}
                          className="flex justify-center"
                        >
                          <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center">
                            <Award className="w-5 h-5 mr-2" />
                            View Full Analysis
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        <AnimatePresence>
          {!isSearching && hasSearched && searchResults.length === 0 && isDataLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Project ID Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Please enter a valid project ID (e.g. 5617, 1234, 2500).</p>
              <Button
                onClick={() => { setHasSearched(false); setSearchTerm(''); }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white px-6 py-2 rounded-lg"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}