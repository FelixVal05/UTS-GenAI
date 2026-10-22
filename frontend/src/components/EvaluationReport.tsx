import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  BarChart2,
  FileCheck,
  Target,
  GitBranch,
} from 'lucide-react';
import { EvaluationReportData } from '../types.ts';
import { BackendPlan, BackendReport } from '../services/api.ts';

interface EvaluationReportProps {
  report: EvaluationReportData;
  backendReport?: BackendReport | null;
  backendPlan?: BackendPlan | null;
  onRetake: () => void;
  onViewHistoryDocs: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({
  report,
  backendReport,
  backendPlan,
  onRetake,
  onViewHistoryDocs,
}) => {
  const [expandedExchangeId, setExpandedExchangeId] = useState<number | null>(
    report.exchanges[0]?.questionId || null
  );

  const handlePrintReport = () => {
    window.print();
  };

  const deliveryOverall = backendReport?.delivery?.overall;
  const voiceTone =
    backendReport?.delivery?.voice_tone_indicator?.label ||
    deliveryOverall?.voice_tone_indicator?.label ||
    'Stabil & Percaya Diri (Intonasi Konsisten)';

  const silenceRatioPct =
    deliveryOverall?.acoustic_silence_ratio != null
      ? Math.round(deliveryOverall.acoustic_silence_ratio * 100)
      : report.avgSilenceRatio;

  const wpm = deliveryOverall?.wpm || report.avgWpm;
  const fillers = deliveryOverall?.fillers ?? report.totalFillerCount;

  const skillGaps = backendPlan?.skill_gaps || [];
  const claims = backendPlan?.claims || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-white">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            RAPOR EVALUASI HIBRIDA PASCA-WAWANCARA &middot; SIMULACRA
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
            HASIL EVALUASI: {report.candidateName}
          </h1>
          <div className="text-xs font-mono text-slate-400 mt-1">
            POSISI: <strong className="text-white">{report.jobRole}</strong> &middot;{' '}
            <strong className="text-white">{report.company}</strong> &middot; TANGGAL: {report.date}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CETAK / PDF</span>
          </button>
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-black" />
            <span>SIMULASI ULANG</span>
          </button>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-white/[0.08] pb-6 md:pb-0 md:pr-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              SKOR PERFORMA KESELURUHAN
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-6xl font-black text-white font-mono tabular-nums">
                {report.overallScore}
              </span>
              <span className="text-lg text-slate-500 font-bold font-mono">/ 100</span>
            </div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-white">
              {report.overallScore >= 80
                ? 'Status: Sangat Direkomendasikan (Tier-1)'
                : report.overallScore >= 65
                ? 'Status: Memenuhi Syarat (Siap User)'
                : 'Status: Perlu Latihan Struktur STAR'}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              DIUJI OLEH: {report.persona.name.toUpperCase()} ({report.persona.tone})
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              RINGKASAN EVALUASI ADAPTIF
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed mb-6">
              {report.summaryFeedback}
            </p>

            {/* 3 Pillar Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Ketepatan Teknis</div>
                <div className="text-2xl font-black text-white font-mono tabular-nums">
                  {report.technicalScore}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-white h-1 rounded-full" style={{ width: `${Math.min(100, report.technicalScore)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Struktur STAR</div>
                <div className="text-2xl font-black text-white font-mono tabular-nums">
                  {report.starStructureScore}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${Math.min(100, report.starStructureScore)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Relevansi Semantik (HF)</div>
                <div className="text-2xl font-black text-white font-mono tabular-nums">
                  {report.huggingFaceRelevanceScore}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${Math.min(100, report.huggingFaceRelevanceScore)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speech Fluency Metrics & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Metrik Kelancaran Bicara (Librosa & Akustik) */}
        <div className="lg:col-span-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <span>Metrik Kelancaran Lisan (Librosa)</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase text-slate-300">Kecepatan Bicara (WPM)</span>
                <span className="text-xs font-mono font-bold text-white tabular-nums">
                  {wpm} WPM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Rentang ideal industri adalah 120–160 WPM. Tempo berbicara Anda tergolong stabil dan jelas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase text-slate-300">Rasio Jeda Hening (Silence)</span>
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {silenceRatioPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Dihitung fisik via <code>librosa.effects.split</code>. Jeda sehat menandakan artikulasi yang tenang.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase text-slate-300">Kata Jeda (Filler Words)</span>
                <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                  {fillers} kali
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Terdeteksi otomatis melalui Groq Whisper word timestamp alignment.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase text-slate-300">Indikator Intonasi / Prosodi</span>
                <span className="text-[11px] font-mono font-bold text-indigo-300">
                  {voiceTone}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Analisis kestabilan energi &amp; pitch kontur vokal dari rekaman audio.
              </p>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="lg:col-span-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <span>Kelebihan &amp; Area Perbaikan</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Poin Kekuatan Utama:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-light">
                {report.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-lg">
                    <span className="text-emerald-400 font-mono font-bold">&bull;</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Area Perbaikan Spesifik (Skill &amp; Delivery):</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-light">
                {report.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-amber-500/[0.04] border border-amber-500/20 p-2.5 rounded-lg">
                    <span className="text-amber-400 font-mono font-bold">&bull;</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Skill Gaps & Verifikasi GitHub */}
      {(skillGaps.length > 0 || claims.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {skillGaps.length > 0 && (
            <div className="lg:col-span-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span>Skill Gap Terhadap Lowongan ({skillGaps.length})</span>
              </h2>
              <div className="space-y-2">
                {skillGaps.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{item.requirement}</span>
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          item.status === 'terbukti'
                            ? 'text-emerald-400'
                            : item.status === 'sebagian'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    {item.evidence && (
                      <div className="text-[11px] text-slate-400 font-light mt-1">{item.evidence}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div className="lg:col-span-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                <span>Verifikasi Klaim CV &amp; GitHub ({claims.length})</span>
              </h2>
              <div className="space-y-2">
                {claims.map((claim, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{claim.claim}</span>
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          claim.status === 'match'
                            ? 'text-emerald-400'
                            : claim.status === 'mismatch'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                    {claim.evidence && (
                      <div className="text-[11px] text-slate-400 font-light mt-1">{claim.evidence}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Per Pertanyaan & Rekomendasi Jawaban Optimal */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Analisis Transkrip &amp; Model Jawaban STAR Optimal</span>
        </h2>

        <div className="space-y-4">
          {report.exchanges.map((exchange) => {
            const isExpanded = expandedExchangeId === exchange.questionId;
            return (
              <div
                key={exchange.questionId}
                className="rounded-xl border border-white/[0.08] overflow-hidden bg-black/40"
              >
                <button
                  onClick={() =>
                    setExpandedExchangeId(isExpanded ? null : exchange.questionId)
                  }
                  className="w-full p-4 text-left hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      PERTANYAAN #{exchange.questionId}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                      {exchange.question}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-white">
                      SKOR: {exchange.technicalAccuracy}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 space-y-4 border-t border-white/[0.08] text-xs">
                    <div>
                      <div className="font-mono text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                        Transkrip Lisan Anda:
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-300 leading-relaxed italic font-light">
                        "{exchange.candidateAnswerTranscript}"
                      </div>
                    </div>

                    {/* Evaluasi STAR Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div
                        className={`p-2 rounded-lg text-center font-mono text-[11px] ${
                          exchange.starCompliance.situation
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
                        }`}
                      >
                        SITUATION: {exchange.starCompliance.situation ? 'OK' : 'KURANG'}
                      </div>
                      <div
                        className={`p-2 rounded-lg text-center font-mono text-[11px] ${
                          exchange.starCompliance.task
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
                        }`}
                      >
                        TASK: {exchange.starCompliance.task ? 'OK' : 'KURANG'}
                      </div>
                      <div
                        className={`p-2 rounded-lg text-center font-mono text-[11px] ${
                          exchange.starCompliance.action
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
                        }`}
                      >
                        ACTION: {exchange.starCompliance.action ? 'OK' : 'KURANG'}
                      </div>
                      <div
                        className={`p-2 rounded-lg text-center font-mono text-[11px] ${
                          exchange.starCompliance.result
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
                        }`}
                      >
                        RESULT: {exchange.starCompliance.result ? 'OK' : 'KURANG'}
                      </div>
                    </div>

                    {/* Feedback dari Evaluator */}
                    {exchange.interviewerFeedback && (
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200">
                        <div className="font-mono uppercase tracking-wider text-[10px] text-slate-400 font-bold mb-1">
                          Ulasan Evaluator:
                        </div>
                        <div className="font-light">{exchange.interviewerFeedback}</div>
                      </div>
                    )}

                    {/* Contoh Jawaban yang Lebih Optimal */}
                    {exchange.optimalAnswerExample && (
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/[0.08] to-transparent border border-emerald-500/30">
                        <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5 mb-1.5 uppercase font-mono tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Rekomendasi Jawaban Optimal:</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-light">
                          {exchange.optimalAnswerExample}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA to History & Testing Documentation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-8 bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl">
        <div>
          <div className="font-bold text-sm uppercase tracking-wide text-white">Lihat Riwayat &amp; Progres Latihan?</div>
          <div className="text-xs text-slate-400 font-light mt-0.5">
            Pantau grafik perkembangan skor dari sesi sebelumnya dan dokumentasi API endpoint.
          </div>
        </div>
        <button
          onClick={onViewHistoryDocs}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 rounded-lg whitespace-nowrap transition-colors shadow-lg"
        >
          Lihat Riwayat &amp; Progres
        </button>
      </div>
    </div>
  );
};
