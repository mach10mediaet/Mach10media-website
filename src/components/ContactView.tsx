import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useSiteSetting } from '../hooks/useSiteSetting';

type BudgetTier = 'under-50k' | '50k-100k' | '100k-250k' | 'over-250k';
type Currency = 'USD' | 'ETB';
type PricingMode = 'range' | 'exact';
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
    'under-50k': '< $500',
    '50k-100k': '$500 – $1,000',
    '100k-250k': '$1,000 – $2,000',
    'over-250k': '> $2,000'
  },
  ETB: {
    'under-50k': '< ETB 50K',
    '50k-100k': 'ETB 50K – 100K',
    '100k-250k': 'ETB 100K – 250K',
    'over-250k': '> ETB 250K'
  }
};

const goals: GoalOption[] = ['Launch a campaign', 'Build a content library', 'Grow on social media', 'Refresh my brand image'];
const platforms: PlatformOption[] = ['Instagram', 'TikTok', 'Website', 'Paid Ads', 'Print / OOH'];
const deliverableOptions: DeliverableOption[] = ['Brand Film', 'Reels / Short Videos', 'Campaign Photos', 'Product Photos', 'Launch Assets'];
const nextSteps: NextStepOption[] = ['Send project brief only', 'Book a discovery call', 'Do both'];
const callTypes: CallTypeOption[] = ['Zoom Call', 'Phone Call', 'In-Person Meeting'];
const meetingDays: MeetingDayOption[] = ['Weekday Morning', 'Weekday Afternoon', 'Weekday Evening', 'Flexible'];
const referralSources: ReferralSourceOption[] = ['Instagram', 'Google Search', 'Referral', 'TikTok', 'Website', 'Other'];
const INQUIRY_NOTIFICATION_EMAIL = import.meta.env.VITE_INQUIRY_NOTIFICATION_EMAIL || 'mach10media.et@gmail.com';

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

/* Selection language — large flat text blocks; the chosen option fills solid amber.
   Hover: amber text. Selected: amber block with black text. No outlines, no chips. */
const getSelectableButtonClass = (isActive: boolean) =>
  `rounded-sm px-5 py-3 font-mono text-[11px] sm:text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 cursor-pointer ${
    isActive
      ? 'bg-[#E2912B] text-[#080808] font-medium'
      : 'text-neutral-300 hover:text-[#F9A136]'
  }`;

const getSegmentButtonClass = (isActive: boolean) =>
  `rounded-sm px-4 py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer ${
    isActive
      ? 'bg-[#E2912B] text-[#080808] font-medium'
      : 'text-neutral-300 hover:text-[#F9A136]'
  }`;

/* Section rule — numbered editorial steps, matching Services / About / Work */
const SectionHeader = ({ num, label }: { num: string; label: string }) => (
  <div className="mb-8 flex items-baseline justify-between border-t border-white/[0.07] pt-5">
    <span className="font-mono text-[10px] tracking-[0.24em] text-[#F9A136]">{num}</span>
    <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">{label}</span>
  </div>
);

const RowLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-3 block font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase">{children}</label>
);

