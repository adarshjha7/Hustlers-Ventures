"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Building2,
  Zap,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Investment Inquiry",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateForm = () => {
    let isValid = true;
    let newErrors = { name: "", email: "", phone: "", message: "" };

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Valid 10-digit phone is required";
      isValid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message cannot be empty";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "General Investment Inquiry", message: "" });
    } catch (err: any) {
      setSubmitError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">

      {/* HERO */}
      <section className="relative bg-[#0B1120] pt-32 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-contact)" />
            <defs>
              <pattern id="grid-contact" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        {/* Dual centered radial glow — matches homepage */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md">
            <Building2 className="w-3 h-3" />
            Investor Relations
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300 drop-shadow-2xl">Start Your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">
              Investment Journey
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Whether you are looking to diversify your portfolio or have specific questions about our assets, our team is ready to assist.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT — overlapping */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="grid lg:grid-cols-5 gap-8 items-stretch">

          {/* LEFT: Contact Info */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">

            {/* Direct Channels card */}
            <div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/60"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.8) inset' }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Direct Channels</h2>
              <div className="space-y-6">

                <a href="tel:+919000272020" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-[#05CE78] transition-colors">
                    <Phone className="w-5 h-5 text-[#05CE78] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phone Support</p>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-[#05CE78] transition-colors">+91 90002 72020</p>
                  </div>
                </a>

                <div className="w-full h-px bg-gray-100" />

                <a href="https://wa.me/919000272020" target="_blank" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-[#25D366] transition-colors">
                    <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">WhatsApp</p>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-[#25D366] transition-colors">Chat with us</p>
                  </div>
                </a>

                <div className="w-full h-px bg-gray-100" />

                <a href="mailto:investments@hustlersventures.co" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email</p>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">investments@hustlersventures.co</p>
                  </div>
                </a>

              </div>
            </div>

            {/* Investor Promise dark card */}
            <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden flex-1 flex flex-col justify-center border border-white/5">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#05CE78]/15 rounded-full blur-[60px] pointer-events-none" />

              <div className="relative z-10">
                <div className="w-10 h-10 bg-[#05CE78]/15 border border-[#05CE78]/30 rounded-xl flex items-center justify-center text-[#05CE78] mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-3">Investor Promise</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  We value your time. All inquiries are routed directly to our core team (IIT Alumni), not a support center.
                </p>
                <div className="flex items-center gap-3 text-sm font-medium text-white/80 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                  <Clock className="w-4 h-4 text-[#05CE78]" />
                  <span>Avg. Response: &lt; 4 Hours</span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm font-medium text-white/80 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                  <Zap className="w-4 h-4 text-[#05CE78]" />
                  <span>IIT Alumni Leadership</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Contact Form */}
          <div className="lg:col-span-3 h-full">
            <div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-white/60 h-full flex flex-col justify-center"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.8) inset' }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send a Message</h2>
              <p className="text-gray-500 mb-8">Tell us about your investment goals.</p>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#05CE78] focus:border-transparent'}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#05CE78] focus:border-transparent'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#05CE78] focus:border-transparent'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Interested Asset Class</label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all appearance-none cursor-pointer font-medium text-gray-900"
                    >
                      <option>General Investment Inquiry</option>
                      <option>Transportation Fleet (Buses)</option>
                      <option>Hospitality (Zostel/Hotels)</option>
                      <option>F&B (Restaurants)</option>
                      <option>Debt Fund Series 1</option>
                      <option>Partnership Proposal</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="How can we help you grow your portfolio?"
                    className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none font-medium placeholder:text-gray-400 ${errors.message ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#05CE78] focus:border-transparent'}`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.message}</p>}
                </div>

                {submitSuccess && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Message sent! We'll get back to you within 4 hours.
                  </div>
                )}
                {submitError && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="w-full bg-[#05CE78] text-white font-bold text-lg py-4 rounded-xl hover:bg-[#04b067] shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] active:scale-[0.99] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    "Sending Securely..."
                  ) : submitSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /> Message Sent</>
                  ) : (
                    <>Send Message <Send className="w-5 h-5" /></>
                  )}
                </button>

              </form>
            </div>
          </div>

        </div>
      </section>

      {/* MAP */}
      <section className="pt-24 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
            <MapPin className="w-3 h-3" /> Visit Us
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Our HQ</h3>
          <p className="text-gray-500 mt-1">CS Coworking Spaces, Shaikpet (Sattva), Hyderabad</p>
        </div>
        <div className="w-full h-80 rounded-3xl overflow-hidden border border-gray-200" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30459.24217490062!2d78.41856448250884!3d17.392327964878987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb97005d6c1287%3A0xb3b109276aff4c0d!2sCS%20Coworking%20Spaces%20-%20Shaikpet%20-%20II(Sattva)%20%7C%20Virtual%20Office%2C%20Private%20Cabins%20%26%20Open%20Desk%20-%2024*2A7%20Access!5e0!3m2!1sen!2sus!4v1782242174185!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale hover:grayscale-0 transition-all duration-700"
          />
        </div>
      </section>

    </div>
  );
}
