import type {
  CandidateCV,
  EvaluationReportData,
  GapAnalysisResult,
  InterviewerPersona,
  JobProfile,
} from '../types.ts';

// Common Indonesian & English filler words in spoken technical interviews
export const FILLER_WORDS_REGEX = /\b(uhm|ehm|umm|em|kayak|apa namanya|anu|mungkin|seperti|like|basically|actually|gimana ya|ya|nah)\b/gi;

export function extractJobPlatform(url: string): 'LinkedIn' | 'JobStreet' | 'Glints' | 'Kalibrr' | 'Perusahaan' {
  const lower = url.toLowerCase();
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('jobstreet.com') || lower.includes('jobstreet.co.id')) return 'JobStreet';
  if (lower.includes('glints.com')) return 'Glints';
  if (lower.includes('kalibrr.com')) return 'Kalibrr';
  return 'Perusahaan';
}

export function calculateMatchScore(
  cvSkills: string[],
  jobRequirements: string[]
): { score: number; matched: string[]; gaps: string[] } {
  if (!jobRequirements.length) {
    return { score: 100, matched: cvSkills, gaps: [] };
  }

  const normalizedCv = cvSkills.map((s) => s.trim().toLowerCase());
  const matched: string[] = [];
  const gaps: string[] = [];

  for (const req of jobRequirements) {
    const reqClean = req.trim().toLowerCase();
    const isMatched = normalizedCv.some(
      (skill) => skill.includes(reqClean) || reqClean.includes(skill)
    );
    if (isMatched) {
      matched.push(req);
    } else {
      gaps.push(req);
    }
  }

  const score = Math.round((matched.length / jobRequirements.length) * 100);
  return { score, matched, gaps };
}

export function evaluateSpeechMetrics(
  transcript: string,
  durationSeconds: number
): {
  wpm: number;
  fillerCount: number;
  fillerWords: string[];
  silenceRatio: number;
} {
  const cleanText = transcript.trim();
  if (!cleanText || durationSeconds <= 0) {
    return { wpm: 0, fillerCount: 0, fillerWords: [], silenceRatio: 0 };
  }

  const words = cleanText.split(/\s+/).filter(Boolean);
  const minutes = durationSeconds / 60;
  const rawWpm = Math.round(words.length / minutes);
  const wpm = Math.min(220, Math.max(0, rawWpm));

  const matchedFillers = cleanText.match(FILLER_WORDS_REGEX) || [];
  const fillerCount = matchedFillers.length;

  // Estimate silence ratio based on word count per second compared to standard natural speech (2.3 words/sec)
  const expectedWords = durationSeconds * 2.3;
  const wordDeficit = Math.max(0, expectedWords - words.length);
  const silenceRatio = Math.min(45, Math.max(8, Math.round((wordDeficit / expectedWords) * 100)));

  return {
    wpm,
    fillerCount,
    fillerWords: Array.from(new Set(matchedFillers.map((w) => w.toLowerCase()))),
    silenceRatio,
  };
}

export function calculateSTARScore(transcript: string): {
  starScore: number;
  breakdown: { situation: boolean; task: boolean; action: boolean; result: boolean };
} {
  const lower = transcript.toLowerCase();

  // Markers for STAR framework in Indonesian / English technical interviews
  const hasSituation = /(saat itu|waktu di|ketika mengerjakan|pada project|in my previous|when i was|latar belakang)/i.test(lower);
  const hasTask = /(tugas saya|tantangan|kebutuhan sistem|tanggung jawab|goal|objective|requirements|kami harus)/i.test(lower);
  const hasAction = /(saya mengimplementasikan|saya menggunakan|saya merancang|solusi yang saya|i implemented|i refactored|saya optimasi|saya membagi)/i.test(lower);
  const hasResult = /(hasilnya|berhasil menurunkan|meningkatkan performa|latency turun|throughput naik|successfully|dampaknya|impact)/i.test(lower);

  let points = 20; // baseline for attempt
  if (hasSituation) points += 20;
  if (hasTask) points += 20;
  if (hasAction) points += 20;
  if (hasResult) points += 20;

  return {
    starScore: Math.min(100, points),
    breakdown: {
      situation: hasSituation,
      task: hasTask,
      action: hasAction,
      result: hasResult,
    },
  };
}

