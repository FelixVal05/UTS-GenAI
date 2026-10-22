import React, { useState } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
  ArrowUpRight,
  Github,
  Globe,
  FileCode2,
  Volume2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  CandidateCV,
  InterviewerPersona,
  JobProfile,
} from '../types.ts';
import {
  INTERVIEWER_PERSONAS,
  SAMPLE_CVS,
  SAMPLE_JOBS,
  extractJobPlatform,
} from '../utils/interview-analyzer.ts';
import {
  resolvePersonaVoice,
  PERSONA_SAMPLE_LINES,
} from '../utils/voice-synthesizer.ts';

export interface SetupFormData {
  scenario: string;
  persona: 'ramah' | 'netral' | 'tegas';
  language: 'id' | 'en';
  github: string;
  job_url: string;
  job_text: string;
  cvFile: File | null;
}

interface SetupViewProps {
  selectedCV: CandidateCV;
  selectedJob: JobProfile;
  selectedPersona: InterviewerPersona;
  formData: SetupFormData;
  onChangeFormData: (data: Partial<SetupFormData>) => void;
  onSelectCV: (cv: CandidateCV) => void;
  onSelectJob: (job: JobProfile) => void;
  onSelectPersona: (persona: InterviewerPersona) => void;
  onRunAnalysis: () => void;
  onBackToLanding: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const SetupView: React.FC<SetupViewProps> = ({
  selectedCV,
  selectedJob,
  selectedPersona,
  formData,
  onChangeFormData,
  onSelectCV,
  onSelectJob,
  onSelectPersona,
  onRunAnalysis,
  onBackToLanding,
  isLoading = false,
  errorMessage = null,
}) => {
  const [playingPersonaId, setPlayingPersonaId] = useState<string | null>(null);

  const handleTestPersonaVoice = (e: React.MouseEvent, persona: InterviewerPersona) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (playingPersonaId === persona.id) {
      setPlayingPersonaId(null);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const config = resolvePersonaVoice(persona, voices);
    const text = PERSONA_SAMPLE_LINES[persona.id];
    const utterance = new SpeechSynthesisUtterance(text);

    if (config.voice) {
      utterance.voice = config.voice;
      utterance.lang = config.voice.lang || (formData.language === 'en' ? 'en-US' : 'id-ID');
    } else {
      utterance.lang = formData.language === 'en' ? 'en-US' : 'id-ID';
    }

    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    setPlayingPersonaId(persona.id);

    utterance.onend = () => setPlayingPersonaId(null);
    utterance.onerror = () => setPlayingPersonaId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChangeFormData({ cvFile: file });
      onSelectCV({
        ...selectedCV,
        fileName: file.name,
      });
    }
  };

  const handleApplyPresetJob = (job: JobProfile) => {
    onSelectJob(job);
    onChangeFormData({
      job_url: job.url,
      scenario: job.title || formData.scenario,
    });
  };

