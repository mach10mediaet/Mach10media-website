import React, { useState } from 'react';
import { Send, MapPin, Sparkles, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SERVICE_PACKAGES } from '../data/servicePackages';

type BudgetTier = 'under-50k' | '50k-100k' | '100k-250k' | 'over-250k';
type Currency = 'USD' | 'ETB';
type PricingMode = 'known' | 'estimate';
type EstimateProjectType = 'one-time-video' | 'photoshoot' | 'retainer';
type GoalOption = 'Launch a campaign' | 'Build a content library' | 'Grow on social media' | 'Refresh my brand image';
type PlatformOption = 'Instagram' | 'TikTok' | 'Website' | 'Paid Ads' | 'Print / OOH';
type DeliverableOption = 'Brand Film' | 'Reels / Short Videos' | 'Campaign Photos' | 'Product Photos' | 'Launch Assets';
type NextStepOption = 'Send project brief only' | 'Book a discovery call' | 'Do both';
type CallTypeOption = 'Zoom Call' | 'Phone Call' | 'In-Person Meeting';
type MeetingDayOption = 'Weekday Morning' | 'Weekday Afternoon' | 'Weekday Evening' | 'Flexible';
type ReferralSourceOption = 'Instagram' | 'Google Search' | 'Referral' | 'TikTok' | 'Website' | 'Other';

const budgetThresholds: BudgetTier[] = [
  'under-50k',
  '50k-100k',
  '100k-250k',
  'over-250k'
];

const budgetLabels: Record<Currency, Record<BudgetTier, string>> = {
  USD: {
    'under-50k': '< $50,000',
    '50k-100k': '$50k - $100k',
    '100k-250k': '$100k - $250k',
    'over-250k': '> $250,000'
  },
  ETB: {
    'under-50k': '< ETB 5M',
    '50k-100k': 'ETB 5M - 10M',
    '100k-250k': 'ETB 10M - 25M',
    'over-250k': '> ETB 25M'
  }
};

const projectTypeLabels: Record<EstimateProjectType, string> = {
  'one-time-video': 'One-Time Video Production',
  photoshoot: 'One-Time Photoshoot',
  retainer: 'Retainer Package'
};

const goals: GoalOption[] = ['Launch a campaign', 'Build a content library', 'Grow on social media', 'Refresh my brand image'];
const platforms: PlatformOption[] = ['Instagram', 'TikTok', 'Website', 'Paid Ads', 'Print / OOH'];
const deliverableOptions: DeliverableOption[] = ['Brand Film', 'Reels / Short Videos', 'Campaign Photos', 'Product Photos', 'Launch Assets'];
const nextSteps: NextStepOption[] = ['Send project brief only', 'Book a discovery call', 'Do both'];
const callTypes: CallTypeOption[] = ['Zoom Call', 'Phone Call', 'In-Person Meeting'];
const meetingDays: MeetingDayOption[] = ['Weekday Morning', 'Weekday Afternoon', 'Weekday Evening', 'Flexible'];
const referralSources: ReferralSourceOption[] = ['Instagram', 'Google Search', 'Referral', 'TikTok', 'Website', 'Other'];
const INQUIRY_NOTIFICATION_EMAIL = import.meta.env.VITE_INQUIRY_NOTIFICATION_EMAIL || 'mach10media.et@gmail.com';

const getBudgetBracket = (value: number): BudgetTier => {
  if (value < 50000) return 'under-50k';
  if (value < 100000) return '50k-100k';
  if (value < 250000) return '100k-250k';
  return 'over-250k';
};

const formatEstimateSummary = (projectType: EstimateProjectType, videoCount: number, photoCount: number) => {
  if (projectType === 'one-time-video') {
    return `${videoCount} video deliverable${videoCount === 1 ? '' : 's'}`;
  }

  if (projectType === 'photoshoot') {
    return `${photoCount} edited photo${photoCount === 1 ? '' : 's'}`;
  }

  return `${videoCount} video deliverable${videoCount === 1 ? '' : 's'} + ${photoCount} edited photo${photoCount === 1 ? '' : 's'} per month`;
};