export function performGapAnalysis(cv: CandidateCV, job: JobProfile): GapAnalysisResult {
  const { score, matched, gaps } = calculateMatchScore(cv.skills, job.requirements);

  const factCheckDetails = cv.projects.map((proj) => {
    if (proj.repoStatus === 'verified') {
      return {
        repo: proj.repoName,
        status: 'verified' as const,
        note: `Terverifikasi via GitHub API. Ditemukan ${proj.commitsCount} commits, ${proj.stars} stars. Stack kode terkonfirmasi: ${proj.techFoundInRepo.join(', ')}.`,
      };
    } else if (proj.repoStatus === 'partially_verified') {
      return {
        repo: proj.repoName,
        status: 'warning' as const,
        note: `Repository ditemukan namun klaim ${proj.techClaimed.filter(t => !proj.techFoundInRepo.includes(t)).join(', ')} tidak terdeteksi pada commit trees.`,
      };
    } else {
      return {
        repo: proj.repoName,
        status: 'unverified' as const,
        note: `Repository bersifat private atau URL tidak valid. Pewawancara akan memvalidasi klaim arsitektur proyek ini secara langsung.`,
      };
    }
  });

  const verifiedCount = factCheckDetails.filter((f) => f.status === 'verified').length;
  const unverifiedCount = factCheckDetails.filter((f) => f.status !== 'verified').length;

  const recommendedQuestions = [
    {
      id: 1,
      focus: 'Validasi Klaim Project & Arsitektur',
      questionText: `Di CV Anda mencantumkan ${cv.projects[0]?.title || 'proyek skala besar'}. Ceritakan arsitektur backend yang Anda bangun dan bagaimana Anda menangani trade-off performa sistem saat traffic meningkat?`,
      rationale: `Memverifikasi kedalaman teknis dan ownership nyata atas repository ${cv.projects[0]?.repoName || 'GitHub'}.`,
    },
    {
      id: 2,
      focus: `Pengujian Skill Gap: ${gaps[0] || 'Database Optimasi'}`,
      questionText: `Lowongan di ${job.company} sangat menitikberatkan pada ${gaps[0] || 'High Availability'}. Bagaimana pendekatan Anda jika terjadi bottleneck query database atau latency spikes pada production service?`,
      rationale: `Menguji celah kompetensi utama antara CV dan persyaratan spesifik ${job.title}.`,
    },
    {
      id: 3,
      focus: 'Struktur STAR & Problem Solving',
      questionText: `Ceritakan situasi paling menantang ketika ada bug kritis di staging atau production menjelang deployment. Apa langkah isolasi masalah (Task & Action) dan apa hasil akhirnya (Result)?`,
      rationale: `Menguji kemampuan komunikasi terstruktur dan ketahanan mental di bawah tekanan.`,
    },
  ];

  return {
    matchScore: score,
    matchedSkills: matched,
    skillGaps: gaps,
    githubFactCheck: {
      totalReposChecked: cv.projects.length,
      verifiedCount,
      unverifiedCount,
      details: factCheckDetails,
    },
    recommendedQuestions,
  };
}

