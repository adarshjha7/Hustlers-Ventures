import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  AlertTriangle,
  CheckCircle,
  Mail,
} from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">
      
      {/* --- DARK HERO SECTION --- */}
      <div className="relative bg-[#0B1120] pt-32 pb-48 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M0 0H80V80H0V0Z" fill="url(#grid-pattern)" />
             <defs>
               <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
               </pattern>
             </defs>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex justify-start mb-12">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              Back to Home
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[#05CE78] shadow-2xl shadow-green-900/20">
                <Scale className="w-10 h-10" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Terms of Service
            </h1>
            
            <p className="text-gray-400 text-lg">
              Last updated: <span className="text-white font-semibold">May 2026</span>
            </p>
          </div>
        </div>
      </div>

      {/* --- OVERLAPPING CONTENT CARD --- */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 space-y-12">
          
          {/* 1. Acceptance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">01</span>
              <h2 className="text-xl font-bold text-gray-900">Acceptance of Terms</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using the <strong>Hustlers Ventures</strong> platform, you agree to be bound by these Terms of Service. These terms govern your access to our co-ownership opportunities in Transportation, Hospitality, and F&B assets. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">02</span>
              <h2 className="text-xl font-bold text-gray-900">Eligibility & KYC</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Our investment opportunities are available only to individuals who are:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "At least 18 years of age.",
                "A resident of India or an eligible Non-Resident Indian (NRI) complying with FEMA regulations.",
                "Capable of entering into a legally binding contract."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-[#05CE78] shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-gray-700 text-sm">
                <strong>KYC Compliance:</strong> You agree to provide true, accurate, and complete information during the registration process (PAN, Aadhar, Bank Details) as required by Indian banking and investment laws.
              </p>
            </div>
          </section>

          {/* 3. Nature of Investment */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">03</span>
              <h2 className="text-xl font-bold text-gray-900">Co-Ownership Model</h2>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hustlers Ventures facilitates the co-ownership of physical assets. When you invest, you are typically entering into a Limited Liability Partnership (LLP) or a specific asset-leasing agreement. You acknowledge that:
            </p>
            <ul className="space-y-3">
              {[
                "You are a dormant partner/investor and not involved in day-to-day operations.",
                "Returns are generated based on the operational performance of the asset.",
                "Past performance of our fleet or properties does not guarantee future results."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-[#05CE78] shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Risk Disclosure */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-500 font-bold text-sm">04</span>
              <h2 className="text-xl font-bold text-gray-900">Risk Disclosure</h2>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
              <div>
                <p className="text-gray-800 text-sm leading-relaxed mb-3">
                  Investments in alternative assets involve risks. Capital is not guaranteed and past performance does not guarantee future results. You should invest only what you can afford to lose.
                </p>
                <Link href="/risks" className="inline-flex items-center text-orange-600 font-bold text-sm hover:underline">
                  Read full Risk Disclosure →
                </Link>
              </div>
            </div>
          </section>

          {/* 5. User Account Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">05</span>
              <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. Hustlers Ventures cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
            </p>
          </section>

          {/* 6. Modifications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">06</span>
              <h2 className="text-xl font-bold text-gray-900">Modifications</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any significant changes via email or platform notifications. Continued use of the platform constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Related Documents */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-400 font-medium self-center">Related:</span>
            <Link href="/privacy" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Privacy Policy</Link>
            <Link href="/risks" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Risk Disclosure</Link>
          </div>

          {/* Contact Footer */}
          <section className="pt-8 border-t border-gray-100">
            <p className="text-gray-600 mb-4">
              For legal inquiries regarding these terms, please contact us.
            </p>
            <a 
              href="mailto:investments@hustlersventures.co" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-[#05CE78] transition-colors"
            >
              <Mail className="w-4 h-4" /> investments@hustlersventures.co
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}
