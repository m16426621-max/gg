import React, { useState, useRef } from 'react';
import { Subject, ALL_SUBJECTS, Question } from '../types/exam';
import { scanQuestionsFromImage } from '../services/aiService';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Eye,
  FileCheck,
} from 'lucide-react';

interface ScanQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
}

export const ScanQuestionModal: React.FC<ScanQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [selectedSubject, setSelectedSubject] = useState<Subject | ''>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedQuestions, setScannedQuestions] = useState<Question[]>([]);
  const [attachImageToQuestions, setAttachImageToQuestions] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพ เช่น JPG, PNG, WEBP');
      return;
    }

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพใหญ่เกิน 10MB');
      return;
    }

    setImageMimeType(file.type);
    setErrorMsg(null);
    setScannedQuestions([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartScan = async () => {
    if (!imagePreview) {
      setErrorMsg('กรุณาเลือกหรือถ่ายภาพข้อสอบก่อน');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setScannedQuestions([]);

    try {
      const results = await scanQuestionsFromImage({
        imageBase64: imagePreview,
        mimeType: imageMimeType,
        defaultSubject: selectedSubject ? (selectedSubject as Subject) : undefined,
      });

      if (!results || results.length === 0) {
        throw new Error('ไม่พบข้อสอบในรูปภาพ กรุณาตรวจสอบว่ารูปภาพมีความชัดเจนหรือถ่ายใหม่อีกครั้ง');
      }

      // Attach image if enabled
      const formatted = results.map((q) => ({
        ...q,
        imageUrl: attachImageToQuestions ? imagePreview : undefined,
      }));

      setScannedQuestions(formatted);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสแกนข้อสอบ');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToBank = () => {
    if (scannedQuestions.length === 0) return;
    onAddQuestions(scannedQuestions);
    // Reset and close
    setImagePreview(null);
    setScannedQuestions([]);
    onClose();
  };

  const choiceLetters = ['ก', 'ข', 'ค', 'ง'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                สแกนข้อสอบจากไฟล์หรือรูปภาพด้วย AI (OCR & Auto-Solve)
              </h2>
              <p className="text-xs text-slate-500">
                อัปโหลดรูปถ่ายชีทข้อสอบ หรือแคปหน้าจอข้อสอบ AI จะอ่านข้อความ ถอด 4 ช้อยส์ และวิเคราะห์เฉลยพร้อมเหตุผลให้อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Upload Zone */}
        <div className="space-y-4">
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์รูปภาพข้อสอบ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  รองรับไฟล์ภาพ JPG, PNG, WEBP (รูปถ่ายชีทข้อสอบ, ข้อสอบจริง, แคปหน้าจอ) สูงสุด 10MB
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>เลือกรูปจากเครื่อง</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>ถ่ายรูปด้วยกล้อง</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Image Preview Card */}
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 max-h-[260px] flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="ข้อสอบที่อัปโหลด"
                  className="max-h-[260px] w-auto object-contain"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setScannedQuestions([]);
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium text-white bg-black/70 hover:bg-black/90 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูปภาพ</span>
                </button>
              </div>

              {/* Settings strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    กลุ่มวิชา (เลือกเฉพาะเจาะจง หรือให้ AI ตรวจจับอัตโนมัติ)
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">AI วิเคราะห์หมวดวิชาให้อัตโนมัติ</option>
                    {ALL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-5">
                  <input
                    type="checkbox"
                    id="attachImage"
                    checked={attachImageToQuestions}
                    onChange={(e) => setAttachImageToQuestions(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="attachImage" className="text-slate-700 font-medium cursor-pointer">
                    แนบรูปภาพนี้เข้าไปในโจทย์ข้อสอบด้วย (สำหรับโจทย์ที่มีรูปภาพ/ตาราง/แผนภาพ)
                  </label>
                </div>
              </div>

              {/* Scan Trigger Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI กำลังอ่านตัวอักษรและวิเคราะห์เฉลย...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>เริ่มสแกนและถอดข้อสอบด้วย AI (OCR & Auto-Solve)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results List */}
          {scannedQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 max-h-[360px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>ถอดข้อสอบสำเร็จ {scannedQuestions.length} ข้อ (พร้อมเฉลยและเหตุผล)</span>
                </div>

                <button
                  onClick={handleSaveToBank}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกทั้งหมดเข้าสู่คลังข้อสอบ</span>
                </button>
              </div>

              {scannedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900">
                      ข้อที่ {idx + 1}: {q.subject}
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      เฉลย: ข้อ ({choiceLetters[q.correctAnswerIndex]})
                    </span>
                  </div>

                  <p className="font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-slate-700">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border text-xs ${
                          oIdx === q.correctAnswerIndex
                            ? 'bg-emerald-100/70 border-emerald-300 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {choiceLetters[oIdx]}. {opt}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                    <strong>คำอธิบายเฉลย:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