export default function ContactView({ initialPractice, onPresetConsumed }: { initialPractice?: string; onPresetConsumed?: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    practice: initialPractice || 'Branding & Design',
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
  const [emailFailed, setEmailFailed] = useState(false);
  const [inquiryReference, setInquiryReference] = useState('');
  // Honeypot: bots autofill hidden "website" fields; humans never see it.
  const [honeypot, setHoneypot] = useState('');
  const bookingUrl = useSiteSetting('booking_url');

  // Consume the package preset once on mount (App remounts this view per navigation).
  const preset = initialPractice;
  useEffect(() => {
    if (preset) {
      setFormData((prev) => ({ ...prev, practice: preset }));
      onPresetConsumed?.();
    }
  }, []);
  const [pricingMode, setPricingMode] = useState<PricingMode>('range');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [exactBudget, setExactBudget] = useState('');

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
      address: 'Kidus Complex, Kazanchis, Addis Ababa, Ethiopia',
      email: 'Mach10media.et@gmail.com',
      phone: '+251-920969486, +251-920523976'
    }
  ];

  const resolvedBudgetLabel =
    pricingMode === 'exact'
      ? `${currency} ${exactBudget || '0'}`
      : budgetLabels[currency][formData.budget];

  const resetForm = () => {
    setSubmitted(false);
    setSubmitError(null);
    setPricingMode('range');
    setCurrency('USD');
    setExactBudget('');
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

    // Honeypot tripped: pretend success without writing anything.
    if (honeypot) {
      setInquiryReference('ARX-' + Math.random().toString(36).slice(2, 7).toUpperCase());
      setSubmitted(true);
      return;
    }

    // Cheap client-side throttle: one submission per 30s per visitor.
    const lastSubmitAt = Number(sessionStorage.getItem('mach10_inquiry_submitted_at') || 0);
    if (Date.now() - lastSubmitAt < 30_000) {
      setSubmitError('Your previous inquiry was just received. Please wait a moment before sending another.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setEmailFailed(false);

    const referenceId = 'ARX-' + Math.random().toString(36).slice(2, 7).toUpperCase();

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
      estimateProjectType: '',
      estimateSummary: pricingMode === 'exact' && exactBudget ? `Exact budget provided: ${currency} ${exactBudget}` : '',
      recommendedPackage: '',
      referralSource: formData.referralSource,
      story: formData.story || '',
      referenceId,
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // The Firestore record is the source of truth — the notification email is
      // best-effort and must never fail the submission on its own.
      await addDoc(collection(db, 'inquiries'), inquiryPayload);
      try {
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
      } catch (emailError) {
        console.error('Inquiry saved but the notification email failed:', emailError);
        setEmailFailed(true);
      }

      setInquiryReference(referenceId);
      sessionStorage.setItem('mach10_inquiry_submitted_at', String(Date.now()));
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
        {/* Page header — studio-wide hero pattern */}
        <div className="mb-20 border-b border-white/5 pb-10">
          <p className="mb-4 text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
            PROJECT INQUIRY
          </p>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
            start your <span className="webkit-stroke font-black opacity-80 leading-none">project</span>
          </h1>
          <p className="mt-4 max-w-xl font-sans text-sm sm:text-[15px] font-light text-neutral-400 leading-relaxed">
            Four short steps, only the relevant fields, and a reply within 48 business hours.
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
                  className="space-y-14"
                  id="client-inquiry-form"
                >
                  {submitError && (
                    <div className="px-4 py-3 text-sm text-red-300">
                      {submitError}
                    </div>
                  )}

                  {/* Honeypot — visually hidden, ignored by humans, autofilled by bots */}
                  <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="company-website">Website</label>
                    <input
                      id="company-website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {/* 01 — About You */}
                  <section>
                    <SectionHeader num="01" label="About You" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                        <label className="mb-1 block font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase" htmlFor="form-input-name">YOUR NAME *</label>
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
                        <label className="mb-1 block font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase" htmlFor="form-input-email">YOUR EMAIL *</label>
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

                    <div className="mt-6 border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                      <label className="mb-1 block font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase">COMPANY OR BRAND</label>
                      <input
                        type="text"
                        placeholder="e.g. Chronos Horlogerie"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                      />
                    </div>
                  </section>

                  {/* 02 — How You Found Us */}
                  <section>
                    <SectionHeader num="02" label="How You Found Us" />
                    <div className="flex flex-wrap gap-2">
                      {referralSources.map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => setFormData({ ...formData, referralSource: source })}
                          className={getSelectableButtonClass(formData.referralSource === source)}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 03 — How to Proceed */}
                  <section>
                    <SectionHeader num="03" label="How to Proceed" />
                    <div className="flex flex-wrap gap-2">
                      {nextSteps.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFormData({ ...formData, nextStep: item })}
                          className={getSelectableButtonClass(formData.nextStep === item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    {shouldShowBookingFields && (
                      <div className="mt-10 border-t border-white/[0.07] pt-6">
                        <p className="font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase mb-6">DISCOVERY CALL REQUEST</p>
                        <div className="grid gap-8 lg:grid-cols-2">
                          <div>
                            <RowLabel>CALL TYPE</RowLabel>
                            <div className="flex flex-wrap gap-2">
                              {callTypes.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, callType: item })}
                                  className={getSelectableButtonClass(formData.callType === item)}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <RowLabel>BEST TIME WINDOW</RowLabel>
                            <div className="flex flex-wrap gap-2">
                              {meetingDays.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, meetingDay: item })}
                                  className={getSelectableButtonClass(formData.meetingDay === item)}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 04 — The Brief */}
                  {shouldShowBriefFields && (
                    <section>
                      <SectionHeader num="04" label="The Brief" />

                      <div>
                        <RowLabel>PROJECT TYPE</RowLabel>
                        <div className="flex flex-wrap gap-2">
                          {practices.map((practice) => (
                            <button
                              key={practice}
                              type="button"
                              onClick={() => setFormData({ ...formData, practice })}
                              className={getSelectableButtonClass(formData.practice === practice)}
                            >
                              {practice}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-10 grid gap-8 lg:grid-cols-2">
                        <div>
                          <RowLabel>MAIN GOAL</RowLabel>
                          <div className="flex flex-wrap gap-2">
                            {goals.map((goal) => (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => setFormData({ ...formData, goal })}
                                className={getSelectableButtonClass(formData.goal === goal)}
                              >
                                {goal}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <RowLabel>NEEDED DELIVERABLES</RowLabel>
                          <div className="flex flex-wrap gap-2">
                            {deliverableOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setFormData({ ...formData, deliverables: toggleSelection(formData.deliverables, item) })}
                                className={getSelectableButtonClass(formData.deliverables.includes(item))}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-10">
                        <RowLabel>WHERE WILL THE CONTENT BE USED?</RowLabel>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setFormData({ ...formData, platforms: toggleSelection(formData.platforms, item) })}
                              className={getSelectableButtonClass(formData.platforms.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-10">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <RowLabel>PROJECT BUDGET</RowLabel>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
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

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPricingMode('range')}
                                className={getSegmentButtonClass(pricingMode === 'range')}
                              >
                                BUDGET RANGE
                              </button>
                              <button
                                type="button"
                                onClick={() => setPricingMode('exact')}
                                className={getSegmentButtonClass(pricingMode === 'exact')}
                              >
                                I KNOW MY BUDGET
                              </button>
                            </div>
                          </div>
                        </div>

                        {pricingMode === 'exact' ? (
                          <div className="mt-2 border-t border-white/[0.07] pt-6">
                            <div className="flex items-center gap-3 border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                              <span className="font-mono text-sm tracking-[0.2em] text-[#F9A136] uppercase">{currency}</span>
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder={currency === 'ETB' ? 'e.g. 75000' : 'e.g. 1200'}
                                value={exactBudget}
                                onChange={(e) => setExactBudget(e.target.value)}
                                className="w-full border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                              />
                            </div>
                            <p className="mt-3 font-sans text-sm font-light text-neutral-400">
                              Enter the amount you already have approved or want us to work within.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {budgets.map((budget) => (
                              <button
                                key={budget}
                                type="button"
                                onClick={() => setFormData({ ...formData, budget })}
                                className={getSelectableButtonClass(formData.budget === budget)}
                              >
                                {budgetLabels[currency][budget]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-10 border-b border-white/10 py-2.5 transition-all focus-within:border-white">
                        <RowLabel>PROJECT DETAILS</RowLabel>
                        <textarea
                          rows={5}
                          placeholder="Tell us about the project, launch, creative direction, or anything else that would help."
                          value={formData.story}
                          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                          className="w-full resize-none border-0 bg-transparent p-0 text-base font-light text-white placeholder:text-[#333] focus:outline-none"
                        />
                      </div>
                    </section>
                  )}

                  {/* Submit — primary CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full cursor-pointer items-center justify-center rounded-full bg-white py-4 font-mono text-[11px] font-bold tracking-[0.16em] text-[#080808] uppercase shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-all duration-500 hover:scale-[1.015] hover:bg-[#F9A136] disabled:pointer-events-none disabled:opacity-60"
                    id="form-submit-button"
                  >
                    <span>{isSubmitting ? 'Sending...' : shouldShowBookingFields ? 'Send Inquiry & Request Call' : 'Send Inquiry'}</span>
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-white/[0.07] pt-12 text-center"
                  id="contact-success-state"
                >
                  <p className="mb-4 font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase">INQUIRY RECEIVED</p>
                  <h3 className="mb-5 font-sans text-3xl font-extralight tracking-tight text-white uppercase">
                    We got your request.
                  </h3>
                  <p className="mx-auto max-w-md font-sans text-sm font-light leading-relaxed text-neutral-400">
                    Your details are queued for review. A partner reaches out within 48 business hours.
                    {emailFailed && ' Your inquiry is safely stored — the email alert to our team was delayed, but it appears in our dashboard.'}
                  </p>

                  <div className="mx-auto mt-10 max-w-sm border-t border-white/5 pt-6 font-mono text-[10px] text-neutral-500 uppercase">
                    <p>INQUIRY REF: {inquiryReference}</p>
                    <p className="mt-1">MACH10 MEDIA GROUP — ADDIS ABABA</p>
                  </div>

                  <button
                    onClick={resetForm}
                    className="mt-10 font-mono text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:text-[#F9A136]"
                  >
                    Send Another Inquiry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side rail — studio info */}
          <div className="lg:col-span-4 space-y-12">
            {bookingUrl && (
              <div className="border-t border-white/[0.07] pt-5">
                <p className="font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase">SKIP THE WAIT</p>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-neutral-400">
                  Prefer to lock a time right now? Pick a slot directly on our live calendar.
                </p>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-4 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:text-[#F9A136]"
                  id="instant-booking-link"
                >
                  <span>Open Booking Calendar</span>
                  <ExternalLink className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </a>
              </div>
            )}

            <div className="border-t border-white/[0.07] pt-5">
              <p className="mb-6 font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">OUR OFFICE</p>

              <div className="space-y-8">
                {offices.map((office, index) => (
                  <div key={index}>
                    <h4 className="font-sans text-lg font-extralight tracking-tight text-white uppercase">
                      {office.city}
                    </h4>
                    <p className="mt-1 font-sans text-sm text-neutral-400">{office.desc}</p>
                    <p className="mt-3 font-sans text-sm font-light leading-relaxed text-neutral-400">
                      {office.address}
                    </p>
                    <div className="mt-3 flex flex-col items-start gap-1.5 font-mono text-[11px] tracking-[0.12em] text-neutral-400">
                      <a href={`mailto:${office.email}`} className="transition-colors hover:text-[#F9A136]">
                        {office.email}
                      </a>
                      <a href="tel:+251920969486" className="transition-colors hover:text-[#F9A136]">
                        {office.phone}
                      </a>
                      <a
                        href="https://wa.me/251920969486?text=Hello%20Mach10%20Media%20—%20I%27d%20like%20to%20discuss%20a%20project."
                        target="_blank"
                        rel="noreferrer"
                        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-mono text-[10px] font-bold tracking-[0.2em] text-[#080808] uppercase transition-all duration-300 hover:scale-[1.015] hover:bg-[#1FBF5B]"
                        id="whatsapp-contact-button"
                      >
                        <span>Chat on WhatsApp</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              <p>GENERAL CONTACT</p>
              <p className="mt-2 text-white">Mach10media.et@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
