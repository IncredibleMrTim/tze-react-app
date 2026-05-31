'use client'

import type { IJob, IJigAssignment } from "@/types/interfaces";
import { jigsOf, stageBadge, stageLabel } from "@/lib/helpers";

interface JobCardProps {
  job: IJob;
  jigA: IJigAssignment[];
  onClick: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, jigA, onClick }) => {
  const jigs = jigsOf(job.id, jigA);
  const badge = stageBadge(job, jigA);
  const label = stageLabel(job, jigA);

  const badgeColors: Record<string, string> = {
    'b-intake': 'bg-gray-100 text-gray-700',
    'b-jig': 'bg-emerald-100 text-emerald-900',
    'b-dispatch': 'bg-blue-100 text-blue-900',
    'b-done': 'bg-green-100 text-green-900',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-3.5 mb-2.5 cursor-pointer transition-colors active:border-primary ${
        label === 'Ready to dispatch' ? 'border-l-4 border-primary' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-bold text-[15px]">{job.po_number}</div>
      </div>
      <div className="text-[13px] text-gray-600 mb-1">{job.customer_name}</div>

      <div className="flex gap-1.5 flex-wrap mt-1.5">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColors[badge] || 'bg-gray-100 text-gray-700'}`}>
          {label}
        </span>
        {job.plating === 'gold' && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800">
            Gold
          </span>
        )}
        {job.urgent && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
            Urgent
          </span>
        )}
        {job.isInternal && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
            Internal
          </span>
        )}
      </div>

      {jigs.length > 0 && (
        <div className="text-[12px] text-gray-500 mt-1.5 flex items-center gap-1 flex-wrap">
          {jigs.map((g) => (
            <span
              key={g.id}
              className={`inline-block w-2 h-2 rounded-full ${
                g.completedAt ? 'bg-primary' : 'bg-yellow-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