  const handleCustomUrlChange = (url: string) => {
    onChangeFormData({ job_url: url });
    const platform = extractJobPlatform(url);
    onSelectJob({
      ...selectedJob,
      url,
      platform,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <div className="mb-8">
        <button
          onClick={onBackToLanding}
          className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white transition-colors mb-3 inline-flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Kembali ke Beranda</span>
        </button>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
          KONFIGURASI SESI WAWANCARA
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
          Unggah CV Anda, tentukan URL lowongan kerja spesifik yang dituju, dan pilih karakter pewawancara AI Anda.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-red-200">Gagal Memulai Sesi:</strong> {errorMessage}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: Upload Resume & GitHub */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center">
                01
              </span>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  Unggah Resume / CV (PDF) &amp; GitHub
                </h2>
                <div className="text-xs text-slate-400 font-light">
                  Mendukung ekstraksi keahlian, verifikasi repositori GitHub, dan analisis gap
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border border-dashed border-white/20 hover:border-white/50 rounded-xl p-8 text-center transition-colors bg-white/[0.01]">
            <input
              type="file"
              id="cv-upload-input"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="cv-upload-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 text-white flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Klik untuk unggah file PDF Resume / CV Anda
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Format PDF Asli (Maksimal 5 MB)
              </div>
            </label>

            {formData.cvFile ? (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>File aktif: {formData.cvFile.name} ({(formData.cvFile.size / 1024).toFixed(1)} KB)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-1" />
              </div>
            ) : selectedCV.fileName ? (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/20 text-white text-xs font-mono">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Preset profil: {selectedCV.fileName}</span>
              </div>
            ) : null}
          </div>

          {/* GitHub Input */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="github-input" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Username GitHub (Opsional, Verifikasi Otomatis)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Github className="w-4 h-4" />
                </div>
                <input
                  id="github-input"
                  type="text"
                  value={formData.github}
                  onChange={(e) => onChangeFormData({ github: e.target.value })}
                  placeholder="contoh: octocat atau allanbendatu"
                  className="w-full pl-10 pr-4 py-2.5 text-xs text-white bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-white font-mono placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="scenario-input" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Skenario / Target Posisi Wawancara
              </label>
              <input
                id="scenario-input"
                type="text"
                value={formData.scenario}
                onChange={(e) => onChangeFormData({ scenario: e.target.value })}
                placeholder="contoh: Fullstack Intern atau Applied AI Engineer"
                className="w-full px-4 py-2.5 text-xs text-white bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-white font-mono placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Preset CV quick pickers */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
              Atau pilih profil percontohan untuk pengujian cepat:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_CVS.map((cv) => (
                <button
                  key={cv.id}
                  type="button"
                  onClick={() => {
                    onSelectCV(cv);
                    onChangeFormData({
                      github: cv.githubUsername,
                      scenario: cv.targetRole,
                    });
                  }}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    selectedCV.id === cv.id && !formData.cvFile
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold uppercase tracking-tight">{cv.name}</div>
                  <div className="text-[11px] opacity-75 font-mono mt-0.5">{cv.targetRole}</div>
                  <div className="text-[11px] opacity-90 font-mono mt-0.5">
                    github.com/{cv.githubUsername}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Job URL & Fallback Text */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center">
              02
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">
                Tautan (URL) Lowongan Kerja Spesifik &amp; Fallback
              </h2>
              <div className="text-xs text-slate-400 font-light">
                Didukung scraper LinkedIn Guest API, Jina Reader, Glints, Kalibrr, atau tempel teks manual
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="job-url-input" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                URL Lowongan Kerja
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  id="job-url-input"
                  type="url"
                  value={formData.job_url}
                  onChange={(e) => handleCustomUrlChange(e.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  className="w-full pl-10 pr-4 py-3 text-xs text-white bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-white font-mono placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Pilih contoh lowongan nyata untuk simulasi cepat:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_JOBS.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleApplyPresetJob(job)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      selectedJob.id === job.id && formData.job_url === job.url
                        ? 'border-white bg-white text-black font-semibold'
                        : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-widest opacity-75">{job.platform}</div>
                    <div className="font-bold truncate mt-0.5">{job.title}</div>
                    <div className="text-[11px] opacity-75 truncate">{job.company}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual text area fallback */}
            <div className="pt-2">
              <label htmlFor="job-text-fallback" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Atau Tempel Teks Deskripsi Lowongan (Fallback jika link terblokir)</span>
                <span className="text-[10px] text-slate-500">Opsional / Alternatif URL</span>
              </label>
              <textarea
                id="job-text-fallback"
                rows={4}
                value={formData.job_text}
                onChange={(e) => onChangeFormData({ job_text: e.target.value })}
                placeholder="Tempel kualifikasi / requirements lowongan secara manual di sini jika situs lowongan memblokir scraper..."
                className="w-full p-3 text-xs text-white bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-white font-mono placeholder:text-slate-600 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Interviewer Persona & Bahasa */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center">
                03
              </span>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  Pilih Karakter Pewawancara &amp; Bahasa
                </h2>
                <div className="text-xs text-slate-400 font-light">
                  Menyesuaikan intonasi, frekuensi pertanyaan kejaran (follow-up), dan bahasa respons
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-lg border border-white/10 self-start sm:self-auto">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <button
                type="button"
                onClick={() => onChangeFormData({ language: 'id' })}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-semibold transition-all ${
                  formData.language === 'id' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                ID (Indonesia)
              </button>
              <button
                type="button"
                onClick={() => onChangeFormData({ language: 'en' })}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-semibold transition-all ${
                  formData.language === 'en' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN (English)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INTERVIEWER_PERSONAS.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              const personaBackendKey =
                persona.id === 'friendly' ? 'ramah' : persona.id === 'neutral' ? 'netral' : 'tegas';

              return (
                <div
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona);
                    onChangeFormData({ persona: personaBackendKey });
                  }}
                  className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-white bg-white text-black shadow-xl ring-1 ring-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                        {persona.id} &middot; {personaBackendKey.toUpperCase()}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="font-black text-xl uppercase tracking-tight mb-1 flex items-center justify-between">
                      <span>{persona.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-current opacity-70">
                        {persona.id === 'friendly' ? 'RAMAH' : persona.id === 'neutral' ? 'NETRAL' : 'TEGAS'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold mb-2 opacity-90">
                      {persona.tone}
                    </div>
                    <p className="text-[11px] leading-relaxed font-light opacity-80 mb-3">
                      {persona.description}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleTestPersonaVoice(e, persona)}
                      className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-black text-white hover:bg-neutral-800'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      <Volume2
                        className={`w-3.5 h-3.5 ${
                          playingPersonaId === persona.id ? 'animate-pulse text-emerald-400' : ''
                        }`}
                      />
                      <span>
                        {playingPersonaId === persona.id ? 'Memutar Suara...' : 'Uji Sampel Suara'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-xs font-mono text-slate-400">
            AUDIO: WEBRTC / MEDIARECORDER + WEBAUDIO API REAL-TIME
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg whitespace-nowrap shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-black animate-spin" />
                <span>Menganalisis &amp; Menyiapkan Sesi...</span>
              </>
            ) : (
              <>
                <span>Analisis Celah &amp; Mulai Blueprint</span>
                <ArrowUpRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
