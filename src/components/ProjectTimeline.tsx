import { CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";

// Define the shape of a single timeline event
export interface TimelineEvent {
  date: string;
  title: string;
  desc: string;
  status: "completed" | "current" | "upcoming";
}

interface ProjectTimelineProps {
  data: TimelineEvent[];
  title?: string; // Optional custom title
}

export default function ProjectTimeline({ data, title = "Project Timeline" }: ProjectTimelineProps) {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold tracking-widest uppercase mb-3 border border-blue-100">
            <Clock className="w-3 h-3" /> Execution Roadmap
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 mt-2">Track the lifecycle of this asset from inception to first payout.</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100" />

          <div className="space-y-12">
            {data.map((event, i) => {
              const isCompleted = event.status === "completed";
              const isCurrent = event.status === "current";

              return (
                <div key={i} className="relative flex gap-8 group">
                  
                  {/* Icon Marker */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-4 transition-all duration-300 shrink-0
                    ${isCompleted ? 'bg-[#05CE78] border-green-100 text-white' : 
                      isCurrent ? 'bg-white border-[#05CE78] text-[#05CE78] shadow-xl shadow-green-900/10' : 
                      'bg-gray-50 border-gray-100 text-gray-300'}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                     isCurrent ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                     <Circle className="w-6 h-6" />}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 p-6 rounded-2xl border transition-all duration-300 relative
                    ${isCurrent ? 'bg-white border-[#05CE78]/30 shadow-lg ring-1 ring-[#05CE78]/10' : 
                      'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-md'}`}
                  >
                    {/* Arrow for current item */}
                    {isCurrent && (
                      <div className="absolute top-6 -left-2 w-4 h-4 bg-white border-l border-b border-[#05CE78]/30 transform rotate-45" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <h3 className={`text-lg font-bold ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                        {event.title}
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit
                        ${isCompleted ? 'bg-green-100 text-green-700' : 
                          isCurrent ? 'bg-blue-50 text-blue-700' : 
                          'bg-gray-200 text-gray-500'}`}
                      >
                        {event.date}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{event.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}