const getEstimatedBudget = (projectType: EstimateProjectType, videoCount: number, photoCount: number): BudgetTier => {
  if (projectType === 'one-time-video') {
    const estimatedValue = 18000 + videoCount * 22000;
    return getBudgetBracket(estimatedValue);
  }

  if (projectType === 'photoshoot') {
    const estimatedValue = 12000 + photoCount * 900;
    return getBudgetBracket(estimatedValue);
  }

  const estimatedValue = 28000 + videoCount * 18000 + photoCount * 700;
  return getBudgetBracket(estimatedValue);
};

const toggleSelection = <T,>(items: T[], item: T) =>
  items.includes(item) ? items.filter((value) => value !== item) : [...items, item];

const sendInquiryNotificationEmail = async (payload: {
  name: string;
  email: string;
  company: string;
  practice: string;
  nextStep: string;
  goal: string;
  budget: string;
  platforms: string[];
  deliverables: string[];
  callType: string;
  meetingDay: string;
  estimateSummary: string;
  recommendedPackage: string;
  story: string;
  referralSource: string;
}) => {
  const formData = new FormData();
  formData.append('_subject', `New Mach10 Inquiry: ${payload.company || payload.name}`);
  formData.append('_template', 'table');
  formData.append('_captcha', 'false');
  formData.append('_replyto', payload.email);
  formData.append('name', payload.name);
  formData.append('email', payload.email);
  formData.append('company', payload.company || 'Not specified');
  formData.append('practice', payload.practice || 'Not provided');
  formData.append('next_step', payload.nextStep || 'Not provided');
  formData.append('goal', payload.goal || 'Not provided');
  formData.append('budget', payload.budget || 'Not provided');
  formData.append('platforms', payload.platforms.join(', ') || 'Not provided');
  formData.append('deliverables', payload.deliverables.join(', ') || 'Not provided');
  formData.append('call_request', payload.callType ? `${payload.callType} / ${payload.meetingDay}` : 'Not requested');
  formData.append('estimate_summary', payload.estimateSummary || 'Not provided');
  formData.append('recommended_package', payload.recommendedPackage || 'Not provided');
  formData.append('project_details', payload.story || 'No additional details provided.');
  formData.append('referral_source', payload.referralSource || 'Not provided');

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(INQUIRY_NOTIFICATION_EMAIL)}`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Notification email request failed with status ${response.status}`);
  }
};

const getSelectableButtonClass = (isActive: boolean) =>
  `rounded-full border px-4 py-2.5 font-mono tracking-wider uppercase shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 ${
    isActive
      ? 'border-[#F9A136]/70 bg-[#F9A136] text-black shadow-[0_14px_34px_rgba(249,161,54,0.22)]'
      : 'border-white/12 bg-white/[0.05] text-[#f5f1e8] hover:-translate-y-0.5 hover:border-[#F9A136]/45 hover:bg-white/[0.08] hover:text-white'
  }`;

const getSegmentButtonClass = (isActive: boolean, tone: 'light' | 'accent' = 'light') =>
  `rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.24em] uppercase transition-all duration-300 ${
    isActive
      ? tone === 'accent'
        ? 'bg-[#F9A136] text-black shadow-[0_10px_24px_rgba(249,161,54,0.22)]'
        : 'bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.14)]'
      : 'text-[#efe7db] hover:text-white'
  }`;

