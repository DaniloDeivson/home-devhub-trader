import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2, CheckCircle, X, AlertTriangle, CreditCard, Calendar, User, Mail, Lock, Eye, EyeOff, FileCode, Briefcase, Star, Shield, Zap, Award, Users, Apple as WhatsApp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export function DeveloperSignupPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, profile } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    experience: '',
    portfolio: '',
    phone: '',
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const specialties = [
    'algorithmic-trading',
    'machine-learning',
    'technical-analysis',
    'risk-management',
    'backtesting',
    'strategy-development'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = () => {
    setError(null);
    
    if (step === 1) {
      if (!formData.fullName.trim()) return 'Full name is required';
      if (!formData.email.trim()) return 'Email is required';
      if (!formData.email.includes('@')) return 'Please enter a valid email';
      if (!formData.password) return 'Password is required';
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
      if (!formData.phone.trim()) return 'Phone number is required';
    }
    
    if (step === 2) {
      if (!formData.specialty) return 'Please select your specialty';
      if (!formData.experience.trim()) return 'Please describe your experience';
    }
    
    if (step === 3) {
      if (!formData.agreeTerms) return 'You must agree to the terms and conditions';
    }
    
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep();
    if (error) {
      setError(error);
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateStep();
    if (error) {
      setError(error);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Instead of registering, contact via WhatsApp
      const message = `Olá vim do DevHub Trader e quero mais informações e ajuda para me tornar um desenvolvedor. Meus dados: Nome: ${formData.fullName}, Email: ${formData.email}, Telefone: ${formData.phone}, Especialidade: ${formData.specialty}`;
      const encodedMessage = encodeURIComponent(message);
      
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
        navigate('/experts');
      }, 3000);
    } catch (error) {
      console.error('Error registering developer:', error);
      setError(error instanceof Error ? error.message : 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSpecialty = (specialty: string) => {
    return specialty
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // If user is already logged in, redirect to robots page
  if (profile) {
    navigate('/robots');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/experts')}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Back to experts"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Become a Developer</h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">Join Our Developer Network</h2>
              <p className="text-blue-100 mb-4">
                Become a certified trading developer and connect with clients looking for your expertise. Grow your business and showcase your skills to our community.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-800 bg-opacity-50 rounded-lg px-4 py-2 flex items-center">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-blue-200 text-sm">R$ 199,90/month</p>
                  </div>
                </div>
                <div className="bg-blue-800 bg-opacity-50 rounded-lg px-4 py-2 flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-2" />
                  <div>
                    <p className="font-medium">One-time Registration</p>
                    <p className="text-blue-200 text-sm">R$ 499,90</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="bg-blue-800 bg-opacity-40 rounded-full p-8">
                <Code2 className="w-24 h-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <span className="text-sm mt-2">Account</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-sm mt-2">Profile</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-sm mt-2">Payment</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-green-500 font-medium">Registration request sent!</p>
              <p className="text-green-400 text-sm">Redirecting you to WhatsApp to complete your registration...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+55 (11) 98765-4321"
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Developer Profile */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Developer Profile</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Primary Specialty
                  </label>
                  <div className="relative">
                    <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select your specialty</option>
                      {specialties.filter(s => s !== 'all').map(specialty => (
                        <option key={specialty} value={specialty}>
                          {formatSpecialty(specialty)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Experience
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your experience in trading and development..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Portfolio URL (optional)
                  </label>
                  <div className="relative">
                    <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://your-portfolio.com"
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                
                <div className="bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-blue-600 rounded-full p-2 mr-4 flex-shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Developer Subscription</h3>
                      <p className="text-blue-200 mb-2">Join our network of certified developers</p>
                      <div className="flex flex-col">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">R$ 199,90</span>
                          <span className="text-blue-300 ml-2">/month</span>
                        </div>
                        <div className="flex items-baseline mt-1">
                          <span className="text-lg font-bold">+ R$ 499,90</span>
                          <span className="text-blue-300 ml-2">one-time registration fee</span>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1">
                        <li className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>Featured listing in our experts directory</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>Direct client connections</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>5,000 tokens monthly</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>Developer badge and verification</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>Priority support and resources</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start mt-4">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 mr-2"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-300">
                    I agree to the <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a> and <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>. I understand that I will be charged R$ 199,90 monthly and a one-time registration fee of R$ 499,90.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/experts')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Cancel
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <WhatsApp className="w-5 h-5 mr-2" />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Award className="w-6 h-6 text-yellow-500 mr-2" />
            Developer Benefits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-blue-600 rounded-full p-2 mr-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-medium">Client Connections</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Get direct access to clients looking for trading expertise and development services.
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-green-600 rounded-full p-2 mr-3">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="font-medium">Verification Badge</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Stand out with a verified developer badge that builds trust with potential clients.
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-purple-600 rounded-full p-2 mr-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-medium">Premium Tools</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Access premium development tools and 5,000 monthly tokens for AI assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CreditCard className="w-6 h-6 text-blue-500 mr-2" />
            Pricing Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Monthly Subscription</h3>
                <div className="bg-blue-600 rounded-full px-3 py-1 text-sm">
                  Recurring
                </div>
              </div>
              <div className="text-2xl font-bold mb-2">R$ 199,90<span className="text-sm font-normal text-gray-400">/month</span></div>
              <p className="text-gray-300 text-sm">
                Billed monthly. Cancel anytime. Includes all developer benefits and platform access.
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Registration Fee</h3>
                <div className="bg-green-600 rounded-full px-3 py-1 text-sm">
                  One-time
                </div>
              </div>
              <div className="text-2xl font-bold mb-2">R$ 499,90</div>
              <p className="text-gray-300 text-sm">
                One-time payment for account verification, profile setup, and initial platform onboarding.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-blue-100 text-sm">
                Your first payment today will be <span className="font-bold">R$ 699,80</span> (R$ 199,90 + R$ 499,90). After that, you'll be charged R$ 199,90 monthly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}