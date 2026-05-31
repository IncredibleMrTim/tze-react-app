import { useState } from 'react';
import type { IJob, IJigAssignment, ISettings } from "@/interfaces";
import { jigUsed } from "@/lib/helpers";
import { EmptyState } from "@/components/EmptyState";

interface JIGViewProps {
  jigsList: string[];
  jobs: IJob[];
  jigA: IJigAssignment[];
  settings: ISettings;
  onAssignJob: (jigName: string, jobId: string, pct: number) => void;
  onCompleteJig: (jigName: string) => void;
  onShowToast: (msg: string) => void;
}

export const JIGView: React.FC<JIGViewProps> = ({
  jigsList,
  jobs,
  jigA,
  settings: _settings,
  onAssignJob,
  onCompleteJig,
  onShowToast
}) => {
  const [selectedJig, setSelectedJig] = useState<string | null>(null);

  const availableJobs = jobs.filter(j => !j.dispatchedAt && j.poComplete);

  const getJigJobs = (jigName: string) => {
    return jigA.filter(g => g.jigName === jigName && !g.completedAt);
  };

  const handleSelectJig = (jigName: string) => {
    setSelectedJig(selectedJig === jigName ? null : jigName);
  };

  const handleAssign = (jigName: string) => {
    if (availableJobs.length === 0) {
      onShowToast('No jobs available to assign');
      return;
    }

    const jobId = availableJobs[0].id;
    const used = jigUsed(jigName, jigA);
    const available = 100 - used;

    if (available <= 0) {
      onShowToast('JIG is full');
      return;
    }

    const pct = Math.min(available, 20); // Default 20% or whatever is left
    onAssignJob(jigName, jobId, pct);
    onShowToast(`Assigned to ${jigName}`);
  };

  const handleComplete = (jigName: string) => {
    const used = jigUsed(jigName, jigA);
    if (used < 100) {
      onShowToast(`JIG must be 100% full (currently ${used}%)`);
      return;
    }

    if (window.confirm(`Mark ${jigName} as complete?`)) {
      onCompleteJig(jigName);
      onShowToast(`${jigName} completed`);
      setSelectedJig(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {jigsList.map(jigName => {
          const used = jigUsed(jigName, jigA);
          const pct = Math.round(used);
          const isFull = pct >= 100;
          const isLoaded = pct > 0;
          const jigJobs = getJigJobs(jigName);

          return (
            <div
              key={jigName}
              onClick={() => handleSelectJig(jigName)}
              className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all active:scale-95 ${
                isFull
                  ? 'border-red-300 bg-red-50'
                  : isLoaded
                  ? 'border-primary bg-primary-bg'
                  : 'border-gray-200 bg-white'
              } ${selectedJig === jigName ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            >
              <div className="font-bold text-sm mb-1">{jigName}</div>
              <div className="text-[11px] text-gray-500 mb-1.5">{pct}%</div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct >= 90 ? 'bg-red-600' : pct >= 70 ? 'bg-orange-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1.5">
                {jigJobs.length} job{jigJobs.length !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {selectedJig && (
        <div className="border-t border-gray-200 pt-4 bg-gray-50 -mx-3 px-3 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">{selectedJig} Details</h3>
            <button
              onClick={() => setSelectedJig(null)}
              className="text-gray-400 text-xl"
            >
              ×
            </button>
          </div>

          {getJigJobs(selectedJig).map(g => {
            const job = jobs.find(j => j.id === g.jobId);
            if (!job) return null;

            return (
              <div key={g.id} className="border border-gray-200 rounded-lg p-3 mb-2 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{job.po_number}</div>
                    <div className="text-xs text-gray-600">{job.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{g.pct}% capacity</div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleAssign(selectedJig)}
              className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium"
            >
              + Add Job
            </button>
            <button
              onClick={() => handleComplete(selectedJig)}
              disabled={jigUsed(selectedJig, jigA) < 100}
              className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ✓ Complete
            </button>
          </div>
        </div>
      )}

      {availableJobs.length === 0 && !selectedJig && (
        <EmptyState
          icon="⚙️"
          title="No jobs ready for JIG"
          message="Mark job POs as complete in the Jobs tab"
        />
      )}
    </div>
  );
};
