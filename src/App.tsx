import { useState, useEffect } from 'react';
import type { IJob, IJigAssignment, ISettings, IStorageState } from "@/interfaces";
import type { TTab } from "@/types";
import { DEFAULT_SETTINGS, generateJigsList } from "@/constants/settings.const";
import { loadState, saveState, loadApiKey } from "@/lib/storage";
import { getNextTZE } from "@/lib/helpers";
import { Toast } from "@/components/Toast";
import { Lightbox } from "@/components/Lightbox";
import { JobsView } from "@/components/JobsView";
import { IntakeView } from "@/components/IntakeView";
import { JIGView } from "@/components/JIGView";
import { DispatchView } from "@/components/DispatchView";
import { SettingsView } from "@/components/SettingsView";

function App() {
  const [tab, setTab] = useState<TTab>('jobs');
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [jigA, setJigA] = useState<IJigAssignment[]>([]);
  const [jigPhotos, setJigPhotos] = useState<Record<string, string>>({});
  const [invSeq, setInvSeq] = useState(1);
  const [settings, setSettings] = useState<ISettings>({ ...DEFAULT_SETTINGS, apiKey: loadApiKey() });
  const [jigsList, setJigsList] = useState<string[]>(generateJigsList(settings.jigCount));
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Load state on mount
  useEffect(() => {
    const state = loadState();
    if (state) {
      setJobs(state.jobs);
      setJigA(state.jigA);
      setJigPhotos(state.jigPhotos);
      setInvSeq(state.invSeq);
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    const state: IStorageState = {
      jobs,
      jigA,
      jigPhotos,
      invSeq,
      nextTZE: getNextTZE(),
    };
    saveState(state);
  }, [jobs, jigA, jigPhotos, invSeq]);

  // Update jigs list when settings change
  useEffect(() => {
    setJigsList(generateJigsList(settings.jigCount));
  }, [settings.jigCount]);

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleSaveJob = (job: IJob) => {
    setJobs([...jobs, job]);
  };

  const handleUpdateJob = (updatedJob: IJob) => {
    setJobs(jobs.map(j => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
    setJigA(jigA.filter(g => g.jobId !== jobId));
  };

  const handleAssignJobToJig = (jigName: string, jobId: string, pct: number) => {
    const assignment: IJigAssignment = {
      id: Date.now().toString(),
      jobId,
      jigName,
      pct,
      pic: null,
      completedAt: null,
      loadedAt: Date.now(),
    };
    setJigA([...jigA, assignment]);
  };

  const handleCompleteJig = (jigName: string) => {
    const now = Date.now();
    setJigA(jigA.map(g =>
      g.jigName === jigName && !g.completedAt
        ? { ...g, completedAt: now }
        : g
    ));

    // Mark all jobs on this JIG as PO complete
    const jigJobIds = jigA.filter(g => g.jigName === jigName).map(g => g.jobId);
    setJobs(jobs.map(j =>
      jigJobIds.includes(j.id) ? { ...j, poComplete: true } : j
    ));
  };

  const handleDispatch = (job: IJob, invoiceNumber: string) => {
    handleUpdateJob(job);
    if (invoiceNumber !== 'INTERNAL') {
      setInvSeq(invSeq + 1);
    }
  };

  const handleJobClick = (job: IJob) => {
    showToast(`Viewing: ${job.po_number}`);
  };

  return (
    <div className="w-full max-w-[430px] min-h-screen bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base font-bold text-primary">Tauranga Zinc Electroplaters</h1>
        <span className="text-[11px] text-gray-400">v0.5.97</span>
      </div>

      {/* Phase Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-3.5 py-2 flex items-start gap-2 text-xs text-yellow-900 flex-shrink-0">
        <span className="text-[13px] flex-shrink-0 mt-0.5">⚠️</span>
        <span>
          <strong>React Beta:</strong> Full conversion with all features. Test thoroughly.
        </span>
      </div>

      {/* View Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'jobs' && (
          <JobsView
            jobs={jobs}
            jigA={jigA}
            onJobClick={handleJobClick}
          />
        )}

        {tab === 'intake' && (
          <IntakeView
            settings={settings}
            jobs={jobs}
            jigA={jigA}
            onSave={handleSaveJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onShowToast={showToast}
          />
        )}

        {tab === 'jig' && (
          <JIGView
            jigsList={jigsList}
            jobs={jobs}
            jigA={jigA}
            settings={settings}
            onAssignJob={handleAssignJobToJig}
            onCompleteJig={handleCompleteJig}
            onShowToast={showToast}
          />
        )}

        {tab === 'dispatch' && (
          <DispatchView
            jobs={jobs}
            jigA={jigA}
            settings={settings}
            invSeq={invSeq}
            onDispatch={handleDispatch}
            onShowToast={showToast}
          />
        )}

        {tab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="flex border-t border-gray-200 bg-white flex-shrink-0">
        {[
          { id: 'jobs' as TTab, icon: '🔍', label: 'Search' },
          { id: 'intake' as TTab, icon: '📥', label: 'New Job' },
          { id: 'jig' as TTab, icon: '⚙️', label: 'JIG' },
          { id: 'dispatch' as TTab, icon: '🚚', label: 'Dispatch' },
          { id: 'settings' as TTab, icon: '🔧', label: 'Settings' },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 px-1 py-2.5 flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer text-[10px] font-medium border-t-2 transition-colors ${
              tab === id
                ? 'text-primary border-t-primary'
                : 'text-gray-500 border-t-transparent'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Lightbox */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default App;