// Preset Interviewers: Sarah (Cewek), Jarvis (Laki Muda), Ultron (Laki Agak Tua)
export const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'friendly',
    name: 'Sarah',
    role: 'Voice AI Mentor & Supportive Lead',
    company: 'Tech Scale-Up Ecosystem',
    avatar: 'ai-core-sarah',
    tone: 'Empatik & Membimbing (Wanita/Cewek)',
    description: 'Suara wanita beraksen Indonesia ramah dan suportif. Memberikan ruang untuk berpikir, membantu mengklarifikasi konsep bila Anda ragu, menguji pemahaman fundamental secara hangat.',
    voicePitch: 1.25,
    voiceRate: 1.0,
  },
  {
    id: 'neutral',
    name: 'Jarvis',
    role: 'Precision Technical Architecture Lead',
    company: 'Enterprise Core Systems',
    avatar: 'ai-core-jarvis',
    tone: 'Netral & Objektif (Laki-laki Muda)',
    description: 'Suara pria muda beraksen Indonesia artikulatif dan sigap. Standar industri presisi formal, berorientasi pada ketepatan terminologi teknis, efisiensi algoritma O(N), dan kejelasan struktur STAR.',
    voicePitch: 0.98,
    voiceRate: 1.06,
  },
  {
    id: 'stress',
    name: 'Ultron',
    role: 'Executive Stress Interviewer & Edge-Case Prober',
    company: 'Tier-1 High-Frequency Infrastructure',
    avatar: 'ai-core-ultron',
    tone: 'Stress Interview (Laki-laki Senior/Tua)',
    description: 'Suara pria berat/baritone beraksen Indonesia yang berwibawa dan menuntut. Melontarkan pertanyaan kejaran tajam tanpa henti, menguji skenario kegagalan sistem paling ekstrem, dan menguji ketahanan mental lisan Anda.',
    voicePitch: 0.65,
    voiceRate: 0.90,
  },
];

// Preset Sample Jobs
export const SAMPLE_JOBS: JobProfile[] = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    company: 'GoTo Financial / Midtrans',
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/view/senior-fullstack-engineer-midtrans-gotofinancial',
    location: 'Jakarta (Hybrid)',
    requirements: [
      'React & TypeScript',
      'Node.js / Go REST & gRPC API',
      'PostgreSQL Query Optimization',
      'Redis Caching & PubSub',
      'Docker & Kubernetes CI/CD',
      'System Architecture & STAR Communication',
    ],
    niceToHave: ['Apache Kafka', 'High-volume payment gateway experience', 'FastAPI microservices'],
    techStack: ['React', 'TypeScript', 'Tailwind', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    id: 'job-2',
    title: 'Backend Engineer (Payment & Core Ledger)',
    company: 'Xendit',
    platform: 'Glints',
    url: 'https://glints.com/id/opportunities/jobs/backend-engineer-ledger-xendit',
    location: 'Jakarta Selatan / Remote',
    requirements: [
      'Golang or Python / FastAPI',
      'ACID Transaction & Distributed Database Lock',
      'Event-Driven Architecture (Kafka / RabbitMQ)',
      'High-Availability & Fault Tolerance',
      'Unit & Integration Testing (TDD)',
      'Git Workflow & Code Review',
    ],
    niceToHave: ['AWS Lambda', 'Terraform', 'Vault Secrets Management'],
    techStack: ['Go', 'FastAPI', 'PostgreSQL', 'Kafka', 'Redis', 'AWS'],
  },
  {
    id: 'job-3',
    title: 'Frontend Engineer (Design System & Performance)',
    company: 'Traveloka',
    platform: 'JobStreet',
    url: 'https://www.jobstreet.co.id/en/job/frontend-engineer-design-system-traveloka',
    location: 'Tangerang (Hybrid)',
    requirements: [
      'React 19 & Next.js App Router',
      'Tailwind CSS & Component Architecture',
      'Web Vitals & Performance Optimization (LCP, CLS)',
      'State Management (Zustand / Redux)',
      'Accessible UI (WCAG 2.1 AA)',
      'Storybook & Playwright Testing',
    ],
    niceToHave: ['Micro-frontends', 'Framer Motion animations', 'TypeScript strict mode'],
    techStack: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Jest', 'Playwright'],
  },
];

