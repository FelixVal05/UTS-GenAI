import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Code2,
  Activity,
  History,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { BENCHMARK_DATA } from '../utils/interview-analyzer.ts';
import { listSessions, BackendSession } from '../services/api.ts';

interface HistoryAndDocsProps {
  onStartNewSimulation: () => void;
}

export const HistoryAndDocs: React.FC<HistoryAndDocsProps> = ({
  onStartNewSimulation,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'swagger' | 'benchmark' | 'architecture'>(
    'history'
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/sessions');
  const [backendSessions, setBackendSessions] = useState<BackendSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await listSessions();
      setBackendSessions(data);
    } catch (e) {
      console.error('Failed to load session history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const swaggerEndpoints = [
    {
      method: 'POST',
      path: '/sessions',
      summary: 'Buat sesi wawancara baru & ekstrak lowongan/CV',
      description: 'Menerima multipart/form-data berupa CV (PDF), job_url (LinkedIn, Glints, Kalibrr), job_text manual, github username, persona, dan bahasa.',
      requestBody: {
        scenario: 'Applied AI Engineer - Agents & Automations',
        persona: 'netral',
        language: 'id',
        github: 'allanbendatu',
        job_url: 'https://www.linkedin.com/jobs/view/4478857423/',
        job_text: '',
      },
      responseBody: {
        id: 'da00351c76cc458ab59b7c1afd90814b',
        scenario: 'Applied AI Engineer - Agents & Automations',
        persona: 'netral',
        language: 'id',
        cv_chars: 2450,
        job_chars: 2820,
        status: 'created',
      },
    },
    {
      method: 'POST',
      path: '/sessions/{id}/start?audio=true',
      summary: 'Planner Agent menyusun blueprint & audio kick-off AI',
      description: 'Menjalankan Planner Agent, GitHub fact-checker, FastEmbed semantic match, serta mensintesis salam pembuka suara AI (Edge-TTS).',
      requestBody: {},
      responseBody: {
        ai_text: 'Halo! Selamat datang di sesi wawancara teknis untuk posisi Applied AI Engineer di Novo AI...',
        ai_audio_b64: '<base64_encoded_mp3_audio>',
        llm_provider: 'groq',
        finished: false,
      },
    },
    {
      method: 'POST',
      path: '/sessions/{id}/turn?audio=true',
      summary: 'Kirim rekaman audio jawaban user (PTT / WebM)',
      description: 'Mentranskripsi suara dengan Groq Whisper STT, evaluasi interaksi audio via Librosa & prosodi, menghasilkan respons AI adaptif, serta mengembalikan latency_ms.',
      requestBody: {
        file: '<audio_file.webm>',
      },
      responseBody: {
        user_text: 'Pada proyek saya sebelumnya, saya merancang pipeline IDP dengan n8n dan LLM...',
        ai_text: 'Menarik. Bagaimana Anda memitigasi kegagalan parsing pada dokumen medis yang formatnya tidak beraturan?',
        ai_audio_b64: '<base64_mp3_audio>',
        llm_provider: 'gemini',
        finished: false,
        latency_ms: {
          stt_ms: 1045,
          llm_ms: 2410,
          tts_ms: 1820,
        },
      },
    },
    {
      method: 'POST',
      path: '/sessions/{id}/finish',
      summary: 'Selesaikan sesi & jalankan Evaluator Agent menyeluruh',
      description: 'Menyusun rapor evaluasi STAR, akurasi teknis, relevansi semantik Hugging Face, rasio jeda hening librosa, dan rekomendasi jawaban optimal.',
      requestBody: {},
      responseBody: {
        overall_score: 86,
        scores: {
          relevansi: 9,
          struktur_star: 8,
          kejelasan: 9,
          kedalaman: 8,
          ketepatan_teknis: 9,
        },
        strengths: ['Penguasaan sistem agentic dan error recovery sangat baik'],
        weaknesses: ['Perlu menambahkan metrik kuantitatif di bagian Result'],
        per_answer: [],
        recommendations: ['Latih struktur STAR pada skenario downtime'],
        semantic_relevance_score: 82.5,
      },
    },
    {
      method: 'GET',
      path: '/sessions',
      summary: 'Daftar riwayat sesi wawancara sebelumnya',
      description: 'Mengambil riwayat 50 sesi terakhir beserta overall_score untuk visualisasi progres latihan.',
      requestBody: {},
      responseBody: [
        {
          id: 'da00351c76cc458ab59b7c1afd90814b',
          scenario: 'Applied AI Engineer - Agents & Automations (Novo AI)',
          status: 'finished',
          created_at: '2026-10-22T21:12:00.000000',
          overall_score: 86,
        },
      ],
    },
  ];

  const currentEndpointData =
    swaggerEndpoints.find((e) => e.path === selectedEndpoint) || swaggerEndpoints[0];

  const finishedSessions = backendSessions.filter((s) => s.status === 'finished' && s.overall_score != null);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            DASHBOARD RIWAYAT &amp; DOKUMENTASI PENGUJIAN
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
            RIWAYAT SIMULASI &amp; ARSITEKTUR SISTEM
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
            Pantau perkembangan performa wawancara Anda dari database SQLite nyata, spesifikasi FastAPI, dan laporan benchmark.
          </p>
        </div>

        <button
          onClick={onStartNewSimulation}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-xl"
        >
          <span>Mulai Sesi Baru</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-black" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Progres Sesi Nyata ({backendSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('swagger')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'swagger'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>FastAPI Swagger Spec</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'benchmark'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Pengujian Latensi &amp; Scraper</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Repositori GitHub</span>
        </button>
      </div>

      {/* Tab Content 1: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Sesi di Database</div>
              <div className="text-4xl font-black text-white font-mono mt-1">{backendSessions.length} Sesi</div>
              <div className="text-[11px] text-slate-400 font-light mt-1">Tersimpan di SQLite <code>interviewpro.db</code></div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Sesi Selesai Dievaluasi</div>
              <div className="text-4xl font-black text-emerald-400 font-mono mt-1">{finishedSessions.length} Selesai</div>
              <div className="text-[11px] text-slate-400 font-light mt-1">Dengan penilaian skor keseluruhan (0–100)</div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Skor Rata-Rata Sesi</div>
              <div className="text-4xl font-black text-slate-200 font-mono mt-1">
                {finishedSessions.length > 0
                  ? Math.round(
                      finishedSessions.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) /
                        finishedSessions.length
                    )
                  : '-'}
              </div>
              <div className="text-[11px] text-slate-400 font-light mt-1">Rata-rata performa wawancara Anda</div>
            </div>
          </div>

          {/* Simple Sparkline / Progress Bar of Scores */}
          {finishedSessions.length > 0 && (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">
                Grafik Tren Skor Sesi (Urutan Kronologis)
              </div>
              <div className="flex items-end gap-3 h-28 pt-4">
                {finishedSessions
                  .slice()
                  .reverse()
                  .map((s, idx) => (
                    <div key={s.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{s.overall_score}</span>
                      <div
                        className="w-full bg-white/20 hover:bg-emerald-400 transition-colors rounded-t-md"
                        style={{ height: `${s.overall_score || 10}%` }}
                      />
                      <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
            <div className="p-4 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Log Sesi Wawancara Nyata di Backend FastAPI
              </h3>
              <button
                onClick={fetchHistory}
                className="text-xs font-mono text-slate-400 hover:text-white inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat sesi dari server...</span>
              </div>
            ) : backendSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Belum ada sesi yang tercatat di database backend.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] text-xs">
                {backendSessions.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="font-bold text-white text-base uppercase tracking-tight">{item.scenario}</div>
                      <div className="text-slate-400 mt-0.5 font-light">
                        ID: <code className="text-slate-300 font-mono text-[11px]">{item.id.slice(0, 8)}...</code> &middot;{' '}
                        {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : 'Baru saja'}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-1">
                        Status: <strong className="text-white uppercase">{item.status}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-lg">
                          {item.overall_score != null ? `${item.overall_score} / 100` : 'Dalam Proses'}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-[11px] font-mono uppercase ${
                        item.status === 'finished'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-white/[0.05] border border-white/10 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Swagger FastAPI Docs */}
      {activeTab === 'swagger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              FASTAPI LIVE ENDPOINTS (SIMULACRA API)
            </div>
            {swaggerEndpoints.map((ep) => (
              <button
                key={ep.path}
                onClick={() => setSelectedEndpoint(ep.path)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedEndpoint === ep.path
                    ? 'border-white bg-white text-black font-semibold'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${selectedEndpoint === ep.path ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs truncate">
                    {ep.path}
                  </span>
                </div>
                <div className={`text-[11px] font-light truncate ${selectedEndpoint === ep.path ? 'text-black/80' : 'text-slate-400'}`}>
                  {ep.summary}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-xs">
                {currentEndpointData.method}
              </span>
              <span className="font-mono font-bold text-sm text-white">
                {currentEndpointData.path}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light mb-4">{currentEndpointData.description}</p>

            <div className="mb-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                CONTOH PAYLOAD PERMINTAAN
              </div>
              <pre className="p-4 rounded-xl bg-black border border-white/10 text-slate-300 text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(currentEndpointData.requestBody, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                CONTOH RESPON JSON BACKEND (200 OK)
              </div>
              <pre className="p-4 rounded-xl bg-black border border-white/10 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(currentEndpointData.responseBody, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Benchmark */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8">
            <h3 className="text-base font-bold uppercase tracking-tight text-white mb-2">
              Laporan Pengujian Latensi Suara &amp; Akurasi Ekstraksi URL
            </h3>
            <p className="text-xs text-slate-400 font-light mb-6">
              Diuji pada sampel lowongan kerja LinkedIn Guest API, Glints, Kalibrr, dan FastEmbed lokal untuk memverifikasi keandalan sistem.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="pb-3">Platform Lowongan</th>
                    <th className="pb-3 text-right">Akurasi Ekstraksi</th>
                    <th className="pb-3 text-right">Sampel Teruji</th>
                    <th className="pb-3 text-right">Waktu Scrape (ms)</th>
                    <th className="pb-3 text-right">Latensi Suara PTT (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono">
                  {BENCHMARK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-sans font-medium text-white">{row.platform}</td>
                      <td className="py-3 text-right text-emerald-400">{(row.extractionAccuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 text-right text-slate-400">{row.sampleCount.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">{row.avgScrapeTimeMs} ms</td>
                      <td className="py-3 text-right text-white font-bold">{row.voiceRoundtripMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Architecture */}
      {activeTab === 'architecture' && (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs space-y-4">
          <h3 className="text-base font-bold uppercase text-white tracking-tight">
            Arsitektur Simulacra (Fullstack FastAPI + React)
          </h3>
          <p className="text-slate-300 leading-relaxed font-light">
            Sistem dirancang dengan pemisahan tanggung jawab yang modular:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li><strong>Frontend SPA (React 19, Vite, Tailwind CSS):</strong> Menangani WebRTC/MediaRecorder Push-to-Talk, Web Audio API Real-time visualizer canvas, dan State Transition interaktif.</li>
            <li><strong>Backend Engine (FastAPI, SQLite, SQLAlchemy):</strong> Menangani alur wawancara adaptif multi-turn, state session, dan orkestrasi agent.</li>
            <li><strong>Speech-to-Text:</strong> Groq Whisper Large V3 Turbo dengan latency roundtrip &lt; 1.2 detik.</li>
            <li><strong>Multi-LLM Fallback:</strong> Google Gemini 3 Flash / 3.5 Flash dengan timeout ketat 12 detik dan fallback otomatis ke Groq GPT-OSS 120B.</li>
            <li><strong>Text-to-Speech:</strong> Microsoft Edge-TTS dengan chunking paralel untuk audio suara alami bahasa Indonesia.</li>
            <li><strong>NLP &amp; Akustik:</strong> Hugging Face Multilingual MiniLM via FastEmbed lokal &amp; analisis sinyal fisik audio via Librosa.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
