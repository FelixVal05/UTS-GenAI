export type InterviewPersonaType = 'friendly' | 'neutral' | 'stress';

export interface InterviewerPersona {
  id: InterviewPersonaType;
  name: string;
  role: string;
  company: string;
  avatar: string;
  tone: string;
  description: string;
  voicePitch: number;
  voiceRate: number;
}

export type ViewState = 'landing' | 'setup' | 'analysis' | 'interview' | 'report' | 'history_docs';

export interface JobProfile {
  id: string;
  title: string;
  company: string;
  platform: 'LinkedIn' | 'JobStreet' | 'Glints' | 'Kalibrr' | 'Perusahaan';
  url: string;
  location: string;
  requirements: string[];
  niceToHave: string[];
  techStack: string[];
}

export interface CandidateCV {
  id: string;
  name: string;
  fileName: string;
  targetRole: string;
  githubUsername: string;
  skills: string[];
  projects: {
    title: string;
    description: string;
    repoName: string;
    repoStatus: 'verified' | 'unverified' | 'partially_verified';
    commitsCount: number;
    stars: number;
    techClaimed: string[];
    techFoundInRepo: string[];
  }[];
}

export interface GapAnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  skillGaps: string[];
  githubFactCheck: {
    totalReposChecked: number;
    verifiedCount: number;
    unverifiedCount: number;
    details: {
      repo: string;
      status: 'verified' | 'unverified' | 'warning';
      note: string;
    }[];
  };
  recommendedQuestions: {
    id: number;
    focus: string;
    questionText: string;
    rationale: string;
  }[];
}

export interface InterviewQuestion {
  id: number;
  topic: string;
  question: string;
  category: 'technical' | 'architecture' | 'star_behavioral' | 'follow_up_probe';
  suggestedSTARAnswer: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface InterviewExchange {
  questionId: number;
  question: string;
  candidateAnswerTranscript: string;
  durationSeconds: number;
  wpm: number;
  fillerWords: string[];
  fillerCount: number;
  silenceRatio: number;
  technicalAccuracy: number;
  starCompliance: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
    score: number;
  };
  huggingFaceRelevanceScore: number;
  interviewerFollowUpProbe?: string;
  interviewerFeedback: string;
  optimalAnswerExample: string;
}

export interface EvaluationReportData {
  id: string;
  date: string;
  candidateName: string;
  jobRole: string;
  company: string;
  persona: InterviewerPersona;
  overallScore: number;
  technicalScore: number;
  starStructureScore: number;
  huggingFaceRelevanceScore: number;
  avgWpm: number;
  avgSilenceRatio: number;
  totalFillerCount: number;
  summaryFeedback: string;
  strengths: string[];
  weaknesses: string[];
  exchanges: InterviewExchange[];
}

export interface LatencyBenchmarkItem {
  platform: string;
  extractionAccuracy: number;
  sampleCount: number;
  avgScrapeTimeMs: number;
  voiceRoundtripMs: number;
}