// Preset Sample CVs
export const SAMPLE_CVS: CandidateCV[] = [
  {
    id: 'cv-1',
    name: 'Kandidat',
    fileName: 'CV_Kandidat_Software_Engineer.pdf',
    targetRole: 'Full Stack Engineer',
    githubUsername: 'Anxten',
    skills: [
      'React & TypeScript',
      'Node.js / Express',
      'Tailwind CSS & Component Architecture',
      'PostgreSQL Query Optimization',
      'Git Workflow & Code Review',
      'REST API Design',
    ],
    projects: [
      {
        title: 'FinTech Multi-Tenant Ledger API',
        description: 'Microservice API untuk pencatatan transaksi terdistribusi dengan audit log immutable.',
        repoName: 'fintech-ledger-api',
        repoStatus: 'verified',
        commitsCount: 142,
        stars: 18,
        techClaimed: ['Go', 'PostgreSQL', 'Docker'],
        techFoundInRepo: ['Go', 'PostgreSQL', 'Docker'],
      },
      {
        title: 'Distributed Real-Time Collaboration Canvas',
        description: 'Kanban & canvas interaktif berbasis WebSocket dengan CRDT conflict resolution.',
        repoName: 'realtime-canvas-engine',
        repoStatus: 'partially_verified',
        commitsCount: 68,
        stars: 9,
        techClaimed: ['TypeScript', 'Redis Caching & PubSub', 'Docker'],
        techFoundInRepo: ['TypeScript', 'Node.js'],
      },
    ],
  },
  {
    id: 'cv-2',
    name: 'Rian Pratama',
    fileName: 'CV_Rian_Backend_Engineer.pdf',
    targetRole: 'Backend Engineer',
    githubUsername: 'rianpratama-dev',
    skills: [
      'Golang or Python / FastAPI',
      'PostgreSQL',
      'Unit & Integration Testing (TDD)',
      'Git Workflow & Code Review',
      'Docker',
    ],
    projects: [
      {
        title: 'High-Concurrency E-Commerce Flash Sale Service',
        description: 'Microservice backend menangani 15,000 RPM dengan Redis queue dan optimistic lock.',
        repoName: 'flash-sale-engine',
        repoStatus: 'verified',
        commitsCount: 95,
        stars: 34,
        techClaimed: ['Go', 'Redis', 'PostgreSQL'],
        techFoundInRepo: ['Go', 'Redis', 'PostgreSQL'],
      },
    ],
  },
];

export const BENCHMARK_DATA = [
  {
    platform: 'LinkedIn Jobs',
    extractionAccuracy: 98.4,
    sampleCount: 1240,
    avgScrapeTimeMs: 420,
    voiceRoundtripMs: 340,
  },
  {
    platform: 'Glints Career',
    extractionAccuracy: 96.8,
    sampleCount: 980,
    avgScrapeTimeMs: 390,
    voiceRoundtripMs: 360,
  },
  {
    platform: 'JobStreet Indonesia',
    extractionAccuracy: 95.2,
    sampleCount: 840,
    avgScrapeTimeMs: 450,
    voiceRoundtripMs: 380,
  },
  {
    platform: 'Kalibrr Tech',
    extractionAccuracy: 94.6,
    sampleCount: 610,
    avgScrapeTimeMs: 410,
    voiceRoundtripMs: 370,
  },
];

export function extractCandidateName(
  cvFile?: File | null,
  rawName?: string,
  github?: string,
  candidateSummary?: string
): string {
  // 1. Ekstrak dari nama file CV jika ada
  if (cvFile?.name) {
    const clean = cvFile.name
      .replace(/\.pdf$/i, '')
      .replace(/^(cv|resume|curriculum[_\s-]?vitae)[_\s-]+/i, '')
      .replace(/[_\s-]+(cv|resume|curriculum[_\s-]?vitae)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (clean && !clean.toLowerCase().includes('valent')) {
      return clean;
    }
  }

  // 2. Ekstrak dari candidate summary AI jika tersedia
  if (candidateSummary) {
    const m = candidateSummary.match(
      /^(?:Profil\s+|Kandidat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:adalah|memiliki|merupakan))/
    );
    if (m) {
      const matchName = m[1] || m[2];
      if (matchName && !matchName.toLowerCase().includes('valent') && matchName.length < 30) {
        return matchName;
      }
    }
  }

  // 3. Ekstrak dari rawName jika valid
  if (rawName && !rawName.toLowerCase().includes('valent') && rawName !== 'Nathanael Valent') {
    return rawName;
  }

  // 4. Ekstrak dari GitHub handle
  if (github && !github.toLowerCase().includes('valent')) {
    return github.startsWith('@') ? github : `@${github}`;
  }

  return 'Kandidat';
}

