import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ArrowUpRight,
  ExternalLink,
  Target,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { CandidateCV, GapAnalysisResult, InterviewerPersona, JobProfile } from '../types.ts';
import { BackendPlan } from '../services/api.ts';
import { resolveTargetJob } from '../utils/interview-analyzer.ts';

interface PreInterviewAnalysisProps {
  cv: CandidateCV;
  job: JobProfile;
  persona: InterviewerPersona;
  gapAnalysis: GapAnalysisResult;
  backendPlan: BackendPlan | null;
  onEnterInterview: () => void;
  onBackToSetup: () => void;
  isLoadingStart?: boolean;
}

export const PreInterviewAnalysis: React.FC<PreInterviewAnalysisProps> = ({
  cv,
  job,
  persona,
  gapAnalysis,
  backendPlan,
  onEnterInterview,
  onBackToSetup,
  isLoadingStart = false,
}) => {
  const matchScore =
    backendPlan?.semantic_match_score != null
      ? Math.round(backendPlan.semantic_match_score)
      : gapAnalysis.matchScore;

  const { title: targetTitle, company: targetCompany } = resolveTargetJob(
    backendPlan,
    job.title,
    job
  );
  const jobError = backendPlan?.job?.error || null;
  const candidateSummary = backendPlan?.candidate_summary || null;

  const skillGaps = backendPlan?.skill_gaps && backendPlan.skill_gaps.length > 0
    ? backendPlan.skill_gaps
    : gapAnalysis.skillGaps.map((g) => ({
        requirement: g,
        level: 'wajib',
        status: 'belum_terbukti',
        evidence: 'Target uji silang dalam sesi',
      }));

  const verifiedSkills = skillGaps.filter((g) => g.status === 'terbukti');
  const unverifiedGaps = skillGaps.filter((g) => g.status !== 'terbukti');

  const githubRepos = backendPlan?.github?.repos || [];
  const githubClaims = backendPlan?.claims || [];

  const topics = backendPlan?.topics || gapAnalysis.recommendedQuestions.map((q) => ({
    topic: q.focus,
    goal: q.rationale,
    questions: [q.questionText],
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-white">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBackToSetup}
            className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white transition-colors mb-2 inline-flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Ubah Konfigurasi Lowongan / CV</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            PRE-INTERVIEW BLUEPRINT &amp; ANALISIS CELAH
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
            Blueprint wawancara AI siap. Pewawancara <strong>{persona.name}</strong> akan menguji celah spesifik antara resume dan kualifikasi lowongan.
          </p>
        </div>

        <button
          onClick={onEnterInterview}
          disabled={isLoadingStart}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg whitespace-nowrap shadow-xl"
        >
          {isLoadingStart ? (
            <>
              <Loader2 className="w-4 h-4 text-black animate-spin" />
              <span>Menyiapkan Audio &amp; Memulai...</span>
            </>
          ) : (
            <>
              <span>Masuk Ruang Wawancara</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </>
          )}
        </button>
      </div>

      {/* Warning jika lowongan scraper terblokir */}
      {jobError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300">Peringatan Ekstraksi Lowongan:</strong> {jobError}
          </div>
        </div>
      )}

      {/* Ringkasan Kandidat oleh Planner */}
      {candidateSummary && (
        <div className="mb-8 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Ringkasan Profil Kandidat (Planner Agent)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
            {candidateSummary}
          </p>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Match Score Card */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            CV-TO-JOB MATCH (HF / SEMANTIC)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white font-mono tabular-nums">
              {matchScore}%
            </span>
            <span className="text-xs text-slate-400 font-light">
              {matchScore >= 75 ? 'Kesesuaian tinggi' : 'Celah teknis terdeteksi'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-4 overflow-hidden">
            <div
              className="bg-white h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(5, matchScore))}%` }}
            />
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400">
            {verifiedSkills.length} terbukti dari {skillGaps.length} syarat lowongan.
          </div>
        </div>

        {/* Target Job Info Card */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            TARGET LOWONGAN KERJA
          </div>
          <div className="font-bold text-white text-base truncate">{targetTitle}</div>
          <div className="text-xs text-slate-400 mt-0.5">{targetCompany}</div>
          <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>PLATFORM: {job.platform.toUpperCase()}</span>
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-200 hover:text-white underline"
              >
                <span>BUKA LINK</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Assigned Persona Card */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              PEWAWANCARA AKTIF
            </div>
            <div className="text-2xl font-black uppercase text-white tracking-tight">{persona.name}</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">{persona.tone}</div>
          </div>
          <div className="text-[11px] text-slate-400 font-light mt-2 line-clamp-2">
            {persona.description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Skill Gaps */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              <span>Analisis Skill Gap Lowongan ({skillGaps.length})</span>
            </h2>

            {/* Matched Skills */}
            {verifiedSkills.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Keahlian Terbukti di CV/GitHub ({verifiedSkills.length})</span>
                </div>
                <div className="space-y-2">
                  {verifiedSkills.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-200 font-medium">
                        <span>{item.requirement}</span>
                        <span className="text-[10px] font-mono uppercase text-emerald-400">Terbukti</span>
                      </div>
                      {item.evidence && (
                        <div className="text-[11px] text-slate-400 font-light mt-1">{item.evidence}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unverified Gaps */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Celah Teknis / Target Probing ({unverifiedGaps.length})</span>
              </div>
              <div className="space-y-2">
                {unverifiedGaps.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-500/[0.05] border border-amber-500/20 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{item.requirement}</span>
                      <span className="text-[10px] font-mono uppercase text-amber-400">
                        {item.status === 'sebagian' ? 'Sebagian' : 'Belum Terbukti'}
                      </span>
                    </div>
                    {item.evidence && (
                      <div className="text-[11px] text-slate-400 font-light mt-1">{item.evidence}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: GitHub Fact-Checker & Topics */}
        <div className="lg:col-span-6 space-y-6">
          {/* GitHub Fact-Checker Card */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-400" />
              <span>GitHub Fact-Checker &amp; Verifikasi Klaim</span>
            </h2>
            <div className="text-xs text-slate-400 font-mono mb-4">
              Status GitHub:{' '}
              <strong className="text-white">
                {backendPlan?.github?.found ? 'Terhubung & Terbaca' : 'Tidak Ditemukan / Tidak Ada'}
              </strong>
            </div>

            {/* Claims Verification from Planner */}
            {githubClaims.length > 0 ? (
              <div className="space-y-3">
                {githubClaims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold font-mono text-white">{claim.claim}</span>
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          claim.status === 'match'
                            ? 'text-emerald-400'
                            : claim.status === 'mismatch'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {claim.status === 'match'
                          ? 'Cocok'
                          : claim.status === 'mismatch'
                          ? 'Tidak Cocok'
                          : 'Belum Terverifikasi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                      {claim.evidence}
                    </p>
                  </div>
                ))}
              </div>
            ) : githubRepos.length > 0 ? (
              <div className="space-y-3">
                {githubRepos.slice(0, 4).map((repo, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold font-mono text-white">{repo.name}</span>
                      <span className="text-[10px] font-mono uppercase text-emerald-400">
                        {repo.main_language || 'Public'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light line-clamp-2">
                      {repo.description || repo.readme_excerpt?.slice(0, 100) || 'Repositori aktif'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono py-2">
                Tidak ada data repositori GitHub publik yang perlu diverifikasi pada profil ini.
              </div>
            )}
          </div>

          {/* Agenda Topik Wawancara */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              AGENDA TOPIK WAWANCARA OLEH {persona.name.toUpperCase()}
            </div>
            <div className="space-y-3 pt-2">
              {topics.map((t, idx) => (
                <div key={idx} className="text-xs border-l border-white/30 pl-3.5 py-1">
                  <div className="font-bold text-white uppercase text-[11px]">{t.topic}</div>
                  <div className="text-slate-400 text-[11px] font-light mt-0.5">{t.goal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-bold text-base uppercase tracking-tight text-white">
            Siap Memulai Sesi Bersama {persona.name}?
          </div>
          <div className="text-xs text-slate-400 font-light mt-1">
            Gunakan tombol <strong>Push-to-Talk (atau Spasi)</strong> di dalam ruang wawancara untuk merespon secara lisan.
          </div>
        </div>
        <button
          onClick={onEnterInterview}
          disabled={isLoadingStart}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg whitespace-nowrap shadow-xl"
        >
          {isLoadingStart ? (
            <>
              <Loader2 className="w-4 h-4 text-black animate-spin" />
              <span>Memulai Sesi...</span>
            </>
          ) : (
            <>
              <span>Mulai Wawancara Suara</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
