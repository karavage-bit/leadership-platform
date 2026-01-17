'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ClassStats {
  totalStudents: number;
  activeToday: number;
  avgBattery: number;
  nexusIntegrity: number;
  studentsInCrisis: number;
  avgStreak: number;
  topPerformers: { name: string; battery: number }[];
  needsSupport: { name: string; battery: number; lastActive: string }[];
}

export default function TeacherAnalytics({ classId }: { classId: string }) {
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [view, setView] = useState<'overview' | 'students' | 'trends'>('overview');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      const { data: students } = await supabase
        .from('users')
        .select('id, name, student_cores!inner(battery_level, current_streak, updated_at)')
        .eq('class_id', classId)
        .eq('role', 'student');

      const { data: nexus } = await supabase
        .from('class_nexus')
        .select('integrity_score')
        .eq('class_id', classId)
        .single();

      if (students) {
        const batteries = students.map((s: any) => s.student_cores?.battery_level || 0);
        const streaks = students.map((s: any) => s.student_cores?.current_streak || 0);
        const today = new Date().toDateString();
        
        const sorted = [...students].sort((a: any, b: any) => 
          (b.student_cores?.battery_level || 0) - (a.student_cores?.battery_level || 0)
        );

        setStats({
          totalStudents: students.length,
          activeToday: students.filter((s: any) => 
            new Date(s.student_cores?.updated_at).toDateString() === today
          ).length,
          avgBattery: batteries.length ? Math.round(batteries.reduce((a, b) => a + b, 0) / batteries.length) : 0,
          nexusIntegrity: nexus?.integrity_score || 100,
          studentsInCrisis: batteries.filter(b => b < 20).length,
          avgStreak: streaks.length ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0,
          topPerformers: sorted.slice(0, 3).map((s: any) => ({ 
            name: s.name, 
            battery: s.student_cores?.battery_level || 0 
          })),
          needsSupport: sorted.slice(-3).reverse().map((s: any) => ({ 
            name: s.name, 
            battery: s.student_cores?.battery_level || 0,
            lastActive: new Date(s.student_cores?.updated_at).toLocaleDateString()
          }))
        });
      }
    };
    load();
  }, [classId, supabase]);

  if (!stats) return <div className="animate-pulse bg-zinc-800 h-96 rounded-2xl" />;

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Class Analytics</h2>
        <div className="flex gap-2">
          {(['overview', 'students', 'trends'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-sm capitalize ${view === v ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Students" value={stats.totalStudents} icon="👥" />
            <StatCard label="Active Today" value={stats.activeToday} icon="✅" color="green" />
            <StatCard label="Avg Battery" value={`${stats.avgBattery}%`} icon="🔋" color={stats.avgBattery > 50 ? 'green' : 'yellow'} />
            <StatCard label="Nexus Health" value={`${stats.nexusIntegrity}%`} icon="🌐" color={stats.nexusIntegrity > 70 ? 'green' : 'red'} />
          </div>

          {stats.studentsInCrisis > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 font-medium">⚠️ {stats.studentsInCrisis} student(s) below 20% - may need support</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h3 className="text-zinc-400 text-sm mb-3">🌟 Top Performers</h3>
              {stats.topPerformers.map((s, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-700 last:border-0">
                  <span className="text-white">{s.name}</span>
                  <span className="text-green-400">{s.battery}%</span>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h3 className="text-zinc-400 text-sm mb-3">💬 May Need Support</h3>
              {stats.needsSupport.map((s, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-700 last:border-0">
                  <span className="text-white">{s.name}</span>
                  <span className="text-red-400">{s.battery}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'students' && (
        <p className="text-zinc-500 text-center py-8">Detailed student list view coming soon</p>
      )}

      {view === 'trends' && (
        <p className="text-zinc-500 text-center py-8">Weekly trends visualization coming soon</p>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'blue' }: { label: string; value: string | number; icon: string; color?: string }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    red: 'bg-red-500/10 border-red-500/30'
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color as keyof typeof colors]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-zinc-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