export default function ContactView() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    practice: 'Branding & Design',
    budget: '50k-100k' as BudgetTier,
    goal: 'Launch a campaign' as GoalOption,
    platforms: ['Instagram', 'Website'] as PlatformOption[],
    deliverables: ['Brand Film', 'Launch Assets'] as DeliverableOption[],
    nextStep: 'Do both' as NextStepOption,
    callType: 'Zoom Call' as CallTypeOption,
    meetingDay: 'Weekday Afternoon' as MeetingDayOption,
    story: '',
    referralSource: 'Instagram' as ReferralSourceOption
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<PricingMode>('known');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [estimateProjectType, setEstimateProjectType] = useState<EstimateProjectType>('one-time-video');
  const [estimatedVideoCount, setEstimatedVideoCount] = useState(2);
  const [estimatedPhotoCount, setEstimatedPhotoCount] = useState(24);

  const practices = [
    'Branding & Design',
    'Commercial Film',
    'Fashion Photography',
    'Social Strategy',
    'Full Campaign Orchestration'
  ];

  const budgets = budgetThresholds;
  const shouldShowBookingFields = formData.nextStep === 'Book a discovery call' || formData.nextStep === 'Do both';
  const shouldShowBriefFields = formData.nextStep === 'Send project brief only' || formData.nextStep === 'Do both';

  const offices = [
    {
      city: 'Addis Ababa',
      desc: 'Headquarters',
      address: 'Addis Ababa, Ehtiopia, Kazanchis Kidus Complex ',
      email: 'Mach10media.et@gmail.com',
      phone: '+251-920969486'
    }
  ];

  const estimatedBudget = getEstimatedBudget(estimateProjectType, estimatedVideoCount, estimatedPhotoCount);
  const estimateSummary = formatEstimateSummary(estimateProjectType, estimatedVideoCount, estimatedPhotoCount);
  const resolvedBudgetTier = pricingMode === 'estimate' ? estimatedBudget : formData.budget;
  const resolvedBudgetLabel = budgetLabels[currency][resolvedBudgetTier];

  const recommendedPackage =
    estimateProjectType === 'one-time-video'
      ? SERVICE_PACKAGES.find((item) => item.key === 'video-production')
      : estimateProjectType === 'photoshoot'
        ? SERVICE_PACKAGES.find((item) => item.key === 'photoshoot')
        : SERVICE_PACKAGES.find((item) => item.key === 'content-retainer');

  const resetForm = () => {
    setSubmitted(false);
    setSubmitError(null);
    setPricingMode('known');
    setCurrency('USD');
    setEstimateProjectType('one-time-video');
    setEstimatedVideoCount(2);
    setEstimatedPhotoCount(24);
    setFormData({
      name: '',
      email: '',
      company: '',
      practice: 'Branding & Design',
      budget: '50k-100k',
      goal: 'Launch a campaign',
      platforms: ['Instagram', 'Website'],
      deliverables: ['Brand Film', 'Launch Assets'],
      nextStep: 'Do both',
      callType: 'Zoom Call',
      meetingDay: 'Weekday Afternoon',
      story: '',
      referralSource: 'Instagram'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Please complete the mandatory Name and Email lines.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const inquiryPayload = {
      name: formData.name,
      email: formData.email,
      company: formData.company || '',
      practice: shouldShowBriefFields ? formData.practice : '',
      budget: shouldShowBriefFields ? resolvedBudgetLabel : '',
      budgetCurrency: shouldShowBriefFields ? currency : '',
      timeline: '',
      goal: shouldShowBriefFields ? formData.goal : '',
      platforms: shouldShowBriefFields ? formData.platforms : [],
      deliverables: shouldShowBriefFields ? formData.deliverables : [],
      nextStep: formData.nextStep,
      callType: shouldShowBookingFields ? formData.callType : '',
      meetingDay: shouldShowBookingFields ? formData.meetingDay : '',
      pricingMode: shouldShowBriefFields ? pricingMode : '',
      estimateProjectType: shouldShowBriefFields && pricingMode === 'estimate' ? estimateProjectType : '',
      estimateSummary: shouldShowBriefFields && pricingMode === 'estimate' ? estimateSummary : '',
      recommendedPackage: shouldShowBriefFields && pricingMode === 'estimate' ? recommendedPackage?.title || 'Custom Scope' : '',
      referralSource: formData.referralSource,
      story: formData.story || '',
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'inquiries'), inquiryPayload);
      await sendInquiryNotificationEmail({
        name: inquiryPayload.name,
        email: inquiryPayload.email,
        company: inquiryPayload.company,
        practice: inquiryPayload.practice,
        nextStep: inquiryPayload.nextStep,
        goal: inquiryPayload.goal,
        budget: inquiryPayload.budget,
        platforms: inquiryPayload.platforms,
        deliverables: inquiryPayload.deliverables,
        callType: inquiryPayload.callType,
        meetingDay: inquiryPayload.meetingDay,
        estimateSummary: inquiryPayload.estimateSummary,
        recommendedPackage: inquiryPayload.recommendedPackage,
        referralSource: inquiryPayload.referralSource,
        story: inquiryPayload.story
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
      }, 1200);
    } catch (error) {
      console.error('Failed to store inquiry in Firestore:', error);
      setIsSubmitting(false);
      setSubmitError('Your inquiry could not be saved right now. Please try again in a moment.');
    }
  };

  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 border-b border-white/5 pb-10">
          <div className="flex items-center space-x-2 mb-4 text-[#737373] font-mono text-[11px] tracking-[0.24em] uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>PROJECT INQUIRY</span>
          </div>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
            start your <span className="webkit-stroke font-black opacity-80 leading-none">project</span>
          </h1>
          <p className="mt-4 max-w-xl font-sans text-sm sm:text-[15px] font-light text-neutral-400 leading-relaxed">
            Pick what you want to do, fill only the relevant details, and we will get back to you.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="booking-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                  id="client-inquiry-form"
                >
                  {submitError && (
                    <div className="border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                      {submitError}
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                      <label className="mb-1 block font-mono text-[13px] tracking-widest text-[#737373] uppercase">YOUR NAME *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sebastian Thorne"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                        id="form-input-name"
                      />
                    </div>

                    <div className="border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                      <label className="mb-1 block font-mono text-[13px] tracking-widest text-[#737373] uppercase">YOUR EMAIL *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. client@brand.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                        id="form-input-email"
                      />
                    </div>
                  </div>

                  <div className="border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                    <label className="mb-1 block font-mono text-[13px] tracking-widest text-[#737373] uppercase">COMPANY OR BRAND</label>
                    <input
                      type="text"
                      placeholder="e.g. Chronos Horlogerie"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">HOW DID YOU HEAR ABOUT US?</label>
                    <div className="flex flex-wrap gap-2">
                      {referralSources.map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => setFormData({ ...formData, referralSource: source })}
                          className={`${getSelectableButtonClass(formData.referralSource === source)} text-[11px]`}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">WHAT WOULD YOU LIKE TO DO?</label>
                    <div className="flex flex-wrap gap-2">
                      {nextSteps.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFormData({ ...formData, nextStep: item })}
                          className={`${getSelectableButtonClass(formData.nextStep === item)} text-[11px]`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {shouldShowBookingFields && (
                    <div className="border border-white/5 bg-[#0c0c0c]/50 p-5 sm:p-6">
                      <p className="font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase mb-4">DISCOVERY CALL REQUEST</p>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <label className="mb-3 block font-mono text-[11px] tracking-widest text-[#737373] uppercase">CALL TYPE</label>
                          <div className="flex flex-wrap gap-2">
                            {callTypes.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setFormData({ ...formData, callType: item })}
                                className={`${getSelectableButtonClass(formData.callType === item)} text-[10px]`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-3 block font-mono text-[11px] tracking-widest text-[#737373] uppercase">BEST TIME WINDOW</label>
                          <div className="flex flex-wrap gap-2">
                            {meetingDays.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setFormData({ ...formData, meetingDay: item })}
                                className={`${getSelectableButtonClass(formData.meetingDay === item)} text-[10px]`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {shouldShowBriefFields && (
                    <>
                      <div>
                        <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">PROJECT TYPE</label>
                        <div className="flex flex-wrap gap-2">
                          {practices.map((practice) => (
                            <button
                              key={practice}
                              type="button"
                              onClick={() => setFormData({ ...formData, practice })}
                              className={`${getSelectableButtonClass(formData.practice === practice)} text-[12px]`}
                            >
                              {practice}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-8 lg:grid-cols-2">
                        <div>
                          <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">MAIN GOAL</label>
                          <div className="flex flex-wrap gap-2">
                            {goals.map((goal) => (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => setFormData({ ...formData, goal })}
                                className={`${getSelectableButtonClass(formData.goal === goal)} text-[11px]`}
                              >
                                {goal}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">NEEDED DELIVERABLES</label>
                          <div className="flex flex-wrap gap-2">
                            {deliverableOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setFormData({ ...formData, deliverables: toggleSelection(formData.deliverables, item) })}
                                className={`${getSelectableButtonClass(formData.deliverables.includes(item))} text-[11px]`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">WHERE WILL THE CONTENT BE USED?</label>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setFormData({ ...formData, platforms: toggleSelection(formData.platforms, item) })}
                              className={`${getSelectableButtonClass(formData.platforms.includes(item))} text-[11px]`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="block text-left font-mono text-[12px] tracking-widest text-[#737373] uppercase">PROJECT BUDGET</label>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
                                {(['USD', 'ETB'] as Currency[]).map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => setCurrency(option)}
                                    className={getSegmentButtonClass(currency === option)}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>

                              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
                                <button
                                  type="button"
                                  onClick={() => setPricingMode('known')}
                                  className={getSegmentButtonClass(pricingMode === 'known', 'accent')}
                                >
                                  I KNOW MY BUDGET
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPricingMode('estimate');
                                    setFormData({ ...formData, budget: estimatedBudget });
                                  }}
                                  className={getSegmentButtonClass(pricingMode === 'estimate', 'accent')}
                                >
                                  HELP ME ESTIMATE
                                </button>
                              </div>
                            </div>
                          </div>

                          {pricingMode === 'estimate' ? (
                            <div className="border border-white/5 bg-[#0c0c0c]/50 p-5 sm:p-6 space-y-5">
                              <div className="flex flex-wrap gap-2">
                                {(Object.keys(projectTypeLabels) as EstimateProjectType[]).map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                      setEstimateProjectType(type);
                                      setFormData({ ...formData, budget: getEstimatedBudget(type, estimatedVideoCount, estimatedPhotoCount) });
                                    }}
                                    className={`${getSelectableButtonClass(estimateProjectType === type)} text-[11px]`}
                                  >
                                    {projectTypeLabels[type]}
                                  </button>
                                ))}
                              </div>

                              <div className="grid gap-5 sm:grid-cols-2">
                                {(estimateProjectType === 'one-time-video' || estimateProjectType === 'retainer') && (
                                  <div>
                                    <label className="mb-3 block font-mono text-[11px] tracking-widest text-[#737373] uppercase">
                                      {estimateProjectType === 'retainer' ? 'VIDEOS PER MONTH' : 'HOW MANY VIDEOS'}
                                    </label>
                                    <input
                                      type="range"
                                      min={1}
                                      max={estimateProjectType === 'retainer' ? 8 : 6}
                                      value={estimatedVideoCount}
                                      onChange={(e) => {
                                        const nextCount = Number(e.target.value);
                                        setEstimatedVideoCount(nextCount);
                                        setFormData({ ...formData, budget: getEstimatedBudget(estimateProjectType, nextCount, estimatedPhotoCount) });
                                      }}
                                      className="w-full accent-[#F9A136]"
                                    />
                                    <p className="mt-2 font-mono text-xs tracking-[0.16em] text-white uppercase">{estimatedVideoCount}</p>
                                  </div>
                                )}

                                {(estimateProjectType === 'photoshoot' || estimateProjectType === 'retainer') && (
                                  <div>
                                    <label className="mb-3 block font-mono text-[11px] tracking-widest text-[#737373] uppercase">
                                      {estimateProjectType === 'retainer' ? 'PHOTOS PER MONTH' : 'HOW MANY PHOTOS'}
                                    </label>
                                    <input
                                      type="range"
                                      min={estimateProjectType === 'retainer' ? 10 : 12}
                                      max={120}
                                      step={estimateProjectType === 'retainer' ? 5 : 4}
                                      value={estimatedPhotoCount}
                                      onChange={(e) => {
                                        const nextCount = Number(e.target.value);
                                        setEstimatedPhotoCount(nextCount);
                                        setFormData({ ...formData, budget: getEstimatedBudget(estimateProjectType, estimatedVideoCount, nextCount) });
                                      }}
                                      className="w-full accent-[#F9A136]"
                                    />
                                    <p className="mt-2 font-mono text-xs tracking-[0.16em] text-white uppercase">{estimatedPhotoCount}</p>
                                  </div>
                                )}
                              </div>

                              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="border border-[#F9A136]/18 bg-[#F9A136]/10 p-4">
                                  <p className="font-mono text-[10px] tracking-[0.16em] text-[#F9A136] uppercase">SUGGESTED BUDGET RANGE</p>
                                  <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <span className="rounded-full bg-[#F9A136] px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-black uppercase">
                                      {budgetLabels[currency][estimatedBudget]}
                                    </span>
                                    <span className="font-sans text-sm font-light text-neutral-200">{estimateSummary}</span>
                                  </div>
                                </div>

                                <div className="border border-white/8 bg-black/20 p-4">
                                  <p className="font-mono text-[10px] tracking-[0.16em] text-neutral-300 uppercase">RECOMMENDED PACKAGE</p>
                                  <h4 className="mt-3 font-sans text-lg font-light tracking-tight text-white uppercase">
                                    {recommendedPackage?.title || 'Custom Scope'}
                                  </h4>
                                  <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-[#F9A136] uppercase">
                                    {recommendedPackage?.price || 'Custom Quote'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {budgets.map((budget) => (
                                <button
                                  key={budget}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, budget })}
                                  className={`${getSelectableButtonClass(formData.budget === budget)} text-[11px]`}
                                >
                                  {budgetLabels[currency][budget]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                        <label className="mb-2 block font-mono text-[13px] tracking-widest text-[#737373] uppercase">PROJECT DETAILS</label>
                        <textarea
                          rows={5}
                          placeholder="Tell us about the project, launch, creative direction, or anything else that would help."
                          value={formData.story}
                          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                          className="w-full resize-none border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent bg-white py-4 font-mono text-[11px] font-bold tracking-[0.16em] text-[#080808] uppercase transition-all duration-500 hover:scale-[1.015] hover:bg-[#F9A136]"
                    id="form-submit-button"
                  >
                    <span>{isSubmitting ? 'Sending...' : shouldShowBookingFields ? 'Send Inquiry & Request Call' : 'Send Inquiry'}</span>
                    <Send className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-white/10 bg-[#0c0c0c]/50 p-3 text-center relative bg-gradient-to-tr from-neutral-900 to-[#080808]/80"
                  id="contact-success-state"
                >
                  <div className="border border-white/5 p-8">
                    <p className="mb-4 font-mono text-[9px] tracking-[0.3em] text-[#737373] uppercase">TRANSMISSION ESTABLISHED</p>
                    <h3 className="mb-6 font-sans text-3xl font-extralight tracking-tight text-white">
                      We got your request.
                    </h3>
                    <p className="mx-auto max-w-md font-sans text-xs font-light leading-relaxed text-[#a3a3a3]">
                      Your details are queued for review. A partner reaches out within 48 business hours.
                    </p>

                    <div className="mx-auto mt-8 max-w-sm border-t border-white/5 pt-6 font-mono text-[10px] text-neutral-500">
                      <p className="uppercase">INQUIRY REF: ARX-{Math.floor(Math.random() * 90000) + 10000}</p>
                      <p className="mt-1">MACH10 MEDIA GROUP - ADDIS ABABA</p>
                    </div>

                    <button
                      onClick={resetForm}
                      className="mt-8 font-mono text-[9px] tracking-widest text-white uppercase transition-colors hover:text-[#F9A136]"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <div className="border border-white/5 bg-[#0c0c0c]/40 p-5">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase mb-4">HOW THIS HELPS</p>
              <div className="space-y-4">
                {[
                  'Choose brief, call, or both',
                  'Show only the relevant fields',
                  'Get a package recommendation faster'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#F9A136]" />
                    <span className="font-sans text-sm font-light text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[12px] tracking-[0.3em] text-[#525252] uppercase mb-6">OUR OFFICE</p>
              
              <div className="space-y-8">
                {offices.map((office, index) => (
                  <div key={index} className="border-l border-white/10 pl-5 py-1">
                    <h4 className="font-sans text-base font-normal text-white flex items-center gap-1.5 uppercase tracking-tight">
                      <MapPin className="h-3.5 w-3.5 text-[#525252]" />
                      <span>{office.city}</span>
                    </h4>
                    <p className="font-sans text-[15px] text-[#737373] mt-0.5">{office.desc}</p>
                    <p className="font-sans text-[#a3a3a3] font-light text-sm mt-2 leading-relaxed">
                      {office.address}
                    </p>
                    <div className="mt-2.5 flex flex-col space-y-1 font-mono text-[15px] text-[#737373]">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="hover:text-[#F9A136] cursor-pointer transition-colors">{office.email}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        <span>{office.phone}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 font-mono text-[13px] text-neutral-500 uppercase tracking-widest">
              <p>GENERAL CONTACT</p>
              <p className="mt-2 text-white">Mach10media.et@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
