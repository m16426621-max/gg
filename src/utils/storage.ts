import { Question, LeaderboardEntry, ExamResult, ALL_SUBJECTS, Subject } from '../types/exam';
import { INITIAL_QUESTIONS } from '../data/defaultQuestions';
import { INITIAL_LEADERBOARD } from '../data/defaultLeaderboard';

const STORAGE_KEYS = {
  QUESTIONS: 'police_exam_questions_v2',
  LEADERBOARD: 'police_exam_leaderboard_v2',
  EXAM_HISTORY: 'police_exam_history_v2',
  CANDIDATE_NAME: 'police_exam_candidate_name_v2',
};

// Questions Management
export function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored questions:', e);
  }
  return INITIAL_QUESTIONS;
}

export function saveStoredQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed to save questions to localStorage:', e);
  }
}

export function addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Question {
  const current = getStoredQuestions();
  const newQuestion: Question = {
    ...question,
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newQuestion, ...current];
  saveStoredQuestions(updated);
  return newQuestion;
}

export function updateQuestion(question: Question): void {
  const current = getStoredQuestions();
  const updated = current.map((q) => (q.id === question.id ? { ...question, updatedAt: new Date().toISOString() } : q));
  saveStoredQuestions(updated);
}

export function deleteQuestion(questionId: string): void {
  const current = getStoredQuestions();
  const updated = current.filter((q) => q.id !== questionId);
  saveStoredQuestions(updated);
}

export function resetQuestionsToDefault(): Question[] {
  saveStoredQuestions(INITIAL_QUESTIONS);
  return INITIAL_QUESTIONS;
}

// Leaderboard
export function getStoredLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(INITIAL_LEADERBOARD));
      return INITIAL_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse leaderboard:', e);
  }
  return INITIAL_LEADERBOARD;
}

export function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
  const current = getStoredLeaderboard();
  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `lb_${Date.now()}`,
    date: dateFormatted,
    isCurrentUser: true,
  };

  const updated = [newEntry, ...current].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  try {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save leaderboard:', e);
  }

  return newEntry;
}

// Exam History
export function getStoredExamHistory(): ExamResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Failed to parse exam history:', e);
  }
  return [];
}

export function saveExamResult(result: ExamResult): void {
  try {
    const history = getStoredExamHistory();
    const updated = [result, ...history].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save exam history:', e);
  }
}

// Candidate Name
export function getCandidateName(): string {
  return localStorage.getItem(STORAGE_KEYS.CANDIDATE_NAME) || 'ผู้เข้าสอบ สตช.';
}

export function setCandidateName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.CANDIDATE_NAME, name.trim() || 'ผู้เข้าสอบ สตช.');
}

// Export / Import Helpers
export function exportQuestionsToJson(questions: Question[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `thai_police_exam_bank_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseImportedQuestions(jsonText: string): { valid: Question[]; errors: string[] } {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { valid: [], errors: ['รูปแบบไฟล์ต้องเป็น JSON Array ของข้อสอบ'] };
    }

    const valid: Question[] = [];
    parsed.forEach((item, index) => {
      if (!item.question || typeof item.question !== 'string') {
        errors.push(`ข้อที่ ${index + 1}: ขาดคำถาม (question)`);
        return;
      }
      if (!Array.isArray(item.options) || item.options.length < 4) {
        errors.push(`ข้อที่ ${index + 1}: ต้องมีตัวเลือกอย่างน้อย 4 ตัวเลือก`);
        return;
      }
      const subject = ALL_SUBJECTS.includes(item.subject)
        ? (item.subject as Subject)
        : 'ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)';

      const correctAnswerIndex =
        typeof item.correctAnswerIndex === 'number' && item.correctAnswerIndex >= 0 && item.correctAnswerIndex <= 3
          ? item.correctAnswerIndex
          : 0;

      valid.push({
        id: item.id || `imp_${Date.now()}_${index}`,
        subject,
        topic: item.topic || 'ทั่วไป',
        question: item.question.trim(),
        options: [String(item.options[0]), String(item.options[1]), String(item.options[2]), String(item.options[3])],
        correctAnswerIndex,
        explanation: item.explanation || 'ไม่มีคำอธิบาย',
        tips: item.tips || '',
        difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
        source: item.source || 'นำเข้าจากภายนอก',
        createdAt: new Date().toISOString(),
      });
    });

    return { valid, errors };
  } catch (err: any) {
    return { valid: [], errors: ['ไฟล์ JSON ไม่ถูกต้อง: ' + err.message] };
  }
}
