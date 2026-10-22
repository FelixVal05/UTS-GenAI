import React from 'react';
import { ViewState } from '../types.ts';
import { ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isSessionActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, isSessionActive }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#07090e]/85 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Monogram / Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left text-white group"
          aria-label="Kembali ke Beranda Simulacra"
        >
          <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-white font-mono text-xs font-bold group-hover:bg-white group-hover:text-black transition-all">
            SC
          </div>
          <span className="text-sm font-extrabold tracking-widest text-white uppercase whitespace-nowrap">
            SIMULACRA
          </span>
        </button>

        {/* Zone 2: Clean Uppercase Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-slate-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'landing' ? 'text-white font-bold' : ''
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => onNavigate('setup')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'setup' || currentView === 'analysis' ? 'text-white font-bold' : ''
            }`}
          >
            Analisis Lowongan
          </button>
          <button
            onClick={() => onNavigate('interview')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'interview' ? 'text-white font-bold' : ''
            }`}
          >
            Ruang Wawancara
          </button>
          <button
            onClick={() => onNavigate('report')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'report' ? 'text-white font-bold' : ''
            }`}
          >
            Rapor Evaluasi
          </button>
          <button
            onClick={() => onNavigate('history_docs')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'history_docs' ? 'text-white font-bold' : ''
            }`}
          >
            Dokumentasi & Riset
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (White Pill with dark text & arrow) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('setup')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-white rounded-full hover:bg-slate-200 active:scale-95 transition-all shadow-sm uppercase tracking-wider whitespace-nowrap"
          >
            <span>{isSessionActive ? 'Lanjut Simulasi' : 'Mulai Simulasi'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-900" />
          </button>
        </div>
      </div>
    </header>
  );
};
