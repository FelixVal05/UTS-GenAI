import React from 'react';
import { ViewState } from '../types.ts';

interface FooterProps {
  onNavigate: (view: ViewState) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#06080d] py-12 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-[10px]">
                SC
              </div>
              <span className="text-sm font-bold tracking-widest text-white uppercase">Simulacra</span>
            </div>
            <p className="text-slate-400 text-xs font-light leading-relaxed">
              Platform simulasi wawancara kerja teknis dan seleksi organisasi berbasis suara dua arah Push-to-Talk dengan AI Interviewer Sarah, Jarvis, &amp; Ultron.
            </p>
          </div>

          <div>
            <div className="font-mono text-white mb-3 uppercase tracking-wider text-[11px]">
              Fitur &amp; Modul
            </div>
            <ul className="space-y-2 font-light">
              <li>
                <button
                  onClick={() => onNavigate('setup')}
                  className="hover:text-white transition-colors"
                >
                  CV Gap Analyzer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('setup')}
                  className="hover:text-white transition-colors"
                >
                  Job URL Scraper
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('interview')}
                  className="hover:text-white transition-colors"
                >
                  Ruang Wawancara PTT
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('report')}
                  className="hover:text-white transition-colors"
                >
                  Rapor Evaluasi STAR
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-white mb-3 uppercase tracking-wider text-[11px]">
              Dokumentasi &amp; Riset
            </div>
            <ul className="space-y-2 font-light">
              <li>
                <button
                  onClick={() => onNavigate('history_docs')}
                  className="hover:text-white transition-colors"
                >
                  FastAPI OpenAPI Spec
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('history_docs')}
                  className="hover:text-white transition-colors"
                >
                  Benchmark Latensi Suara
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('history_docs')}
                  className="hover:text-white transition-colors"
                >
                  Repositori GitHub
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-white mb-3 uppercase tracking-wider text-[11px]">
              Portal Lowongan
            </div>
            <div className="space-y-1.5 text-slate-400 font-light">
              <div>LinkedIn Jobs</div>
              <div>Glints Career</div>
              <div>JobStreet Indonesia</div>
              <div>Kalibrr Tech</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SIMULACRA. HAK CIPTA DILINDUNGI UNDANG-UNDANG.
          </div>
          <div className="flex items-center gap-6">
            <span>STANDAR EVALUASI STAR</span>
            <span>FASTAPI V1.4</span>
            <span>PUSH-TO-TALK ENGINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
