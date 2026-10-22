import React, { useState } from 'react';
import {
  UploadCloud,
  ArrowUpRight,
  Sparkles,
  Mic,
  Activity,
  Terminal,
  Radio,
  Volume2,
  FileText,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { InterviewerPersona } from '../types.ts';
import { INTERVIEWER_PERSONAS } from '../utils/interview-analyzer.ts';

interface LandingHeroProps {
  onStartSetup: () => void;
  onSelectPersona: (persona: InterviewerPersona) => void;
  onNavigateToDocs: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartSetup,
  onSelectPersona,
  onNavigateToDocs,
}) => {
  const [previewPersonaId, setPreviewPersonaId] = useState<'friendly' | 'neutral' | 'stress'>('friendly');
  const [isTestingWaveform, setIsTestingWaveform] = useState(false);

  const activePersona =
    INTERVIEWER_PERSONAS.find((p) => p.id === previewPersonaId) || INTERVIEWER_PERSONAS[0];

  return (
    <div className="w-full bg-[#07090e] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-white/[0.08]">
        {/* Subtle background ambient lights */}
        <div
          className={`absolute top-0 right-1/4 w-[520px] h-[520px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
            previewPersonaId === 'stress'
              ? 'bg-rose-500/10'
              : previewPersonaId === 'neutral'
              ? 'bg-indigo-500/10'
              : 'bg-emerald-500/10'
          }`}
        />
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Huge High-Contrast Editorial Typography matching screenshot */}
            <div className="lg:col-span-7 space-y-7">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono tracking-[0.25em] text-slate-400 uppercase">
                  REAL-TIME VOICE INTERVIEW SIMULATOR
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter text-white leading-[0.92]">
                VOICE
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  INTERVIEW.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed font-light">
                Simulasi wawancara kerja teknis dan seleksi organisasi berbasis suara dua arah presisi. Didukung pewawancara cerdas <strong className="text-white font-medium">Sarah, Jarvis, &amp; Ultron</strong>, integrasi scraper lowongan dari LinkedIn &amp; JobStreet, verifikasi kode GitHub di CV, serta evaluasi struktur STAR komprehensif.
              </p>

              {/* Action Buttons matching reference style */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onStartSetup}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 transition-all duration-300 rounded-lg shadow-xl shadow-white/5 whitespace-nowrap"
                >
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>Unggah CV &amp; Mulai</span>
                  <ArrowUpRight className="w-4 h-4 text-black" />
                </button>

                <button
                  onClick={onNavigateToDocs}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-300 whitespace-nowrap"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dokumentasi API ↗</span>
                </button>
              </div>

              {/* Supported Portals Bar */}
              <div className="pt-6 border-t border-white/[0.08]">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-3">
                  Tautan Lowongan yang Didukung Langsung:
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://www.linkedin.com/jobs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <span>LinkedIn Jobs</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  </a>
                  <a
                    href="https://www.jobstreet.co.id"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <span>JobStreet Indonesia</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  </a>
                  <a
                    href="https://glints.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <span>Glints Career</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  </a>
                  <a
                    href="https://www.kalibrr.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <span>Kalibrr Tech</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Acoustic Voice Architecture Visual Terminal (Zero Face Photo) */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl bg-gradient-to-b from-white/[0.06] via-[#090c12] to-black p-6 sm:p-7 space-y-6 transition-all duration-500">
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 ml-1">
                      ACOUSTIC ENGINE v2.4
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    48 kHz / OPUS
                  </span>
                </div>

                {/* Persona Frequency Channels Selector ("Pindah Persona / Visual") */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between">
                    <span>PILIH KANAL SUARA PEWAWANCARA:</span>
                    <span className="text-white/60 font-mono text-[9px]">INTERAKTIF</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/[0.08]">
                    <button
                      onClick={() => setPreviewPersonaId('friendly')}
                      className={`py-2 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        previewPersonaId === 'friendly'
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      SARAH
                    </button>
                    <button
                      onClick={() => setPreviewPersonaId('neutral')}
                      className={`py-2 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        previewPersonaId === 'neutral'
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      JARVIS
                    </button>
                    <button
                      onClick={() => setPreviewPersonaId('stress')}
                      className={`py-2 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        previewPersonaId === 'stress'
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ULTRON
                    </button>
                  </div>
                </div>

                {/* Selected Persona Info with smooth transition */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between transition-all duration-300">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <span>{activePersona.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        &middot; {activePersona.tone}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-light mt-0.5 line-clamp-1">
                      {activePersona.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      PITCH: {activePersona.voicePitch}x
                    </span>
                  </div>
                </div>

                {/* Acoustic Soundwave Spectrum Visualizer (Morphs smoothly on persona switch) */}
                <div className="p-5 rounded-xl bg-black/80 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-slate-400" />
                      SPEKTRUM GELOMBANG SUARA
                    </span>
                    <span
                      className={`transition-colors duration-300 ${
                        isTestingWaveform ? 'text-emerald-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {isTestingWaveform ? '● MEREKAM AUDIO (PTT AKTIF)' : 'STANDBY (PTT READY)'}
                    </span>
                  </div>

                  {/* 24 Frequency Bars with dynamic heights */}
                  <div className="h-20 flex items-end justify-between gap-1 px-1">
                    {[
                      14, 22, 38, 52, 28, 44, 68, 85, 92, 74, 58, 40,
                      46, 62, 80, 96, 88, 64, 48, 36, 50, 72, 42, 20
                    ].map((h, i) => {
                      const scale =
                        previewPersonaId === 'stress'
                          ? 1.2
                          : previewPersonaId === 'neutral'
                          ? 0.95
                          : 1.05;
                      const barHeight = isTestingWaveform
                        ? Math.min(74, Math.max(8, (h * scale * 0.9)))
                        : Math.min(65, Math.max(6, (h * scale * 0.6)));

                      return (
                        <div
                          key={i}
                          className={`w-full rounded-full transition-all duration-300 ${
                            isTestingWaveform
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 soundwave-dynamic'
                              : previewPersonaId === 'stress'
                              ? 'bg-rose-500/80 soundwave-bar'
                              : previewPersonaId === 'neutral'
                              ? 'bg-indigo-400/80 soundwave-bar'
                              : 'bg-emerald-400/80 soundwave-bar'
                          }`}
                          style={{
                            height: `${barHeight}px`,
                            animationDelay: `${(i * 45) % 800}ms`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Interactive PTT Test Button */}
                  <button
                    onMouseDown={() => setIsTestingWaveform(true)}
                    onMouseUp={() => setIsTestingWaveform(false)}
                    onTouchStart={() => setIsTestingWaveform(true)}
                    onTouchEnd={() => setIsTestingWaveform(false)}
                    className={`w-full py-3 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all duration-200 select-none flex items-center justify-center gap-2 ${
                      isTestingWaveform
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 scale-[0.98]'
                        : 'bg-white/[0.08] hover:bg-white/15 text-white border border-white/20 active:scale-[0.98]'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {isTestingWaveform
                        ? 'LEPAS UNTUK SELESAI BICARA'
                        : 'TAHAN UNTUK UJI PUSH-TO-TALK'}
                    </span>
                  </button>
                </div>

                {/* Telemetry Strip */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[10px] text-slate-400">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div>LATENSI</div>
                    <div className="text-white font-bold">&lt; 340ms</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div>JITTER</div>
                    <div className="text-white font-bold">8ms</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div>BUFFER</div>
                    <div className="text-white font-bold">ADAPTIF</div>
                  </div>
                </div>
              </div>

              {/* Side Kicker matching reference */}
              <div className="w-full max-w-md flex items-center justify-between text-[11px] font-mono text-slate-500 mt-4 px-2">
                <span>PROTOCOL: PUSH-TO-TALK</span>
                <span
                  className="text-white hover:underline cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectPersona(activePersona);
                    onStartSetup();
                  }}
                >
                  MULAI DENGAN {activePersona.name.toUpperCase()} ↗
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Stat Strip matching reference screenshot */}
      <section className="border-b border-white/[0.08] bg-[#090c12]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Stat 1 */}
            <div className="py-4 lg:py-0 px-4 sm:px-8 text-center space-y-2">
              <div className="flex justify-center text-slate-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                98.4%
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Akurasi Ekstraksi Syarat Lowongan
              </div>
            </div>

            {/* Stat 2 */}
            <div className="py-4 lg:py-0 px-4 sm:px-8 text-center space-y-2">
              <div className="flex justify-center text-slate-400">
                <Mic className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                &lt; 380 ms
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Latensi Suara Roundtrip PTT
              </div>
            </div>

            {/* Stat 3 */}
            <div className="py-4 lg:py-0 px-4 sm:px-8 text-center space-y-2">
              <div className="flex justify-center text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                100%
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Validasi Repositori GitHub
              </div>
            </div>

            {/* Stat 4 */}
            <div className="py-4 lg:py-0 px-4 sm:px-8 text-center space-y-2">
              <div className="flex justify-center text-slate-400">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                2.8x
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Peningkatan Kelolosan STAR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Persona Simulator Cards (Matching Reference Screenshot's 3 Cards with ↗ circular button) */}
      <section className="py-20 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 mb-2">
                PILIHAN TINGKAT KETEGASAN PEWAWANCARA
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                SARAH, JARVIS &amp; ULTRON.
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Pilih atmosfer latihan sesuai kesiapan mental Anda
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Sarah */}
            <div
              onClick={() => {
                onSelectPersona(INTERVIEWER_PERSONAS[0]);
                onStartSetup();
              }}
              className="group cursor-pointer rounded-2xl bg-[#0b0e17] border border-white/[0.08] hover:border-emerald-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/5 relative overflow-hidden"
            >
              <div>
                {/* Visual Preview Box (Acoustic Studio Terminal Mockup) */}
                <div className="h-44 w-full rounded-xl bg-gradient-to-br from-emerald-950/40 via-black to-slate-950 border border-white/10 p-4 mb-5 flex flex-col justify-between relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      HARMONIC CALM
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      PITCH 1.1x
                    </span>
                  </div>

                  {/* Waveform graphic */}
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    {[16, 28, 42, 60, 48, 32, 54, 70, 52, 38, 24, 18].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-emerald-400/70 soundwave-bar"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-white/10 pt-2">
                    <span>MODE: FRIENDLY MENTOR</span>
                    <span className="text-white">LATENSI 210ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    RAMAH &amp; MEMBIMBING (CEWEK)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    AKSEN INDONESIA
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Sarah
                </h3>
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Voice AI Mentor &amp; Supportive Lead
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Suara cewek/wanita ramah beraksen Indonesia. Memberikan ruang berpikir, suportif, membantu mengklarifikasi konsep bila Anda ragu, menguji pemahaman fundamental secara hangat.
                </p>
              </div>

              {/* Bottom Card Footer with Circular ↗ Button matching reference */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-300 group-hover:text-white font-medium">
                <span>Pilih Sarah</span>
                <div className="w-8 h-8 rounded-full border border-white/20 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-300 text-white">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Card 2: Jarvis */}
            <div
              onClick={() => {
                onSelectPersona(INTERVIEWER_PERSONAS[1]);
                onStartSetup();
              }}
              className="group cursor-pointer rounded-2xl bg-[#0b0e17] border border-white/[0.08] hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
            >
              <div>
                {/* Visual Preview Box (Acoustic Studio Terminal Mockup - Jarvis) */}
                <div className="h-44 w-full rounded-xl bg-gradient-to-br from-indigo-950/40 via-black to-slate-950 border border-white/10 p-4 mb-5 flex flex-col justify-between relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                      OBJECTIVE PRECISION
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      PITCH 0.98x
                    </span>
                  </div>

                  {/* Waveform graphic matching Sarah & Ultron */}
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    {[20, 34, 52, 68, 56, 38, 62, 74, 58, 42, 28, 20].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-indigo-400/70 soundwave-bar"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-white/10 pt-2">
                    <span>MODE: NEUTRAL ARCHITECT</span>
                    <span className="text-white">LATENSI 190ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    NETRAL &amp; OBJEKTIF (LAKI MUDA)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    AKSEN INDONESIA
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Jarvis
                </h3>
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Precision Technical Architecture Lead
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Suara pria muda artikulatif beraksen Indonesia. Standar industri presisi formal, berorientasi pada ketepatan terminologi teknis, efisiensi algoritma, dan kejelasan struktur STAR.
                </p>
              </div>

              {/* Bottom Card Footer with Circular ↗ Button */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-300 group-hover:text-white font-medium">
                <span>Pilih Jarvis</span>
                <div className="w-8 h-8 rounded-full border border-white/20 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-300 text-white">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Card 3: Ultron */}
            <div
              onClick={() => {
                onSelectPersona(INTERVIEWER_PERSONAS[2]);
                onStartSetup();
              }}
              className="group cursor-pointer rounded-2xl bg-[#0b0e17] border border-white/[0.08] hover:border-rose-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-rose-500/5 relative overflow-hidden"
            >
              <div>
                {/* Visual Preview Box (Stress Radar & Edge-Case Prober Mockup) */}
                <div className="h-44 w-full rounded-xl bg-gradient-to-br from-rose-950/40 via-black to-slate-950 border border-white/10 p-4 mb-5 flex flex-col justify-between relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      EDGE-CASE PROBE
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      PITCH 0.65x
                    </span>
                  </div>

                  {/* Rapid follow-up sweep lines */}
                  <div className="flex items-center justify-center gap-1 py-1">
                    {[30, 65, 45, 80, 50, 75, 90, 60, 40, 70].map((h, i) => (
                      <div
                        key={i}
                        className="w-2 rounded bg-rose-500/80 soundwave-dynamic"
                        style={{
                          height: `${h * 0.7}px`,
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-white/10 pt-2">
                    <span>MODE: STRESS INTERVIEW</span>
                    <span className="text-white">LATENSI 180ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                    STRESS INTERVIEW (LAKI TUA)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    AKSEN INDONESIA
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Ultron
                </h3>
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Executive Stress Interviewer &amp; Edge-Case Prober
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Suara pria berat/baritone beraksen Indonesia yang berwibawa dan menuntut. Melontarkan pertanyaan kejaran (follow-up) tajam tanpa henti, menguji skenario kegagalan sistem paling ekstrem, dan menguji ketahanan mental lisan Anda.
                </p>
              </div>

              {/* Bottom Card Footer with Circular ↗ Button */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-300 group-hover:text-white font-medium">
                <span>Pilih Ultron</span>
                <div className="w-8 h-8 rounded-full border border-white/20 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-300 text-white">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities & Tools & Technologies Split (Inspired by Reference Screenshot) */}
      <section className="py-20 border-b border-white/[0.08] bg-[#080a10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Core Capabilities */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
                FITUR UTAMA PLATFORM
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-6">
                CORE CAPABILITIES.
              </h2>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all duration-300">
                  <div className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                    01. Push-to-Talk Voice Streaming
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Menangkap audio lisan pengguna secara presisi hanya saat tombol atau Spasi ditekan, menghilangkan masalah bot AI yang kerap memotong kalimat saat Anda berpikir.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all duration-300">
                  <div className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                    02. Job Scraper &amp; CV Gap Analyzer
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Mengekstrak syarat dari tautan LinkedIn/JobStreet, memetakan kecocokan keahlian, dan menemukan celah spesifik yang akan diuji oleh pewawancara.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all duration-300">
                  <div className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                    03. GitHub Fact-Checker
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Memverifikasi histori commit, stars, dan file kode di repository GitHub kandidat guna memastikan klaim teknis di CV dapat dipertanggungjawabkan secara lisan.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all duration-300">
                  <div className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                    04. Rapor STAR &amp; WPM Fluency
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Laporan evaluasi komprehensif mengukur kepatuhan STAR (Situation, Task, Action, Result), skor relevansi Hugging Face, kecepatan bicara WPM, dan rasio jeda hening.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Supported Portals & Architecture */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
                PORTAL &amp; TEKNOLOGI PENDUKUNG
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-6">
                TOOLS &amp; ECOSYSTEM.
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">LinkedIn Jobs</div>
                  <div className="text-[11px] text-slate-500 font-mono">Job Scraper v1.4</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">JobStreet ID</div>
                  <div className="text-[11px] text-slate-500 font-mono">HTML5 DOM Parser</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">Glints Career</div>
                  <div className="text-[11px] text-slate-500 font-mono">Requirement NLP</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">Kalibrr Tech</div>
                  <div className="text-[11px] text-slate-500 font-mono">Skill Match Engine</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">FastAPI &amp; Swagger</div>
                  <div className="text-[11px] text-slate-500 font-mono">REST &amp; WebSockets</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-0.5">Hugging Face</div>
                  <div className="text-[11px] text-slate-500 font-mono">Sentence Similarity</div>
                </div>
              </div>

              {/* Certification / Standard Card */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.08]">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Standar Penilaian Industri
                </div>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Semua simulasi mengacu pada standar seleksi tim rekrutmen tech lead global: pemisahan yang jelas antara Situation, Task, Action, dan Result yang terukur dengan angka kuantitatif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bold Callout Banner matching reference's "LET'S CREATE SOMETHING EXTRAORDINARY" */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-2xl p-10 sm:p-14 bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-white/[0.01] border border-white/20 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                SIAPKAN WAWANCARA TERBAIK ANDA.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-light max-w-xl">
                Unggah CV Anda, masukkan tautan lowongan kerja, dan rasakan simulasi suara dua arah dengan Sarah, Jarvis, atau Ultron.
              </p>
            </div>

            <button
              onClick={onStartSetup}
              className="inline-flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 transition-all duration-300 rounded-lg whitespace-nowrap shadow-xl"
            >
              <span>Mulai Simulasi Sekarang</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
