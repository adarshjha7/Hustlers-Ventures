import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  User,
  Briefcase,
  Server,
  Mail,
  CheckCircle,
} from "lucide-react";

export default function PrivacyPage() {
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
                <Shield className="w-10 h-10" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Privacy Policy
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
          
          {/* 1. Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">01</span>
              <h2 className="text-xl font-bold text-gray-900">Introduction</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              <strong>Hustlers Ventures</strong> ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our investment platform. We value the trust you place in us and operate with strict adherence to Indian data protection laws.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">02</span>
              <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            <p className="text-gray-600 mb-6">
              We collect information that identifies, relates to, describes, or could reasonably be linked with a particular investor to comply with regulations:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#05CE78]/30 transition-colors">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                  <User className="w-5 h-5 text-[#05CE78]" /> Personal Identifiers
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Name, email address, phone number, PAN card details, and Aadhar number (for mandatory KYC compliance).</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#05CE78]/30 transition-colors">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                  <Briefcase className="w-5 h-5 text-[#05CE78]" /> Financial Data
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Bank account details (for payout transfers), investment transaction history, and risk profile preferences.</p>
              </div>
            </div>
          </section>

          {/* 3. Usage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">03</span>
              <h2 className="text-xl font-bold text-gray-900">How We Use Your Data</h2>
            </div>
            <ul className="space-y-3">
              {[
                "To facilitate asset co-ownership and manage your portfolio dashboard.",
                "To comply with regulatory requirements (KYC/AML norms) mandated by Indian law.",
                "To process monthly operational payouts and dividends directly to your bank account.",
                "To communicate regarding your account, legal updates, or new asset opportunities."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-[#05CE78] shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">04</span>
              <h2 className="text-xl font-bold text-gray-900">Data Security</h2>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
               <Server className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
               <p className="text-gray-700 text-sm leading-relaxed">
                 We implement industry-standard security measures, including <strong>256-bit encryption</strong> for data in transit and at rest. Access to personal data is restricted to authorized personnel only. However, please note that no method of transmission over the Internet is 100% secure.
               </p>
            </div>
          </section>

          {/* Related Documents */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-400 font-medium self-center">Related:</span>
            <Link href="/terms" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Terms of Service</Link>
            <Link href="/risks" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Risk Disclosure</Link>
          </div>

          {/* Contact */}
          <section className="pt-6 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have questions about this policy or wish to exercise your data rights, please contact our Data Protection Officer.
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