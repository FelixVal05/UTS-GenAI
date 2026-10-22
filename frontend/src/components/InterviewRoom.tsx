import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  CandidateCV,
  EvaluationReportData,
  GapAnalysisResult,
  InterviewExchange,
  InterviewerPersona,
  JobProfile,
} from '../types.ts';
import { BackendPlan, BackendTurn, submitTurn, finishInterview, BackendReport } from '../services/api.ts';
import {
  cleanSpokenText,
} from '../utils/voice-synthesizer.ts';

interface InterviewRoomProps {
  cv: CandidateCV;
  job: JobProfile;
  persona: InterviewerPersona;
  gapAnalysis: GapAnalysisResult;
  backendPlan: BackendPlan | null;
  sessionId: string | null;
  initialAiGreeting: {
    ai_text: string;
    ai_audio_b64: string | null;
    llm_provider: string;
  } | null;
  onFinishInterview: (report: EvaluationReportData) => void;
  onExit: () => void;
}

type AgentState = 'speaking' | 'listening' | 'analyzing' | 'idle';

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  cv,
  job,
  persona,
  gapAnalysis,
  backendPlan,
  sessionId,
  initialAiGreeting,
  onFinishInterview,
  onExit,
}) => {
  const [agentState, setAgentState] = useState<AgentState>('speaking');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sessionTimer, setSessionTimer] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Percakapan aktif
  const [turns, setTurns] = useState<
    Array<{
      role: 'ai' | 'user';
      text: string;
      latency_ms?: { stt_ms: number; llm_ms: number; tts_ms: number };
      llm_provider?: string;
    }>
  >([]);

  const [currentAiQuestion, setCurrentAiQuestion] = useState<string>(
    initialAiGreeting?.ai_text || 'Halo, selamat datang di sesi wawancara. Silakan perkenalkan diri Anda.'
  );

  // Audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Timer sesi
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimer((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
      stopAudioPlayback();
      cleanupMediaStream();
    };
  }, []);

  // Mainkan salam pembuka AI saat pertama kali masuk
  useEffect(() => {
    if (initialAiGreeting?.ai_text) {
      setCurrentAiQuestion(initialAiGreeting.ai_text);
      setTurns([
        {
          role: 'ai',
          text: initialAiGreeting.ai_text,
          llm_provider: initialAiGreeting.llm_provider,
        },
      ]);
      playAiVoice(initialAiGreeting.ai_text, initialAiGreeting.ai_audio_b64);
    }
  }, [initialAiGreeting]);

  // Audio visualizer setup
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = visualizerCanvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height);
          canvasCtx.fillStyle = persona.id === 'stress' ? '#f43f5e' : '#10b981';
          canvasCtx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
          x += barWidth + 1;
        }
      };
      draw();
    } catch (e) {
      console.warn('Visualizer initialization error:', e);
    }
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    const canvas = visualizerCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playAiVoice = (text: string, b64Audio: string | null) => {
    stopAudioPlayback();
    if (audioMuted) {
      setAgentState('listening');
      return;
    }

    setAgentState('speaking');

    if (b64Audio) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${b64Audio}`);
        audioRef.current = audio;
        audio.onended = () => {
          setAgentState('listening');
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(text);
        };
        audio.play().catch(() => {
          fallbackSpeechSynthesis(text);
        });
        return;
      } catch {
        fallbackSpeechSynthesis(text);
        return;
      }
    }

    fallbackSpeechSynthesis(text);
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const cleaned = cleanSpokenText(text);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'id-ID';
      utterance.pitch = persona.voicePitch;
      utterance.rate = persona.voiceRate;
      utterance.onend = () => setAgentState('listening');
      utterance.onerror = () => setAgentState('listening');
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setAgentState('listening'), 2000);
    }
  };

  const cleanupMediaStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  // Keyboard shortcut: tahan Spasi untuk Push-To-Talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && agentState === 'listening' && !isRecording) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecordingAndSend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [agentState, isRecording]);

  const startRecording = async () => {
    if (agentState !== 'listening') return;
    stopAudioPlayback();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
        (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      startVisualizer(stream);
    } catch (err: any) {
      alert('Gagal mengakses mikrofon: ' + (err.message || err));
    }
  };

  const stopRecordingAndSend = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    setIsRecording(false);
    stopVisualizer();

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      cleanupMediaStream();
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });

      if (audioBlob.size < 1000) {
        // Terlalu pendek
        return;
      }

      await sendTurnToBackend(audioBlob, mime.includes('mp4') ? 'answer.m4a' : 'answer.webm');
    };

    recorder.stop();
  };

  const sendTurnToBackend = async (blob: Blob, filename: string) => {
    if (!sessionId) return;

    setAgentState('analyzing');
    try {
      const resp = await submitTurn(sessionId, blob, true, filename);

      // Tambahkan jawaban user & pertanyaan baru AI ke transkrip
      setTurns((prev) => [
        ...prev,
        {
          role: 'user',
          text: resp.user_text,
          latency_ms: resp.latency_ms,
        },
        {
          role: 'ai',
          text: resp.ai_text,
          llm_provider: resp.llm_provider,
        },
      ]);

      setCurrentAiQuestion(resp.ai_text);
      setLiveTranscript('');

      if (resp.finished) {
        // Sesi telah selesai otomatis dari server (mencapai batas turn)
        await handleFinishSession();
      } else {
        playAiVoice(resp.ai_text, resp.ai_audio_b64);
      }
    } catch (err: any) {
      alert('Gagal mengirim audio ke server: ' + (err.message || err));
      setAgentState('listening');
    }
  };

  const handleFinishSession = async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    stopAudioPlayback();
    cleanupMediaStream();
    stopVisualizer();

    try {
      const backendReport: BackendReport = await finishInterview(sessionId);

      // Map backendReport ke EvaluationReportData
      const mappedReport: EvaluationReportData = {
        id: `rep-${sessionId}`,
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        candidateName: cv.name || 'Kandidat',
        jobRole: job.title || 'Target Role',
        company: job.company || 'Perusahaan',
        persona,
        overallScore: backendReport.overall_score || 0,
        technicalScore: (backendReport.scores?.ketepatan_teknis ?? 8) * 10,
        starStructureScore: (backendReport.scores?.struktur_star ?? 7) * 10,
        huggingFaceRelevanceScore:
          backendReport.semantic_relevance_score != null
            ? Math.round(backendReport.semantic_relevance_score)
            : 75,
        avgWpm: backendReport.delivery?.overall?.wpm || 135,
        avgSilenceRatio:
          backendReport.delivery?.overall?.acoustic_silence_ratio != null
            ? Math.round(backendReport.delivery.overall.acoustic_silence_ratio * 100)
            : backendReport.delivery?.overall?.pause_pct || 15,
        totalFillerCount: backendReport.delivery?.overall?.fillers || 0,
        summaryFeedback:
          (backendReport.recommendations && backendReport.recommendations[0]) ||
          'Sesi wawancara telah selesai dievaluasi secara komprehensif.',
        strengths: backendReport.strengths || [],
        weaknesses: backendReport.weaknesses || [],
        exchanges: (backendReport.per_answer || []).map((ans, idx) => ({
          questionId: idx + 1,
          question: ans.question,
          candidateAnswerTranscript: ans.answer_summary,
          durationSeconds: 30,
          wpm: backendReport.delivery?.overall?.wpm || 135,
          fillerWords: [],
          fillerCount: 0,
          silenceRatio:
            backendReport.delivery?.overall?.acoustic_silence_ratio != null
              ? Math.round(backendReport.delivery.overall.acoustic_silence_ratio * 100)
              : 15,
          technicalAccuracy:
            (backendReport.scores?.ketepatan_teknis ?? 8) * 10,
          starCompliance: {
            situation: ans.star?.situation ?? true,
            task: ans.star?.task ?? true,
            action: ans.star?.action ?? true,
            result: ans.star?.result ?? true,
            score: 85,
          },
          huggingFaceRelevanceScore:
            backendReport.semantic_relevance_score != null
              ? Math.round(backendReport.semantic_relevance_score)
              : 80,
          interviewerFeedback: ans.feedback,
          optimalAnswerExample: ans.better_answer || '',
        })),
      };

      onFinishInterview(mappedReport);
    } catch (err: any) {
      alert('Gagal menghasilkan rapor dari backend: ' + (err.message || err));
      setIsFinishing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-white">
      {/* Top Header Bar inside room */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Keluar Sesi</span>
          </button>
          <span className="text-white/20">|</span>
          <div className="text-xs font-mono text-slate-300">
            {job.title} &middot; <span className="text-white font-bold">{job.company}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-white">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTimer(sessionTimer)}</span>
          </div>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            title={audioMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            aria-label="Toggle suara pewawancara"
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFinishSession}
            disabled={isFinishing || turns.length < 2}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg shadow-xl"
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Menyusun Rapor...</span>
              </>
            ) : (
              <>
                <span>Selesai &amp; Lihat Rapor</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-black" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Persona Terminal Viewport */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl aspect-square flex flex-col justify-between p-5">
            {/* Holographic AI Voice Acoustic Node */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div
                className={`absolute w-72 h-72 rounded-full blur-[90px] transition-all duration-700 pointer-events-none ${
                  persona.id === 'stress'
                    ? agentState === 'speaking'
                      ? 'bg-rose-500/25 scale-110'
                      : 'bg-rose-500/10 scale-90'
                    : persona.id === 'neutral'
                    ? agentState === 'speaking'
                      ? 'bg-indigo-500/25 scale-110'
                      : 'bg-indigo-500/10 scale-90'
                    : agentState === 'speaking'
                    ? 'bg-emerald-500/25 scale-110'
                    : 'bg-emerald-500/10 scale-90'
                }`}
              />

              {/* Orbital rings */}
              <div className="relative w-52 h-52 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow" />
                <div className="absolute inset-3 rounded-full border border-dashed border-white/15 animate-spin-reverse-slow" />
                <div className="absolute inset-8 rounded-full border border-white/10" />

                {/* Center Pulsing Acoustic Core */}
                <div
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border shadow-2xl transition-all duration-500 ${
                    agentState === 'speaking'
                      ? 'scale-105 animate-orb-pulse border-white/40 shadow-white/10'
                      : 'scale-95 border-white/15'
                  } ${
                    persona.id === 'stress'
                      ? 'bg-gradient-to-br from-rose-950/70 via-black to-slate-950'
                      : persona.id === 'neutral'
                      ? 'bg-gradient-to-br from-indigo-950/70 via-black to-slate-950'
                      : 'bg-gradient-to-br from-emerald-950/70 via-black to-slate-950'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1">
                    AI VOICE
                  </span>
                  <div className="flex items-center gap-1 h-5">
                    {[12, 20, 16, 24, 14].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full soundwave-bar ${
                          persona.id === 'stress'
                            ? 'bg-rose-400'
                            : persona.id === 'neutral'
                            ? 'bg-indigo-300'
                            : 'bg-emerald-400'
                        }`}
                        style={{
                          height: agentState === 'speaking' ? `${h}px` : '4px',
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                    {persona.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                AI INTERVIEWER: {persona.name.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded">
                {persona.tone}
              </span>
            </div>

            {/* Bottom Status & Visualizer Canvas */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-white">{persona.name}</span>
                <span className="text-[11px] font-mono text-slate-300">
                  {agentState === 'speaking' && 'SEDANG BERBICARA...'}
                  {agentState === 'listening' && (isRecording ? 'MEREKAM AUDIO...' : 'MENDENGARKAN (PTT)...')}
                  {agentState === 'analyzing' && 'MENGANALISIS & MEMPROSES...'}
                </span>
              </div>

              {/* Web Audio API Real-time Canvas Visualizer */}
              <div className="h-10 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-xl border border-white/10 px-4 overflow-hidden">
                <canvas
                  ref={visualizerCanvasRef}
                  width={240}
                  height={32}
                  className={`w-full h-8 ${isRecording ? 'block' : 'hidden'}`}
                />
                {!isRecording && agentState === 'speaking' && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-white rounded-full soundwave-bar"
                        style={{ height: '14px', animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                )}
                {!isRecording && agentState === 'listening' && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    KLIK TAHAN MIKROFON / SPASI UNTUK BICARA
                  </span>
                )}
                {agentState === 'analyzing' && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>STT &amp; LLM INFERENCE...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Re-listen button */}
          <button
            onClick={() => playAiVoice(currentAiQuestion, null)}
            className="w-full py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>ULANGI SUARA PERTANYAAN</span>
          </button>
        </div>

        {/* Right: Question Text & Conversation Stream */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Question Box */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-7">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                PERTANYAAN TERKINI
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ENGINE: SIMULACRA ADAPTIVE AGENT
              </span>
            </div>

            <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{currentAiQuestion}"
            </div>
          </div>

          {/* Push-to-Talk Terminal */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                KONTROL SUARA PUSH-TO-TALK
              </div>
              <div className="text-xs font-mono text-slate-400">
                {isRecording ? 'STATUS: MEREKAM...' : 'TAHAN UNTUK BICARA'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Push-to-Talk Button */}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecordingAndSend}
                onTouchStart={startRecording}
                onTouchEnd={stopRecordingAndSend}
                disabled={agentState !== 'listening'}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all select-none shrink-0 ${
                  isRecording
                    ? 'bg-emerald-500 text-black scale-105 shadow-2xl shadow-emerald-500/40 ring-4 ring-emerald-300'
                    : agentState === 'listening'
                    ? 'bg-white text-black hover:bg-slate-200 active:scale-95 shadow-xl'
                    : 'bg-white/20 text-slate-400 cursor-not-allowed'
                }`}
                aria-label="Tombol Push to Talk"
              >
                <Mic className="w-8 h-8 mb-1" />
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                  {isRecording ? 'LEPAS' : 'TAHAN'}
                </span>
              </button>

              <div className="space-y-1.5 text-xs text-slate-300 font-light">
                <div className="font-bold text-white text-sm uppercase tracking-wide">
                  Kendali Penuh Atas Jawaban Suara Anda
                </div>
                <p className="leading-relaxed text-slate-400">
                  Tahan tombol atau tombol [Spasi] saat Anda mulai berbicara. Lepas saat selesai menjawab untuk mengirim audio ke Groq Whisper STT &amp; Simulacra AI.
                </p>
                <div className="text-slate-500 font-mono text-[10px]">
                  SHORTCUT: TEKAN &amp; TAHAN [SPASI] PADA KEYBOARD
                </div>
              </div>
            </div>

            {/* Conversation History & Latency Badges */}
            <div className="mt-6 pt-5 border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                <span>RIWAYAT PERCAKAPAN ({turns.length} TURNS):</span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {turns.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs ${
                      t.role === 'ai'
                        ? 'bg-white/[0.03] border border-white/10 text-slate-200'
                        : 'bg-blue-500/10 border border-blue-500/20 text-blue-100 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        {t.role === 'ai' ? `Pewawancara (${persona.name})` : 'Anda'}
                      </span>
                      {t.latency_ms && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>STT {t.latency_ms.stt_ms}ms</span>
                          <span>&middot;</span>
                          <span>LLM {t.latency_ms.llm_ms}ms</span>
                          <span>&middot;</span>
                          <span>TTS {t.latency_ms.tts_ms}ms</span>
                        </div>
                      )}
                    </div>
                    <p className="leading-relaxed font-light">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
