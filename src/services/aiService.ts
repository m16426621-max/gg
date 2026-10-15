import { Question, Subject, Difficulty, ExamResult } from '../types/exam';

export interface GenerateAiQuestionsParams {
  subject: Subject;
  topic?: string;
  count: number;
  difficulty: Difficulty;
  imageBase64?: string;
  mimeType?: string;
  attachImageToQuestion?: boolean;
}

export async function generateAiQuestions(params: GenerateAiQuestionsParams): Promise<Question[]> {
  const response = await fetch('/api/ai/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.questions || [];
}

export async function explainQuestionWithAi(
  question: Question,
  selectedOptionIndex?: number
): Promise<string> {
  const response = await fetch('/api/ai/explain-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, selectedOptionIndex }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.analysis || 'ไม่มีคำวิเคราะห์เพิ่มเติมจาก AI';
}

export async function getAiWeaknessCoaching(result: ExamResult): Promise<string> {
  const response = await fetch('/api/ai/weakness-coaching', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      totalScore: result.totalScore,
      maxScore: result.totalQuestions,
      percentage: result.percentage,
      passed: result.passed,
      subjectScores: result.subjectScores,
      weakTopics: result.weakTopics,
      strongTopics: result.strongTopics,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.coaching || '';
}

export async function scanQuestionsFromImage(params: {
  imageBase64: string;
  mimeType: string;
  defaultSubject?: Subject;
}): Promise<Question[]> {
  const response = await fetch('/api/ai/scan-question-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.questions || [];
}

export async function checkAiHealth(): Promise<{ status: string; aiAvailable: boolean }> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (e) {
    return { status: 'offline', aiAvailable: false };
  }
}

