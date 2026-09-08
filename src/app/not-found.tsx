import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="w-16 h-16 bg-[#05CE78] rounded-2xl flex items-center justify-center text-black font-bold text-2xl mb-6">
        HV
      </div>
      <h1 className="text-5xl font-extrabold text-gray-900 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#05CE78] text-black font-bold rounded-xl hover:bg-[#04b86c] transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
