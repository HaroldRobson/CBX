'use client';

import React, { useState } from 'react';
import { ArrowRight, Calendar, Globe, Shield, BarChart3, Hash, ChevronDown } from 'lucide-react';
import { useSellerPools } from '../hooks/useSellerPools';

// Comprehensive list of world countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const ListNewCredits: React.FC = () => {
  const { createNewPool } = useSellerPools();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    developer: '',
    country: '',
    registry: '',
    issuanceDate: '',
    projectType: '',
    serialNumberRange: '',
    verificationStandard: '',
    // Step 2 fields
    pricePerCredit: '',
    totalCredits: '',
    minimumPurchase: '',
    description: '',
    projectImage: null as File | null
  });

  const updateFormData = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const result = await createNewPool(formData);
      console.log('Pool created successfully:', result);
      alert('Pool created successfully! It will be reviewed and activated shortly.');
      // Reset form
      setFormData({
        projectName: '',
        developer: '',
        country: '',
        registry: '',
        issuanceDate: '',
        projectType: '',
        serialNumberRange: '',
        verificationStandard: '',
        pricePerCredit: '',
        totalCredits: '',
        minimumPurchase: '',
        description: '',
        projectImage: null
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating pool:', error);
      alert('Error creating pool. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{backgroundColor: '#111827'}}>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">List New Credits</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  step === currentStep 
                    ? 'text-black' 
                    : step < currentStep 
                      ? 'text-white bg-green-500' 
                      : 'text-slate-400 bg-slate-700'
                }`}
                style={step === currentStep ? {backgroundColor: '#22c55e'} : {}}
              >
                {step}
              </div>
              {step < 3 && (
                <div className={`w-32 h-1 mx-4 ${step < currentStep ? 'bg-green-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-32">
            <div className={`text-center ${currentStep === 1 ? 'text-white' : 'text-slate-400'}`}>
              <div className="font-medium">Project & Credit Information</div>
            </div>
            <div className={`text-center ${currentStep === 2 ? 'text-white' : 'text-slate-400'}`}>
              <div className="font-medium">Listing Details</div>
            </div>
            <div className={`text-center ${currentStep === 3 ? 'text-white' : 'text-slate-400'}`}>
              <div className="font-medium">Review & Submit</div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-700 p-8" style={{backgroundColor: '#1F2937'}}>
            
            {/* Step 1: Project & Credit Information */}
            {currentStep === 1 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#22c55e'}}>
                    <span className="text-black font-semibold">1</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Project & Credit Information</h2>
                </div>
                <p className="text-slate-400 mb-8">
                  Please provide detailed information about the carbon credit project you want to list.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Name */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <BarChart3 size={16} style={{color: '#22c55e'}} />
                      <span>Project Name</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Rainforest Conservation"
                      value={formData.projectName}
                      onChange={(e) => updateFormData('projectName', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  {/* Developer */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <span>🏢</span>
                      <span>Developer</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rainforest Alliance"
                      value={formData.developer}
                      onChange={(e) => updateFormData('developer', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <Globe size={16} style={{color: '#22c55e'}} />
                      <span>Country</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.country}
                        onChange={(e) => updateFormData('country', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-green-500 appearance-none"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map(country => (
                          <option key={country} value={country.toLowerCase()}>{country}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  </div>

                  {/* Registry */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <Shield size={16} style={{color: '#22c55e'}} />
                      <span>Registry</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.registry}
                        onChange={(e) => updateFormData('registry', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-green-500 appearance-none"
                      >
                        <option value="">Select registry</option>
                        <option value="verra">Verra</option>
                        <option value="gold-standard">Gold Standard</option>
                        <option value="car">Climate Action Reserve</option>
                        <option value="acs">American Carbon Registry</option>
                        <option value="plan-vivo">Plan Vivo</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  </div>

                  {/* Issuance Date */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <Calendar size={16} style={{color: '#22c55e'}} />
                      <span>Issuance Date</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.issuanceDate}
                      onChange={(e) => updateFormData('issuanceDate', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="flex items-center space-x-2 text-white font-medium mb-2">
                      <span>🌱</span>
                      <span>Project Type</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.projectType}
                        onChange={(e) => updateFormData('projectType', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-green-500 appearance-none"
                      >
                        <option value="">Select project type</option>
                        <option value="forestry">Forestry & Land Use</option>
                        <option value="renewable-energy">Renewable Energy</option>
                        <option value="methane">Methane Capture</option>
                        <option value="direct-air-capture">Direct Air Capture</option>
                        <option value="blue-carbon">Blue Carbon</option>
                        <option value="energy-efficiency">Energy Efficiency</option>
                        <option value="transportation">Transportation</option>
                        <option value="waste-management">Waste Management</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                </div>

                {/* Serial Number Range */}
                <div className="mt-6">
                  <label className="flex items-center space-x-2 text-white font-medium mb-2">
                    <Hash size={16} style={{color: '#22c55e'}} />
                    <span>Serial Number Range</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VCS-12345678-12345678-12345678-12345-001-001-001"
                    value={formData.serialNumberRange}
                    onChange={(e) => updateFormData('serialNumberRange', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Enter the full serial number range for the credits you're listing
                  </p>
                </div>

                {/* Verification Standard */}
                <div className="mt-6">
                  <label className="flex items-center space-x-2 text-white font-medium mb-2">
                    <Shield size={16} style={{color: '#22c55e'}} />
                    <span>Verification Standard</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VCS VM0015"
                    value={formData.verificationStandard}
                    onChange={(e) => updateFormData('verificationStandard', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                  />
                </div>

                {/* Next Step Button */}
                <div className="flex justify-end mt-8">
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-2 text-black px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 font-medium"
                    style={{backgroundColor: '#22c55e'}}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Listing Details */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#22c55e'}}>
                    <span className="text-black font-semibold">2</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Listing Details</h2>
                </div>
                <p className="text-slate-400 mb-8">
                  Set pricing and provide additional details for your carbon credit listing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-medium mb-2 block">Price per Credit (USDC)</label>
                    <input
                      type="number"
                      placeholder="12.50"
                      step="0.01"
                      min="0"
                      value={formData.pricePerCredit}
                      onChange={(e) => updateFormData('pricePerCredit', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-white font-medium mb-2 block">Total Credits Available</label>
                    <input
                      type="number"
                      placeholder="5000"
                      min="1"
                      value={formData.totalCredits}
                      onChange={(e) => updateFormData('totalCredits', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-white font-medium mb-2 block">Project Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your carbon credit project..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={prevStep}
                    className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-500 transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-2 text-black px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 font-medium"
                    style={{backgroundColor: '#22c55e'}}
                  >
                    <span>Review & Submit</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#22c55e'}}>
                    <span className="text-black font-semibold">3</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Review & Submit</h2>
                </div>
                <p className="text-slate-400 mb-8">
                  Please review all information before submitting your carbon credit listing.
                </p>

                <div className="space-y-6">
                  <div className="border border-slate-600 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Project Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Project Name:</span>
                        <span className="text-white ml-2">{formData.projectName || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Developer:</span>
                        <span className="text-white ml-2">{formData.developer || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Country:</span>
                        <span className="text-white ml-2">{formData.country || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Registry:</span>
                        <span className="text-white ml-2">{formData.registry || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Project Type:</span>
                        <span className="text-white ml-2">{formData.projectType || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Issuance Date:</span>
                        <span className="text-white ml-2">{formData.issuanceDate || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-600 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Listing Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Price per Credit:</span>
                        <span className="text-white ml-2">${formData.pricePerCredit || '0'} USDC</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Credits:</span>
                        <span className="text-white ml-2">{formData.totalCredits || '0'} tonnes</span>
                      </div>
                    </div>
                    {formData.description && (
                      <div className="mt-4">
                        <span className="text-slate-400 block">Description:</span>
                        <span className="text-white text-sm">{formData.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={prevStep}
                    className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-500 transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={submitForm}
                    disabled={isSubmitting}
                    className="text-black px-8 py-3 rounded-lg hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{backgroundColor: '#22c55e'}}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Listing'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListNewCredits; 