export type Subject =
  | 'ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)'
  | 'ภาษาไทย'
  | 'ภาษาอังกฤษ'
  | 'กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.'
  | 'สังคม วัฒนธรรม จริยธรรม และอาเซียน'
  | 'เทคโนโลยีสารสนเทศเพื่อการปฏิบัติงาน';

export const ALL_SUBJECTS: Subject[] = [
  'ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)',
  'ภาษาไทย',
  'ภาษาอังกฤษ',
  'กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.',
  'สังคม วัฒนธรรม จริยธรรม และอาเซียน',
  'เทคโนโลยีสารสนเทศเพื่อการปฏิบัติงาน',
];

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number; // 0, 1, 2, or 3
  explanation: string;
  tips?: string;
  difficulty: Difficulty;
  source?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExamMode = 'full_mock' | 'sprint_15' | 'sprint_30' | 'subject_drill' | 'weakness_retest';

export interface ExamSession {
  id: string;
  mode: ExamMode;
  targetSubject?: Subject;
  title: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, number>; // questionId -> selectedIndex
  flaggedQuestions: Record<string, boolean>; // questionId -> boolean
  durationSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  isSubmitted: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface SubjectScoreDetail {
  subject: Subject;
  total: number;
  correct: number;
  percentage: number;
  passed: boolean; // criteria: >= 60%
}

export interface TopicWeakness {
  topic: string;
  subject: Subject;
  incorrectCount: number;
  totalCount: number;
  accuracyRate: number;
}

export interface TopicStrength {
  topic: string;
  subject: Subject;
  correctCount: number;
  totalCount: number;
  accuracyRate: number;
}

export interface ExamResult {
  id: string;
  sessionId: string;
  candidateName: string;
  mode: ExamMode;
  modeTitle: string;
  totalQuestions: number;
  totalScore: number;
  percentage: number;
  passed: boolean; // 60% overall & passing criteria
  timeSpentSeconds: number;
  durationSeconds: number;
  subjectScores: Record<string, SubjectScoreDetail>;
  weakTopics: TopicWeakness[];
  strongTopics: TopicStrength[];
  completedAt: string;
  aiCoaching?: string;
}

export interface LeaderboardEntry {
  id: string;
  userId?: string;
  candidateName: string;
  badgeNumber?: string;
  examMode: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  passed: boolean;
  date: string;
  completedAt?: string;
  isCurrentUser?: boolean;
}
