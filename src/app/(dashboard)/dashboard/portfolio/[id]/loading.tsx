export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="bg-[#0B1120] rounded-2xl p-8 space-y-6">
        <div className="h-6 w-64 bg-gray-700 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-700 rounded" />
              <div className="h-6 w-32 bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
