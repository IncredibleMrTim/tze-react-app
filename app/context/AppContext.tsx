'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { IJob, IJigAssignment, ISettings, IStorageState } from "@/types/interfaces";
import { DEFAULT_SETTINGS, generateJigsList } from "@/constants/settings.const";
import { loadState, saveState, loadApiKey } from "@/lib/storage";
import { getNextTZE } from "@/lib/helpers";

interface AppContextType {
  jobs: IJob[];
  jigA: IJigAssignment[];
  jigPhotos: Record<string, string>;
  invSeq: number;
  settings: ISettings;
  jigsList: string[];
  toast: string | null;
  lightbox: string | null;
  handleSaveJob: (job: IJob) => void;
  handleUpdateJob: (updatedJob: IJob) => void;
  handleDeleteJob: (jobId: string) => void;
  handleAssignJobToJig: (jigName: string, jobId: string, pct: number) => void;
  handleCompleteJig: (jigName: string) => void;
  handleDispatch: (job: IJob, invoiceNumber: string) => void;
  handleJobClick: (job: IJob) => void;
  showToast: (message: string) => void;
  showLightbox: (src: string) => void;
  closeLightbox: () => void;
  setSettings: (settings: ISettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
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

  const showLightbox = (src: string) => {
    setLightbox(src);
  };

  const closeLightbox = () => {
    setLightbox(null);
  };

  const value: AppContextType = {
    jobs,
    jigA,
    jigPhotos,
    invSeq,
    settings,
    jigsList,
    toast,
    lightbox,
    handleSaveJob,
    handleUpdateJob,
    handleDeleteJob,
    handleAssignJobToJig,
    handleCompleteJig,
    handleDispatch,
    handleJobClick,
    showToast,
    showLightbox,
    closeLightbox,
    setSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
