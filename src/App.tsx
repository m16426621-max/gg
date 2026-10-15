/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ExamRoom } from './components/ExamRoom';
import { ExamResultView } from './components/ExamResultView';
import { QuestionManager } from './components/QuestionManager';
import { LeaderboardView } from './components/LeaderboardView';
import { AiQuestionStudioModal } from './components/AiQuestionStudioModal';
import { ScanQuestionModal } from './components/ScanQuestionModal';
import {
  Question,
  ExamSession,
  ExamResult,
  LeaderboardEntry,
  ExamMode,
  Subject,
  ALL_SUBJECTS,
  SubjectScoreDetail,
  TopicWeakness,
  TopicStrength,
} from './types/exam';
import {
  getStoredQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  resetQuestionsToDefault,
  saveStoredQuestions,
  exportQuestionsToJson,
  getStoredLeaderboard,
  addLeaderboardEntry,
  getCandidateName,
  setCandidateName,
  saveExamResult,
} from './utils/storage';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutUser,
  isUserAdmin,
  ADMIN_EMAIL,
  getQuestionsFromCloud,
  saveQuestionToCloud,
  deleteQuestionFromCloud,
  seedQuestionsToCloud,
  getLeaderboardFromCloud,
  saveLeaderboardToCloud,
} from './services/firebase';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'exam' | 'result' | 'manage' | 'leaderboard'>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [candidateName, setCandidateNameState] = useState<string>('ผู้สอบ สตช.');
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [isAiStudioModalOpen, setIsAiStudioModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Authentication & RBAC state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Initialize Auth & Cloud Data on Mount
  useEffect(() => {
    // 1. Initial Local Data load
    const localQ = getStoredQuestions();
    setQuestions(localQ);
    setLeaderboard(getStoredLeaderboard());
    setCandidateNameState(getCandidateName());

    // 2. Fetch remote questions from Cloud Firestore
    (async () => {
      try {
        const cloudQuestions = await getQuestionsFromCloud();
        if (cloudQuestions && cloudQuestions.length > 0) {
          setQuestions(cloudQuestions);
          saveStoredQuestions(cloudQuestions);
        }
      } catch (err) {
        console.warn('Fallback to local questions:', err);
      }

      try {
        const cloudLb = await getLeaderboardFromCloud();
        if (cloudLb && cloudLb.length > 0) {
          setLeaderboard(cloudLb);
        }
      } catch (err) {
        console.warn('Fallback to local leaderboard:', err);
      }
    })();

    // 3. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const adminStatus = isUserAdmin(user);
      setIsAdmin(adminStatus);

      if (user?.displayName) {
        setCandidateNameState(user.displayName);
        setCandidateName(user.displayName);
      }

      // If Owner logs in, ensure default questions are seeded to Cloud Firestore
      if (adminStatus) {
        try {
          const cloudQ = await getQuestionsFromCloud();
          if (cloudQ.length === 0 && localQ.length > 0) {
            await seedQuestionsToCloud(localQ);
          }
        } catch (e) {
          console.warn('Auto-seed questions error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      const admin = isUserAdmin(user);
      if (admin) {
        alert(`เข้าสู่ระบบสำเร็จ!\n\n👑 เจ้าของระบบ: ${ADMIN_EMAIL}\nคุณได้รับสิทธิ์ Admin ในการเพิ่ม แก้ไข ลบข้อสอบ และใช้ AI ครบทุกฟังก์ชัน`);
      } else {
        alert(`เข้าสู่ระบบสำเร็จ!\n\n👤 ผู้เข้าสอบ: ${user.email}\nคุณสามารถเข้าทำข้อสอบ จับเวลา และดูผลวิเคราะห์จุดอ่อนได้ตามปกติ (โหมดอ่านอย่างเดียวสำหรับคลังข้อสอบ)`);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      alert('ออกจากระบบเรียบร้อยแล้ว');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการออกจากระบบ: ' + err.message);
    }
  };

  const handleUpdateCandidateName = (name: string) => {
    setCandidateNameState(name);
    setCandidateName(name);
  };

  // Start Exam Handler
  const handleStartExam = (config: {
    mode: ExamMode;
    targetSubject?: Subject;
    totalQuestions: number;
    durationMinutes: number;
  }) => {
    let selectedQuestions: Question[] = [];

    if (config.mode === 'subject_drill' && config.targetSubject) {
      const subjectPool = questions.filter((q) => q.subject === config.targetSubject);
      selectedQuestions = [...subjectPool].sort(() => 0.5 - Math.random()).slice(0, config.totalQuestions);
    } else {
      selectedQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, config.totalQuestions);
    }

    if (selectedQuestions.length === 0) {
      alert('ไม่มีข้อสอบสำหรับเริ่มการสอบ');
      return;
    }

    const modeTitles: Record<ExamMode, string> = {
      full_mock: 'ชุดจำลองข้อสอบจริง สตช. (Full Mock)',
      sprint_15: 'โหมดซ้อมด่วน 15 ข้อ (Sprint Drill)',
      sprint_30: 'โหมดซ้อมด่วน 30 ข้อ (Sprint Drill)',
      subject_drill: `โหมดเจาะวิชา: ${config.targetSubject || 'ทั่วไป'}`,
      weakness_retest: 'โหมดซ่อมจุดอ่อน (Weakness Retest)',
    };

    const newSession: ExamSession = {
      id: `session_${Date.now()}`,
      mode: config.mode,
      targetSubject: config.targetSubject,
      title: modeTitles[config.mode],
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      userAnswers: {},
      flaggedQuestions: {},
      durationSeconds: config.durationMinutes * 60,
      remainingSeconds: config.durationMinutes * 60,
      isPaused: false,
      isSubmitted: false,
      startedAt: Date.now(),
    };

    setCurrentSession(newSession);
    setCurrentView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Answer selection
  const handleUpdateAnswer = (questionId: string, optionIndex: number) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      userAnswers: {
        ...currentSession.userAnswers,
        [questionId]: optionIndex,
      },
    });
  };

  // Toggle flag
  const handleToggleFlag = (questionId: string) => {
    if (!currentSession) return;
    const isFlagged = !!currentSession.flaggedQuestions[questionId];
    setCurrentSession({
      ...currentSession,
      flaggedQuestions: {
        ...currentSession.flaggedQuestions,
        [questionId]: !isFlagged,
      },
    });
  };

  // Submit Exam & Auto-Scoring with Weakness Diagnostic
  const handleSubmitExam = () => {
    if (!currentSession) return;

    const timeSpentSeconds = Math.max(
      1,
      currentSession.durationSeconds - currentSession.remainingSeconds
    );

    let totalScore = 0;
    const subjectMap: Record<
      string,
      { total: number; correct: number; subject: Subject }
    > = {};

    ALL_SUBJECTS.forEach((s) => {
      subjectMap[s] = { total: 0, correct: 0, subject: s };
    });

    const topicStats: Record<string, { topic: string; subject: Subject; correct: number; total: number }> = {};

    currentSession.questions.forEach((q) => {
      const userAnswer = currentSession.userAnswers[q.id];
      const isCorrect = userAnswer === q.correctAnswerIndex;

      if (isCorrect) {
        totalScore += 1;
      }

      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { total: 0, correct: 0, subject: q.subject };
      }
      subjectMap[q.subject].total += 1;
      if (isCorrect) {
        subjectMap[q.subject].correct += 1;
      }

      const tKey = `${q.subject}___${q.topic}`;
      if (!topicStats[tKey]) {
        topicStats[tKey] = { topic: q.topic, subject: q.subject, correct: 0, total: 0 };
      }
      topicStats[tKey].total += 1;
      if (isCorrect) {
        topicStats[tKey].correct += 1;
      }
    });

    const totalQuestions = currentSession.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 1000) / 10 : 0;

    const subjectScores: Record<string, SubjectScoreDetail> = {};
    Object.keys(subjectMap).forEach((sKey) => {
      const item = subjectMap[sKey];
      if (item.total > 0) {
        const p = Math.round((item.correct / item.total) * 100);
        subjectScores[sKey] = {
          subject: item.subject,
          total: item.total,
          correct: item.correct,
          percentage: p,
          passed: p >= 60,
        };
      }
    });

    const weakTopics: TopicWeakness[] = [];
    const strongTopics: TopicStrength[] = [];

    Object.values(topicStats).forEach((t) => {
      const rate = Math.round((t.correct / t.total) * 100);
      if (t.correct < t.total) {
        weakTopics.push({
          topic: t.topic,
          subject: t.subject,
          incorrectCount: t.total - t.correct,
          totalCount: t.total,
          accuracyRate: rate,
        });
      }
      if (rate >= 80) {
        strongTopics.push({
          topic: t.topic,
          subject: t.subject,
          correctCount: t.correct,
          totalCount: t.total,
          accuracyRate: rate,
        });
      }
    });

    weakTopics.sort((a, b) => b.incorrectCount - a.incorrectCount);
    strongTopics.sort((a, b) => b.correctCount - a.correctCount);

    const passed = percentage >= 60;

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const examResult: ExamResult = {
      id: `result_${Date.now()}`,
      sessionId: currentSession.id,
      candidateName: candidateName || currentUser?.displayName || 'ผู้สอบ สตช.',
      mode: currentSession.mode,
      modeTitle: currentSession.title,
      totalQuestions,
      totalScore,
      percentage,
      passed,
      timeSpentSeconds,
      durationSeconds: currentSession.durationSeconds,
      subjectScores,
      weakTopics,
      strongTopics,
      completedAt: dateFormatted,
    };

    saveExamResult(examResult);
    setLastResult(examResult);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save score to Leaderboard
  const handleSaveToLeaderboard = async (customName?: string) => {
    if (!lastResult) return;
    const nameToUse = customName?.trim() || candidateName || currentUser?.displayName || 'ผู้สอบ สตช.';
    const entry: LeaderboardEntry = {
      id: `lb_${Date.now()}`,
      userId: currentUser?.uid || '',
      candidateName: nameToUse,
      examMode: lastResult.modeTitle,
      score: lastResult.totalScore,
      maxScore: lastResult.totalQuestions,
      percentage: lastResult.percentage,
      timeSpentSeconds: lastResult.timeSpentSeconds,
      passed: lastResult.passed,
      date: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
    };
    addLeaderboardEntry(entry);
    setLeaderboard(getStoredLeaderboard());
    await saveLeaderboardToCloud(entry);
    alert('บันทึกผลสอบลงกระดานผู้นำเรียบร้อยแล้ว');
  };

  // Question CRUD Handlers - Admin Only Guard
  const handleAddQuestion = async (q: Omit<Question, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถเพิ่มข้อสอบได้');
      return;
    }
    const created = addQuestion(q);
    const updated = [created, ...questions];
    setQuestions(updated);
    await saveQuestionToCloud(created);
  };

  const handleUpdateQuestion = async (q: Question) => {
    if (!isAdmin) {
      alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถแก้ไขข้อสอบได้');
      return;
    }
    updateQuestion(q);
    const updated = questions.map((item) => (item.id === q.id ? q : item));
    setQuestions(updated);
    await saveQuestionToCloud(q);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!isAdmin) {
      alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถลบข้อสอบได้');
      return;
    }
    deleteQuestion(id);
    const updated = questions.filter((item) => item.id !== id);
    setQuestions(updated);
    await deleteQuestionFromCloud(id);
  };

  const handleImportQuestions = async (imported: Question[]) => {
    if (!isAdmin) {
      alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถนำเข้าข้อสอบได้');
      return;
    }
    const combined = [...imported, ...questions];
    saveStoredQuestions(combined);
    setQuestions(combined);
    for (const q of imported) {
      await saveQuestionToCloud(q);
    }
  };

  const handleExportQuestions = () => {
    exportQuestionsToJson(questions);
  };

  const handleResetQuestions = async () => {
    if (!isAdmin) {
      alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถรีเซ็ตคลังข้อสอบได้');
      return;
    }
    const reset = resetQuestionsToDefault();
    setQuestions(reset);
    await seedQuestionsToCloud(reset);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAiGenerator={() => {
          if (!isAdmin) {
            alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสร้างข้อสอบเข้าคลังหลักได้');
            return;
          }
          setIsAiStudioModalOpen(true);
        }}
        onOpenScanModal={() => {
          if (!isAdmin) {
            alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสแกนข้อสอบเพิ่มเข้าคลังได้');
            return;
          }
          setIsScanModalOpen(true);
        }}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onLogout={handleLogout}
        examActive={currentView === 'exam'}
      />

      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeView
            questions={questions}
            candidateName={candidateName}
            onUpdateCandidateName={handleUpdateCandidateName}
            onStartExam={handleStartExam}
            onOpenQuestionManager={() => {
              setCurrentView('manage');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAiGenerator={() => {
              if (!isAdmin) {
                alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสร้างข้อสอบเข้าคลังหลักได้');
                return;
              }
              setIsAiStudioModalOpen(true);
            }}
            onOpenScanModal={() => {
              if (!isAdmin) {
                alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสแกนข้อสอบเพิ่มเข้าคลังได้');
                return;
              }
              setIsScanModalOpen(true);
            }}
            onViewLeaderboard={() => {
              setCurrentView('leaderboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isAdmin={isAdmin}
            currentUser={currentUser}
          />
        )}

        {currentView === 'exam' && currentSession && (
          <ExamRoom
            session={currentSession}
            onUpdateAnswer={handleUpdateAnswer}
            onToggleFlag={handleToggleFlag}
            onSubmitExam={handleSubmitExam}
            onExitExam={() => {
              setCurrentSession(null);
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'result' && lastResult && currentSession && (
          <ExamResultView
            result={lastResult}
            questions={currentSession.questions}
            userAnswers={currentSession.userAnswers}
            onRetakeExam={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToLeaderboard={() => {
              setCurrentView('leaderboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveToLeaderboard={handleSaveToLeaderboard}
          />
        )}

        {currentView === 'manage' && (
          <QuestionManager
            questions={questions}
            isAdmin={isAdmin}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onImportQuestions={handleImportQuestions}
            onExportQuestions={handleExportQuestions}
            onResetQuestions={handleResetQuestions}
            isAiModalOpen={isAiStudioModalOpen}
            setIsAiModalOpen={setIsAiStudioModalOpen}
            onOpenScanModal={() => {
              if (!isAdmin) {
                alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสแกนข้อสอบเพิ่มเข้าคลังได้');
                return;
              }
              setIsScanModalOpen(true);
            }}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            currentCandidateName={candidateName}
            onStartExam={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Global AI Question Studio & Deep Answer Analysis Modal (Admin Only) */}
      <AiQuestionStudioModal
        isOpen={isAiStudioModalOpen && isAdmin}
        onClose={() => setIsAiStudioModalOpen(false)}
        existingQuestions={questions}
        onAddGeneratedQuestions={async (generated) => {
          if (!isAdmin) {
            alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถเพิ่มข้อสอบได้');
            return;
          }
          const combined = [...generated, ...questions];
          saveStoredQuestions(combined);
          setQuestions(combined);
          for (const q of generated) {
            await saveQuestionToCloud(q);
          }
          alert(`เพิ่มข้อสอบที่ AI สร้างขึ้นจำนวน ${generated.length} ข้อเข้าสู่คลังเรียบร้อยแล้ว`);
        }}
      />

      {/* AI OCR & Exam Image Scanner Modal (Admin Only) */}
      <ScanQuestionModal
        isOpen={isScanModalOpen && isAdmin}
        onClose={() => setIsScanModalOpen(false)}
        onAddQuestions={async (scanned) => {
          if (!isAdmin) {
            alert('เฉพาะเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถเพิ่มข้อสอบได้');
            return;
          }
          const combined = [...scanned, ...questions];
          saveStoredQuestions(combined);
          setQuestions(combined);
          for (const q of scanned) {
            await saveQuestionToCloud(q);
          }
          alert(`บันทึกข้อสอบที่สแกนจากรูปภาพจำนวน ${scanned.length} ข้อเข้าสู่คลังเรียบร้อยแล้ว`);
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">POLICE EXAM AI</span>
            <span>·</span>
            <span>ระบบจำลองสอบและคลังข้อสอบนายสิบตำรวจออนไลน์ สตช.</span>
          </div>
          <div className="text-slate-500 font-mono-numbers">
            หลักสูตร สตช. ภาค ก / ภาค ข · เกณฑ์ผ่าน 60%
          </div>
        </div>
      </footer>
    </div>
  );
}
