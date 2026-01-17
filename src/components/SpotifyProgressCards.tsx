'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProgressData {
  totalReflections: number;
  longestStreak: number;
  topInsight: string;
  energyShared: number;
  lessonsCompleted: number;
  favoriteTime: string;
}

export default function SpotifyProgressCards({ studentId }: { studentId: string }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      const { data: lessons } = await supabase
        .from('student_lessons')
        .select('completed_at, score')
        .eq('student_id', studentId);

      const { data: core } = await supabase
        .from('student_cores')
        .select('current_streak, overflow_generated')
        .eq('student_id', studentId)
        .single();

      const completedCount = lessons?.filter(l => l.completed_at).length || 0;
      
      setData({
        totalReflections: completedCount * 3,
        longestStreak: core?.current_streak || 0,
        topInsight: "Your growth mindset shines brightest in challenges",
        energyShared: core?.overflow_generated || 0,
        lessonsCompleted: completedCount,
        favoriteTime: "Evening Explorer 🌙"
      });
    };
    load();
  }, [studentId, supabase]);

  if (!data) return null;

  const cards = [
    { bg: 'from-purple-600 to-pink-500', title: 'Your Year in Growth', stat: `${data.totalReflections}`, label: 'Total Reflections', emoji: '💭' },
    { bg: 'from-orange-500 to-red-500', title: 'Consistency King', stat: `${data.longestStreak}`, label: 'Day Streak Record', emoji: '🔥' },
    { bg: 'from-blue-500 to-cyan-400', title: 'Energy Overflow', stat: `${data.energyShared}%`, label: 'Shared to Nexus', emoji: '⚡' },
    { bg: 'from-green-500 to-emerald-400', title: 'Lessons Mastered', stat: `${data.lessonsCompleted}`, label: 'Completed', emoji: '🎯' },
    { bg: 'from-indigo-600 to-purple-500', title: 'Your Superpower', stat: data.topInsight, label: '', emoji: '✨', isText: true }
  ];

  return (
    <div className="relative">
      <div className={`bg-gradient-to-br ${cards[currentCard].bg} rounded-3xl p-8 min-h-[300px] flex flex-col justify-between transition-all duration-500`}>
        <div>
          <p className="text-white/70 text-sm uppercase tracking-wider">{cards[currentCard].title}</p>
          <div className="mt-4">
            {cards[currentCard].isText ? (
              <p className="text-white text-2xl font-bold leading-tight">{cards[currentCard].stat}</p>
            ) : (
              <>
                <span className="text-7xl font-black text-white">{cards[currentCard].stat}</span>
                <p className="text-white/80 text-lg mt-2">{cards[currentCard].label}</p>
              </>
            )}
          </div>
        </div>
        <div className="text-6xl">{cards[currentCard].emoji}</div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-2 mt-4">
        {cards.map((_, i) => (
          <button key={i} onClick={() => setCurrentCard(i)}
            className={`w-2 h-2 rounded-full transition-all ${currentCard === i ? 'bg-white w-6' : 'bg-zinc-600'}`} />
        ))}
      </div>

      {/* Share button */}
      <button className="w-full mt-4 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 flex items-center justify-center gap-2">
        <span>📤</span> Share My Progress
      </button>
    </div>
  );
}
