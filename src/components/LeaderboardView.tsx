import React, { useState, useMemo } from 'react';
import { LeaderboardEntry } from '../types/exam';
import { Trophy, Medal, Search, Clock, CheckCircle2, XCircle, Award, User, ArrowUpRight } from 'lucide-react';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentCandidateName: string;
  onStartExam: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  currentCandidateName,
  onStartExam,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Sorted list
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.timeSpentSeconds - b.timeSpentSeconds;
    });
  }, [entries]);

  // Filtered
  const filtered = useMemo(() => {
    return sortedEntries.filter((e) => {
      const matchSearch =
        !search ||
        e.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        (e.badgeNumber && e.badgeNumber.toLowerCase().includes(search.toLowerCase()));

      const matchMode = filterMode === 'all' || e.examMode.includes(filterMode);
      return matchSearch && matchMode;
    });
  }, [sortedEntries, search, filterMode]);

  const top3 = sortedEntries.slice(0, 3);

  // User rank computation
  const userRankIndex = sortedEntries.findIndex(
    (e) => e.candidateName.trim().toLowerCase() === currentCandidateName.trim().toLowerCase() || e.isCurrentUser
  );
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const percentile = userRank ? Math.round(((sortedEntries.length - userRank + 1) / sortedEntries.length) * 100) : null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}น. ${s}วิ.`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <span>REAL-TIME LEADERBOARD</span>
            <span>·</span>
            <span>กระดานจัดอันดับผู้เข้าสอบ สตช.</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            อันดับคะแนนสอบนายสิบตำรวจแบบเรียลไทม์
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เปรียบเทียบผลคะแนนสอบกับผู้เข้าสอบทั่วประเทศแบบทันที คำนวณเปอร์เซ็นไทล์และเกณฑ์ผ่าน 60%
          </p>
        </div>

        <button
          onClick={onStartExam}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          ลงสอบเพื่อจัดอันดับทันที
        </button>
      </div>

      {/* User Rank Card if tested */}
      {userRank && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
              #{userRank}
            </div>
            <div>
              <div className="text-xs text-amber-900 font-semibold">
                สถานะอันดับปัจจุบันของคุณ ({currentCandidateName})
              </div>
              <div className="text-sm font-bold text-slate-900">
                คุณอยู่ในกลุ่ม <span className="text-amber-700">Top {100 - (percentile || 90)}%</span> ของผู้สอบทั้งหมด {sortedEntries.length} คน
              </div>
            </div>
          </div>
          <div className="text-xs text-amber-900 font-mono-numbers">
            คะแนนสูงสุดของคุณ: {sortedEntries[userRankIndex]?.percentage}%
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Silver Rank 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center text-center order-2 md:order-1 relative">
            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center font-extrabold text-lg mb-3">
              🥈
            </div>
            <span className="text-xs font-bold text-slate-400">อันดับที่ 2</span>
            <span className="text-base font-bold text-slate-900 mt-1">{top3[1].candidateName}</span>
            <span className="text-xs text-slate-500 mt-0.5">{top3[1].examMode}</span>
            <div className="text-2xl font-black font-mono-numbers text-slate-800 mt-3">
              {top3[1].score}/{top3[1].maxScore}
            </div>
            <span className="text-xs font-semibold text-emerald-600 font-mono-numbers">
              {top3[1].percentage}% · เวลา {formatSeconds(top3[1].timeSpentSeconds)}
            </span>
          </div>

          {/* Gold Rank 1 (Tall & Highlighted) */}
          <div className="bg-amber-500/10 rounded-2xl border-2 border-amber-400 p-6 shadow-sm flex flex-col items-center text-center order-1 md:order-2 relative -translate-y-1">
            <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-xs">
              👑
            </div>
            <span className="text-xs font-bold text-amber-800 tracking-wider">อันดับที่ 1 (ท็อปคะแนน)</span>
            <span className="text-lg font-bold text-slate-950 mt-1">{top3[0].candidateName}</span>
            <span className="text-xs text-slate-600 mt-0.5">{top3[0].examMode}</span>
            <div className="text-3xl font-black font-mono-numbers text-slate-950 mt-3">
              {top3[0].score}/{top3[0].maxScore}
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono-numbers">
              {top3[0].percentage}% · เวลา {formatSeconds(top3[0].timeSpentSeconds)}
            </span>
          </div>

          {/* Bronze Rank 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center text-center order-3 md:order-3 relative">
            <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-600 text-amber-700 flex items-center justify-center font-extrabold text-lg mb-3">
              🥉
            </div>
            <span className="text-xs font-bold text-slate-400">อันดับที่ 3</span>
            <span className="text-base font-bold text-slate-900 mt-1">{top3[2].candidateName}</span>
            <span className="text-xs text-slate-500 mt-0.5">{top3[2].examMode}</span>
            <div className="text-2xl font-black font-mono-numbers text-slate-800 mt-3">
              {top3[2].score}/{top3[2].maxScore}
            </div>
            <span className="text-xs font-semibold text-emerald-600 font-mono-numbers">
              {top3[2].percentage}% · เวลา {formatSeconds(top3[2].timeSpentSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้เข้าสอบ หรือรหัสประจำตัวสอบ..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">ทุกรูปแบบการสอบ</option>
            <option value="Full Mock">ชุดจำลองเต็ม (Full Mock)</option>
            <option value="Sprint">โหมดซ้อมด่วน (Sprint)</option>
            <option value="กฎหมาย">เฉพาะวิชากฎหมาย</option>
          </select>
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-16">อันดับ</th>
                <th className="py-3 px-4">ผู้เข้าสอบ</th>
                <th className="py-3 px-4">ชุดข้อสอบ</th>
                <th className="py-3 px-4 text-right">คะแนน</th>
                <th className="py-3 px-4 text-right">ร้อยละ (%)</th>
                <th className="py-3 px-4 text-right">เวลาที่ใช้</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-numbers">
              {filtered.map((item, idx) => {
                const rankNumber = idx + 1;
                const isCurrentUser =
                  item.isCurrentUser ||
                  item.candidateName.trim().toLowerCase() === currentCandidateName.trim().toLowerCase();

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isCurrentUser ? 'bg-amber-50/50 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold">
                      {rankNumber === 1 ? (
                        <span className="text-amber-500 text-base">🥇</span>
                      ) : rankNumber === 2 ? (
                        <span className="text-slate-400 text-base">🥈</span>
                      ) : rankNumber === 3 ? (
                        <span className="text-amber-700 text-base">🥉</span>
                      ) : (
                        <span className="text-slate-500">#{rankNumber}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.candidateName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-bold">
                            คุณ
                          </span>
                        )}
                      </div>
                      {item.badgeNumber && (
                        <span className="text-[11px] text-slate-400 font-mono-numbers">
                          {item.badgeNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-600 text-xs">
                      {item.examMode}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {item.score} / {item.maxScore}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold">
                      <span
                        className={item.percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}
                      >
                        {item.percentage}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 text-xs">
                      {formatSeconds(item.timeSpentSeconds)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          item.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 text-xs font-mono-numbers">
                      {item.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
