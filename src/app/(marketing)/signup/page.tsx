"use client";

import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-20 px-4">
      <div className="w-full max-w-md bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Create Your Account
        </h1>

        <form className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Full Name
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#05CE78] focus:outline-none focus:border-transparent transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#05CE78] focus:outline-none focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#05CE78] focus:outline-none focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full btn-primary">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#05CE78] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
