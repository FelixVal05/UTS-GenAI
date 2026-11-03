import React, { useState, useEffect } from 'react';
import {
  CandidateCV,
  EvaluationReportData,
  GapAnalysisResult,
  InterviewerPersona,
  JobProfile,
  ViewState,
} from './types.ts';
import {
  INTERVIEWER_PERSONAS,
  SAMPLE_CVS,
  SAMPLE_JOBS,
  performGapAnalysis,
} from './utils/interview-analyzer.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingHero } from './components/LandingHero.tsx';
import { SetupView, SetupFormData } from './components/SetupView.tsx';
import { PreInterviewAnalysis } from './components/PreInterviewAnalysis.tsx';
import { InterviewRoom } from './components/InterviewRoom.tsx';
import { EvaluationReport } from './components/EvaluationReport.tsx';
import { HistoryAndDocs } from './components/HistoryAndDocs.tsx';
import { Footer } from './components/Footer.tsx';
import {
  createSession,
  getSession,
  makePlan,
  startInterview,
  BackendSession,
  BackendPlan,
  BackendReport,
} from './services/api.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedCV, setSelectedCV] = useState<CandidateCV>(SAMPLE_CVS[0]);
  const [selectedJob, setSelectedJob] = useState<JobProfile>(SAMPLE_JOBS[0]);
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>(
    INTERVIEWER_PERSONAS[0]
  );
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult>(() =>
    performGapAnalysis(SAMPLE_CVS[0], SAMPLE_JOBS[0])
  );
  const [latestReport, setLatestReport] = useState<EvaluationReportData | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Live Backend State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [backendPlan, setBackendPlan] = useState<BackendPlan | null>(null);
  const [backendReport, setBackendReport] = useState<BackendReport | null>(null);
  const [initialAiGreeting, setInitialAiGreeting] = useState<{
    ai_text: string;
    ai_audio_b64: string | null;
    llm_provider: string;
  } | null>(null);

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isLoadingStart, setIsLoadingStart] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<SetupFormData>({
    scenario: SAMPLE_JOBS[0].title,
    persona: 'netral',
    language: 'id',
    github: SAMPLE_CVS[0].githubUsername,
    job_url: SAMPLE_JOBS[0].url,
    job_text: '',
    cvFile: null,
  });

  const handleUpdateFormData = (updates: Partial<SetupFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // URL query parameters check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const autostart = params.get('autostart');
      const viewParam = params.get('view') as ViewState | null;

      if (autostart === '1' || viewParam === 'interview') {
        setIsSessionActive(true);
        setCurrentView('interview');
      } else if (
        viewParam &&
        ['landing', 'setup', 'analysis', 'interview', 'report', 'history_docs'].includes(viewParam)
      ) {
        setCurrentView(viewParam);
      }
    }
  }, []);

  const handleUpdateCV = (cv: CandidateCV) => {
    setSelectedCV(cv);
    setGapAnalysis(performGapAnalysis(cv, selectedJob));
    setFormData((prev) => ({
      ...prev,
      github: cv.githubUsername,
    }));
  };

  const handleUpdateJob = (job: JobProfile) => {
    setSelectedJob(job);
    setGapAnalysis(performGapAnalysis(selectedCV, job));
    setFormData((prev) => ({
      ...prev,
      scenario: job.title || prev.scenario,
      job_url: job.url,
    }));
  };

  // 1. Eksekusi Analisis & Pembuatan Sesi Nyata di Backend (POST /sessions)
  // 1. Eksekusi Analisis & Pembuatan Sesi Nyata di Backend (POST /sessions -> POST /sessions/{id}/plan)
  const handleRunAnalysis = async () => {
    setIsLoadingSession(true);
    setSetupError(null);

    try {
      // Panggil backend FastAPI
      // Panggil backend FastAPI untuk membuat sesi
      const session: BackendSession = await createSession({
        scenario: formData.scenario || selectedJob.title || 'Wawancara Teknis',
        persona: formData.persona,
        language: formData.language,
        github: formData.github,
        job_url: formData.job_url,
        job_text: formData.job_text,
        cv: formData.cvFile,
      });

      setSessionId(session.id);

      // Mulai jalankan Planner di backend (via start session atau get plan)
      // Panggil startInterview untuk memicu planner + kick-off AI
      // Jalankan Planner Agent & Fact-checker di backend agar blueprint terisi lengkap
      try {
        const plan = await makePlan(session.id);
        if (plan) {
          setBackendPlan(plan);
        }
      } catch (planErr: any) {
        console.warn('makePlan fallback: Planner akan dijalankan saat /start:', planErr);
        // Fallback: baca jika sesi sudah memuat plan parsial
        try {
          const full = await getSession(session.id);
          if (full.plan) {
            setBackendPlan(full.plan);
          }
        } catch {}
      }

      setIsLoadingSession(false);
      setCurrentView('analysis');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Ambil detail sesi untuk membaca plan jika sudah ada
      try {
        const full = await getSession(session.id);
        if (full.plan) {
          setBackendPlan(full.plan);
        }
      } catch {
        // Abaikan jika plan belum dibuat (akan dibuat saat klik Masuk Wawancara)
      }
    } catch (err: any) {
      console.error('Create session error:', err);
      setSetupError(err.message || 'Gagal menghubungi backend FastAPI');
      setIsLoadingSession(false);
    }
  };

  // 2. Masuk ke Ruang Wawancara (POST /sessions/{id}/start)
  const handleEnterInterview = async () => {
    if (!sessionId) {
      // Fallback mode jika masuk langsung tanpa backend id
      setIsSessionActive(true);
      setCurrentView('interview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoadingStart(true);
    try {
      // Jalankan kick-off start wawancara
      const startResp = await startInterview(sessionId, true);
      setInitialAiGreeting(startResp);

      // Ambil blueprint plan final dari backend
      try {
        const full = await getSession(sessionId);
        if (full.plan) {
          setBackendPlan(full.plan);
        }
      } catch (e) {
        console.warn('Failed to refresh plan after start:', e);
      }

      setIsSessionActive(true);
      setIsLoadingStart(false);
      setCurrentView('interview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Start interview error:', err);
      alert('Gagal memulai sesi wawancara: ' + (err.message || err));
      setIsLoadingStart(false);
    }
  };

  const handleFinishInterview = (report: EvaluationReportData, rawBackendReport?: BackendReport) => {
    setLatestReport(report);
    if (rawBackendReport) {
      setBackendReport(rawBackendReport);
    }
    setIsSessionActive(false);
    setCurrentView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Default initial mock report fallback jika user langsung loncat ke report
  const getActiveReport = (): EvaluationReportData => {
    if (latestReport) return latestReport;

    return {
      id: 'rep-initial',
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      candidateName: formData.cvFile ? formData.cvFile.name.replace('.pdf', '') : selectedCV.name,
      jobRole: formData.scenario || selectedJob.title,
      company: selectedJob.company,
      persona: selectedPersona,
      overallScore: 86,
      technicalScore: 88,
      starStructureScore: 84,
      huggingFaceRelevanceScore: 89,
      avgWpm: 138,
      avgSilenceRatio: 14,
      totalFillerCount: 4,
      summaryFeedback:
        'Performa wawancara sangat meyakinkan. Penguasaan konsep arsitektur selaras dengan persyaratan lowongan, dan penyampaian lisan terstruktur dengan STAR framework.',
      strengths: [
        'Mampu menjelaskan alur kerja proyek nyata secara terstruktur (Situation, Task, Action, Result).',
        'Terminologi teknis (database query, caching, concurrency) akurat dan mendalam.',
        'Tenang menghadapi pertanyaan kejaran adaptif dari pewawancara.',
      ],
      weaknesses: [
        'Masih terdapat sedikit keraguan (silence delay) saat menjelaskan skenario failure recovery.',
        'Perlu menegaskan dampak kuantitatif (angka persentase / waktu) pada bagian Result.',
      ],
      exchanges: [
        {
          questionId: 1,
          question: `Di CV Anda mencantumkan ${selectedCV.projects[0]?.title}. Ceritakan arsitektur backend yang Anda bangun dan bagaimana Anda menangani trade-off performa sistem saat traffic meningkat?`,
          candidateAnswerTranscript:
            'Pada project fintech sebelumnya, tantangan kami adalah query database PostgreSQL mengalami spike latency hingga 2.4 detik saat flash sale. Tugas saya adalah mengidentifikasi bottleneck arsitektur. Saya mengimplementasikan Redis cluster untuk caching data katalog dan connection pooling via PgBouncer. Hasilnya, response time berkurang 65% menjadi 180ms dan sistem berhasil menangani 15,000 RPS tanpa downtime.',
          durationSeconds: 42,
          wpm: 138,
          fillerWords: ['uhm', 'basically'],
          fillerCount: 2,
          silenceRatio: 12,
          technicalAccuracy: 92,
          starCompliance: {
            situation: true,
            task: true,
            action: true,
            result: true,
            score: 95,
          },
          huggingFaceRelevanceScore: 91,
          interviewerFollowUpProbe:
            'Bagaimana mitigasi Anda jika terjadi cache stampede saat flash sale?',
          interviewerFeedback:
            'Penjelasan sangat terstruktur dengan metrik kuantitatif yang jelas.',
          optimalAnswerExample:
            'Ketika menghadapi lonjakan traffic pada modul checkout (Situation), target saya adalah menjaga throughput stabil di bawah SLA 200ms (Task). Saya mengisolasi query read-heavy menggunakan Redis cache dan menerapkan rate limiting (Action). Dampaknya, server uptime bertahan 99.98% tanpa kegagalan transaksi (Result).',
        },
      ],
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-white selection:bg-white selection:text-black">
      {/* Top Bar Contract (Strict 3-zone header) */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isSessionActive={isSessionActive}
      />

      {/* Main View Router with Smooth Transition */}
      <main className="flex-1 overflow-hidden">
        <div key={currentView} className="animate-page-transition">
          {currentView === 'landing' && (
            <LandingHero
              onStartSetup={() => {
                setCurrentView('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPersona={(persona) => {
                setSelectedPersona(persona);
                const backendKey =
                  persona.id === 'friendly' ? 'ramah' : persona.id === 'neutral' ? 'netral' : 'tegas';
                setFormData((prev) => ({ ...prev, persona: backendKey }));
              }}
              onNavigateToDocs={() => {
                setCurrentView('history_docs');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentView === 'setup' && (
            <SetupView
              selectedCV={selectedCV}
              selectedJob={selectedJob}
              selectedPersona={selectedPersona}
              formData={formData}
              onChangeFormData={handleUpdateFormData}
              onSelectCV={handleUpdateCV}
              onSelectJob={handleUpdateJob}
              onSelectPersona={(persona) => {
                setSelectedPersona(persona);
                const backendKey =
                  persona.id === 'friendly' ? 'ramah' : persona.id === 'neutral' ? 'netral' : 'tegas';
                setFormData((prev) => ({ ...prev, persona: backendKey }));
              }}
              onRunAnalysis={handleRunAnalysis}
              onBackToLanding={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isLoading={isLoadingSession}
              errorMessage={setupError}
            />
          )}

          {currentView === 'analysis' && (
            <PreInterviewAnalysis
              cv={selectedCV}
              job={selectedJob}
              persona={selectedPersona}
              gapAnalysis={gapAnalysis}
              backendPlan={backendPlan}
              onEnterInterview={handleEnterInterview}
              onBackToSetup={() => {
                setCurrentView('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isLoadingStart={isLoadingStart}
            />
          )}

          {currentView === 'interview' && (
            <InterviewRoom
              cv={selectedCV}
              job={selectedJob}
              persona={selectedPersona}
              gapAnalysis={gapAnalysis}
              backendPlan={backendPlan}
              sessionId={sessionId}
              initialAiGreeting={initialAiGreeting}
              onFinishInterview={handleFinishInterview}
              onExit={() => {
                setIsSessionActive(false);
                setCurrentView('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentView === 'report' && (
            <EvaluationReport
              report={getActiveReport()}
              backendReport={backendReport}
              backendPlan={backendPlan}
              onRetake={() => {
                setSessionId(null);
                setBackendPlan(null);
                setBackendReport(null);
                setInitialAiGreeting(null);
                setCurrentView('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewHistoryDocs={() => {
                setCurrentView('history_docs');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentView === 'history_docs' && (
            <HistoryAndDocs
              onStartNewSimulation={() => {
                setSessionId(null);
                setBackendPlan(null);
                setBackendReport(null);
                setInitialAiGreeting(null);
                setCurrentView('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
