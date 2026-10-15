import React, { useState, useEffect, useCallback } from 'react';
import { Question, ExamSession } from '../types/exam';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  LayoutGrid,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ExamRoomProps {
  session: ExamSession;
  onUpdateAnswer: (questionId: string, optionIndex: number) => void;
  onToggleFlag: (questionId: string) => void;
  onSubmitExam: () => void;
  onExitExam: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  session,
  onUpdateAnswer,
  onToggleFlag,
  onSubmitExam,
  onExitExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(session.currentQuestionIndex || 0);
  const [remainingTime, setRemainingTime] = useState(session.remainingSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isOmrOpen, setIsOmrOpen] = useState(false);

  const questions = session.questions;
  const currentQuestion = questions[currentIndex];
  const choiceLetters = ['ก', 'ข', 'ค', 'ง'];

  // Timer countdown
  useEffect(() => {
    if (isPaused || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit
          alert('หมดเวลาทำข้อสอบแล้ว! ระบบจะสรุปคะแนนอัตโนมัติ');
          onSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingTime, onSubmitExam]);

  // Format time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || showSubmitConfirm) return;

      // 1, 2, 3, 4 to select answer
      if (['1', '2', '3', '4'].includes(e.key) && currentQuestion) {
        onUpdateAnswer(currentQuestion.id, Number(e.key) - 1);
      }
      // ArrowLeft, ArrowRight
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      // 'f' to toggle flag
      if (e.key.toLowerCase() === 'f' && currentQuestion) {
        onToggleFlag(currentQuestion.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, isPaused, showSubmitConfirm, onUpdateAnswer, onToggleFlag, questions.length]);

  const answeredCount = Object.keys(session.userAnswers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = Object.values(session.flaggedQuestions).filter(Boolean).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const isLowTime = remainingTime < 300; // < 5 mins
  const isCriticalTime = remainingTime < 60; // < 1 min

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col">
      {/* Exam Header Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Exam Title & Subject info */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm hidden sm:inline">
              {session.title}
            </span>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>ข้อที่ {currentIndex + 1} / {questions.length}</span>
              <span>·</span>
              <span className="text-emerald-700 font-medium">ตอบแล้ว {answeredCount}</span>
              {flaggedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-700 font-medium">ปักธง {flaggedCount}</span>
                </>
              )}
            </div>
          </div>

          {/* Center Timer & Pause */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono-numbers font-bold text-sm ${
                isCriticalTime
                  ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                  : isLowTime
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(remainingTime)}</span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'ทำข้อสอบต่อ' : 'พักการสอบชั่วคราว'}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Actions: OMR Drawer & Submit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOmrOpen(!isOmrOpen)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">กระดาษคำตอบ OMR</span>
            </button>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              ส่งข้อสอบ
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-amber-500 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Exam Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center: Question Card (lg:col-span-8 or 9) */}
        <div className={`space-y-4 ${isOmrOpen ? 'lg:col-span-8' : 'lg:col-span-9'}`}>
          {currentQuestion && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    ข้อที่ {currentIndex + 1}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700">{currentQuestion.subject}</span>
                  <span>·</span>
                  <span className="text-slate-600">{currentQuestion.topic}</span>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => onToggleFlag(currentQuestion.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    session.flaggedQuestions[currentQuestion.id]
                      ? 'bg-amber-500/10 border-amber-500 text-amber-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {session.flaggedQuestions[currentQuestion.id] ? 'ปักธงแล้ว (ลังเล)' : 'ปักธงข้อนี้ (กด F)'}
                  </span>
                </button>
              </div>

              {/* Question Body */}
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion.question}
                </p>
                <div className="text-[11px] text-slate-400">
                  เคล็ดลับ: สามารถกดปุ่มตัวเลข 1, 2, 3, 4 บนคีย์บอร์ดเพื่อเลือกคำตอบได้ทันที
                </div>
              </div>

              {/* Question Diagram / Image */}
              {currentQuestion.imageUrl && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-72 flex items-center justify-center p-2">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="รูปภาพประกอบข้อสอบ"
                    className="max-h-68 w-auto object-contain rounded-lg shadow-2xs"
                  />
                </div>
              )}

              {/* 4 Choices */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = session.userAnswers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => onUpdateAnswer(currentQuestion.id, idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {choiceLetters[idx]}
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed flex-1 mt-0.5">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ข้อก่อนหน้า</span>
                </button>

                <div className="text-xs text-slate-500 font-mono-numbers">
                  {currentIndex + 1} / {questions.length}
                </div>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ข้อถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: OMR Answer Grid Panel */}
        <div className={`space-y-4 ${isOmrOpen ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-36">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span>กระดาษคำตอบ OMR</span>
              </span>
              <span className="text-xs text-slate-500 font-mono-numbers">
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 text-center pb-2 border-b border-slate-100">
              <div className="flex items-center justify-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" />
                <span>ตอบแล้ว</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span>ปักธง</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 inline-block" />
                <span>ว่าง</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = session.userAnswers[q.id] !== undefined;
                const isFlagged = session.flaggedQuestions[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold font-mono-numbers transition-all flex items-center justify-center relative cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-amber-500 ring-offset-2'
                        : ''
                    } ${
                      isFlagged
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isAnswered
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ส่งกระดาษคำตอบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Pause className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">พักการทำข้อสอบชั่วคราว</h3>
            <p className="text-xs text-slate-500">
              ตัวจับเวลาถูกหยุดชั่วคราว ข้อสอบและคำตอบที่คุณเลือกจะถูกเก็บไว้ปลอดภัย
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4" />
                <span>ทำข้อสอบต่อทันที</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('คุณแน่ใจว่าต้องการยกเลิกการสอบนี้? คะแนนจะไม่ถูกบันทึก')) {
                    onExitExam();
                  }
                }}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ยกเลิกการสอบและกลับสู่หน้าหลัก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการส่งข้อสอบ?</h3>
                <p className="text-xs text-slate-500">
                  ระบบจะตรวจและประเมินผลคะแนนจุดอ่อนรายบุคคลทันที
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">ข้อสอบทั้งหมด:</span>
                <span className="font-bold text-slate-900">{questions.length} ข้อ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">ตอบเสร็จแล้ว:</span>
                <span className="font-bold text-emerald-700">{answeredCount} ข้อ</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>ยังไม่ได้ตอบ:</span>
                  <span className="font-bold">{unansweredCount} ข้อ</span>
                </div>
              )}
              {flaggedCount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>ข้อที่ปักธงไว้ (ลังเล):</span>
                  <span className="font-bold">{flaggedCount} ข้อ</span>
                </div>
              )}
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-medium">
                * คุณยังมีข้อสอบที่ยังไม่ได้ตอบอีก {unansweredCount} ข้อ ต้องการส่งตรวจเลยหรือไม่?
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                กลับไปทำต่อ
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  onSubmitExam();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                ยืนยันส่งข้อสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
