import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchScore,
  evaluateSpeechMetrics,
  calculateSTARScore,
  extractJobPlatform,
  performGapAnalysis,
  SAMPLE_JOBS,
  SAMPLE_CVS,
} from './interview-analyzer.ts';

test('extractJobPlatform detects platforms correctly from URLs', () => {
  assert.equal(
    extractJobPlatform('https://www.linkedin.com/jobs/view/12345'),
    'LinkedIn'
  );
  assert.equal(
    extractJobPlatform('https://www.jobstreet.co.id/en/job/frontend-engineer-123'),
    'JobStreet'
  );
  assert.equal(
    extractJobPlatform('https://glints.com/id/opportunities/jobs/backend-engineer'),
    'Glints'
  );
  assert.equal(
    extractJobPlatform('https://www.kalibrr.com/c/tech-corp/jobs/3452'),
    'Kalibrr'
  );
  assert.equal(
    extractJobPlatform('https://careers.google.com/jobs/results/999'),
    'Perusahaan'
  );
});

test('calculateMatchScore computes skill match and gaps accurately', () => {
  const cvSkills = ['React & TypeScript', 'Node.js', 'PostgreSQL Query Optimization'];
  const jobRequirements = [
    'React & TypeScript',
    'PostgreSQL Query Optimization',
    'Docker & Kubernetes CI/CD',
    'Redis Caching & PubSub',
  ];

  const result = calculateMatchScore(cvSkills, jobRequirements);
  assert.equal(result.score, 50);
  assert.equal(result.matched.length, 2);
  assert.equal(result.gaps.length, 2);
  assert.ok(result.gaps.includes('Docker & Kubernetes CI/CD'));
});

test('evaluateSpeechMetrics calculates WPM, silence ratio, and filler words', () => {
  const sampleTranscript =
    'Uhm saat itu saya mengerjakan arsitektur payment gateway, like basically kita membagi service ke microservices dan hasilnya latency turun 40%.';
  const durationSeconds = 30;

  const metrics = evaluateSpeechMetrics(sampleTranscript, durationSeconds);
  assert.ok(metrics.wpm > 0, 'WPM should be greater than 0');
  assert.ok(metrics.fillerCount >= 2, 'Should detect at least 2 filler words (uhm, like, basically)');
  assert.ok(metrics.fillerWords.includes('uhm'));
  assert.ok(metrics.silenceRatio >= 5 && metrics.silenceRatio <= 50);
});

test('calculateSTARScore identifies Situation, Task, Action, and Result markers', () => {
  const incompleteAnswer = 'Saya suka React dan TypeScript.';
  const incompleteScore = calculateSTARScore(incompleteAnswer);
  assert.equal(incompleteScore.starScore, 20);
  assert.equal(incompleteScore.breakdown.situation, false);

  const starAnswer =
    'Pada project sebelumnya di fintech, tantangan kami adalah traffic melonjak 10x. Saya mengimplementasikan Redis cluster dan connection pooling. Hasilnya latency turun 60% dan tidak ada downtime.';
  const starResult = calculateSTARScore(starAnswer);
  assert.equal(starResult.starScore, 100);
  assert.equal(starResult.breakdown.situation, true);
  assert.equal(starResult.breakdown.task, true);
  assert.equal(starResult.breakdown.action, true);
  assert.equal(starResult.breakdown.result, true);
});

test('performGapAnalysis produces complete report with GitHub fact-check', () => {
  const cv = SAMPLE_CVS[0];
  const job = SAMPLE_JOBS[0];
  const gapResult = performGapAnalysis(cv, job);

  assert.ok(gapResult.matchScore >= 0 && gapResult.matchScore <= 100);
  assert.ok(gapResult.githubFactCheck.totalReposChecked > 0);
  assert.equal(gapResult.recommendedQuestions.length, 3);
});