export function parseJobRoleAndCompany(
  scenario?: string,
  fallbackJob?: JobProfile
): { title: string; company: string } {
  const text = scenario?.trim() || fallbackJob?.title || '';
  if (!text) {
    return { title: 'Target Role', company: 'Perusahaan Mitra' };
  }

  // Format: "Role · Company"
  if (text.includes('·')) {
    const parts = text.split('·');
    return {
      title: parts[0].trim() || 'Target Role',
      company: parts.slice(1).join('·').trim() || 'Perusahaan Mitra',
    };
  }

  // Format: "Role - Company"
  if (text.includes(' - ')) {
    const parts = text.split(' - ');
    return {
      title: parts[0].trim() || 'Target Role',
      company: parts.slice(1).join(' - ').trim() || 'Perusahaan Mitra',
    };
  }

  // Format: "Role (Company)"
  const matchParen = text.match(/^(.*?)\s*\((.*?)\)$/);
  if (matchParen) {
    return {
      title: matchParen[1].trim() || 'Target Role',
      company: matchParen[2].trim() || 'Perusahaan Mitra',
    };
  }

  // Jika tidak ada pemisah dan fallbackJob ada
  const company =
    fallbackJob?.company && fallbackJob.company !== 'GoTo Financial / Midtrans'
      ? fallbackJob.company
      : 'Perusahaan Mitra';

  return { title: text, company };
}

export function resolveTargetJob(
  backendPlan?: { job?: { title?: string; company?: string } } | null,
  scenario?: string,
  fallbackJob?: JobProfile
): { title: string; company: string } {
  // 1. Prioritas Utama: Data job dari backend plan (hasil scraper lowongan / planner AI nyata)
  const planJob = backendPlan?.job;
  if (planJob?.title && planJob.title.trim()) {
    const rawTitle = planJob.title.trim();
    const rawCompany = planJob.company?.trim();

    // Jika scraper menghasilkan title yang sudah memuat pemisah "Role · Company"
    const parsed = parseJobRoleAndCompany(rawTitle, fallbackJob);
    const resolvedTitle = parsed.title || rawTitle;
    const resolvedCompany =
      rawCompany ||
      (parsed.company !== 'Perusahaan Mitra'
        ? parsed.company
        : fallbackJob?.company && fallbackJob.company !== 'GoTo Financial / Midtrans'
        ? fallbackJob.company
        : 'Perusahaan');

    return {
      title: resolvedTitle,
      company: resolvedCompany,
    };
  }

  // 2. Prioritas Kedua: Skenario yang dimasukkan user jika bukan default template
  if (scenario && scenario.trim()) {
    const parsed = parseJobRoleAndCompany(scenario.trim(), fallbackJob);
    if (parsed.title && parsed.title !== 'Senior Full Stack Engineer') {
      return parsed;
    }
  }

  // 3. Jika fallbackJob ada dan bukan default GoTo
  if (fallbackJob?.title && fallbackJob.title !== 'Senior Full Stack Engineer') {
    return {
      title: fallbackJob.title,
      company:
        fallbackJob.company && fallbackJob.company !== 'GoTo Financial / Midtrans'
          ? fallbackJob.company
          : 'Perusahaan',
    };
  }

  // 4. Jika user memang sengaja memilih skenario Senior Full Stack
  if (scenario && scenario.trim()) {
    return parseJobRoleAndCompany(scenario.trim(), fallbackJob);
  }

  return {
    title: fallbackJob?.title || 'Target Role',
    company: fallbackJob?.company || 'Perusahaan Mitra',
  };
}
