import { InterviewerPersona } from '../types.ts';

/**
 * Utility to resolve Indonesian voices and speech parameters for personas:
 * - Sarah: Wanita/Cewek (Warm, supportive, empathetic mentor)
 * - Jarvis: Laki-laki muda (Crisp, articulate, fast-paced technical architect)
 * - Ultron: Laki-laki agak tua / senior (Deep baritone, authoritative, heavy, stress interviewer)
 */

export interface ResolvedVoiceConfig {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
  voiceName: string;
  isIndonesian: boolean;
}

/**
 * Fetch voices reliably across different browsers (Chrome, Edge, Firefox, Safari).
 * In Chromium browsers, getVoices() is asynchronous and may return [] until onvoiceschanged fires.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices && currentVoices.length > 0) {
      resolve(currentVoices);
      return;
    }

    let resolved = false;
    const handleVoicesChanged = () => {
      if (resolved) return;
      resolved = true;
      const v = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(v || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Safety timeout in case the event doesn't trigger
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 600);
  });
}

/**
 * Cleans question/probe text before passing to SpeechSynthesisUtterance.
 * Removes brackets like [Sarah], markdown formatting, links, and code backticks
 * so the TTS reads natural spoken Indonesian.
 */
export function cleanSpokenText(text: string): string {
  return text
    .replace(/^\[(Sarah|Jarvis|Ultron)\]\s*/i, '')
    .replace(/\[(Sarah|Jarvis|Ultron)\]/gi, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#]/g, '')
    .replace(/https?:\/\/\S+/g, 'tautan')
    .replace(/\bO\(N\)/gi, 'O N')
    .replace(/\bO\(1\)/gi, 'O 1')
    .replace(/\bSLA\b/g, 'S-L-A')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the most suitable Indonesian voice and fine-tunes pitch/rate
 * to reflect the persona's character and gender:
 * - Sarah: Cewek (Female Indonesian)
 * - Jarvis: Laki agak muda (Young adult male Indonesian)
 * - Ultron: Laki agak tua (Mature/older male Indonesian, deep bass)
 */
export function resolvePersonaVoice(
  persona: InterviewerPersona,
  allVoices: SpeechSynthesisVoice[]
): ResolvedVoiceConfig {
  const isSarah = persona.id === 'friendly';
  const isJarvis = persona.id === 'neutral';
  const isUltron = persona.id === 'stress';

  // 1. Indonesian language voices (id-ID, id, in-ID, in)
  const indonesianVoices = allVoices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = v.name.toLowerCase();
    return lang.startsWith('id') || lang.startsWith('in') || name.includes('indonesia');
  });

  // 2. Malay language voices as phonetic backup (very similar pronunciation)
  const malayVoices = allVoices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = v.name.toLowerCase();
    return lang.startsWith('ms') || name.includes('malay');
  });

  const preferredPool = indonesianVoices.length > 0 ? indonesianVoices : malayVoices;

  let selectedVoice: SpeechSynthesisVoice | null = null;
  let finalPitch = persona.voicePitch;
  let finalRate = persona.voiceRate;

  if (isSarah) {
    // === SARAH: Cewek (Wanita Ramah & Suportif) ===
    // 1. Try finding explicitly female Indonesian voice (e.g. Microsoft Gadis, Siti, Putri)
    const femaleVoice = preferredPool.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('gadis') ||
        name.includes('siti') ||
        name.includes('putri') ||
        name.includes('female') ||
        name.includes('wanita') ||
        name.includes('perempuan')
      );
    });

    if (femaleVoice) {
      selectedVoice = femaleVoice;
      finalPitch = 1.15; // Natural pleasant female pitch
      finalRate = 1.0;
    } else if (preferredPool.length > 0) {
      // General Indonesian voice (e.g., Google Bahasa Indonesia): boost pitch to feminine register
      selectedVoice = preferredPool[0];
      finalPitch = 1.25;
      finalRate = 1.0;
    } else {
      // Fallback: search for any female voice in system
      const fallbackFemale = allVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes('female') ||
          name.includes('zira') ||
          name.includes('samantha') ||
          name.includes('katherine')
        );
      });
      selectedVoice = fallbackFemale || null;
      finalPitch = 1.2;
      finalRate = 1.0;
    }
  } else if (isJarvis) {
    // === JARVIS: Laki-laki agak muda (Pria Muda, Arsitek Presisi) ===
    // 1. Try finding explicitly male Indonesian voice (e.g. Microsoft Ardi, Andika, etc.)
    const maleVoice = preferredPool.find((v) => {
      const name = v.name.toLowerCase();
      return (
        (name.includes('ardi') ||
          name.includes('andika') ||
          name.includes('male') ||
          name.includes('pria') ||
          name.includes('laki')) &&
        !name.includes('gadis') &&
        !name.includes('siti') &&
        !name.includes('female')
      );
    });

    if (maleVoice) {
      selectedVoice = maleVoice;
      finalPitch = 1.0; // Clean, natural young adult male pitch
      finalRate = 1.06; // Crisp, agile tempo
    } else if (preferredPool.length > 1) {
      // If there are multiple ID voices, pick the second one for variety
      selectedVoice = preferredPool[1];
      finalPitch = 0.95;
      finalRate = 1.06;
    } else if (preferredPool.length === 1) {
      selectedVoice = preferredPool[0];
      finalPitch = 0.95; // Slightly lower than default to sound like young male
      finalRate = 1.06;
    } else {
      const fallbackMale = allVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          (name.includes('david') || name.includes('mark') || name.includes('male')) &&
          !name.includes('female')
        );
      });
      selectedVoice = fallbackMale || null;
      finalPitch = 1.0;
      finalRate = 1.06;
    }
  } else if (isUltron) {
    // === ULTRON: Laki-laki agak tua / senior (Berat, Berwibawa, Intimidatif) ===
    // 1. Try finding male Indonesian voice
    const maleVoice = preferredPool.find((v) => {
      const name = v.name.toLowerCase();
      return (
        (name.includes('ardi') ||
          name.includes('andika') ||
          name.includes('male') ||
          name.includes('pria') ||
          name.includes('laki')) &&
        !name.includes('gadis') &&
        !name.includes('siti') &&
        !name.includes('female')
      );
    });

    if (maleVoice) {
      selectedVoice = maleVoice;
    } else if (preferredPool.length > 0) {
      selectedVoice = preferredPool[0];
    } else {
      const fallbackMale = allVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          (name.includes('david') || name.includes('mark') || name.includes('male')) &&
          !name.includes('female')
        );
      });
      selectedVoice = fallbackMale || null;
    }
    // Deep bass pitch for mature/older male tone & steady authoritative tempo
    finalPitch = 0.65;
    finalRate = 0.90;
  }

  const isIndonesian =
    selectedVoice != null &&
    ((selectedVoice.lang || '').toLowerCase().startsWith('id') ||
      (selectedVoice.lang || '').toLowerCase().startsWith('in') ||
      selectedVoice.name.toLowerCase().includes('indonesia'));

  return {
    voice: selectedVoice,
    pitch: finalPitch,
    rate: finalRate,
    voiceName: selectedVoice ? selectedVoice.name : 'Default Browser Voice',
    isIndonesian,
  };
}

/**
 * Play an audio introduction / sample for a persona.
 */
export const PERSONA_SAMPLE_LINES: Record<'friendly' | 'neutral' | 'stress', string> = {
  friendly:
    'Halo! Saya Sarah. Santai saja dan ceritakan pengalaman teknis Anda dengan nyaman.',
  neutral:
    'Sistem aktif. Saya Jarvis. Mari kita analisis arsitektur teknis dan efisiensi solusi Anda secara objektif.',
  stress:
    'Saya Ultron. Jelaskan trade-off kritis sistem Anda, dan buktikan arsitektur Anda tidak akan roboh saat beban ekstrem.',
};

