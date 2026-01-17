'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GhostModeProps {
  studentId: string;
  classId: string;
}

export default function GhostMode({ studentId, classId }: GhostModeProps) {
  const [isGhost, setIsGhost] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadGhostStatus = async () => {
      const { data } = await supabase
        .from('student_cores')
        .select('is_ghost, ghost_cooldown_end')
        .eq('student_id', studentId)
        .single();
      
      if (data) {
        setIsGhost(data.is_ghost || false);
        if (data.ghost_cooldown_end) {
          setCooldownEnd(new Date(data.ghost_cooldown_end));
        }
      }
    };
    loadGhostStatus();
  }, [studentId, supabase]);

  const toggleGhost = async () => {
    if (cooldownEnd && new Date() < cooldownEnd) return;

    const newGhostState = !isGhost;
    const newCooldown = newGhostState ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase
      .from('student_cores')
      .update({ 
        is_ghost: newGhostState,
        ghost_cooldown_end: newCooldown?.toISOString()
      })
      .eq('student_id', studentId);

    setIsGhost(newGhostState);
    setCooldownEnd(newCooldown);
  };

  const isOnCooldown = cooldownEnd && new Date() < cooldownEnd;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGhost ? 'bg-purple-500/20' : 'bg-zinc-700'}`}>
            <span className="text-xl">{isGhost ? '👻' : '👤'}</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Ghost Mode</h3>
            <p className="text-zinc-500 text-xs">
              {isGhost ? 'Hidden from Nexus' : isOnCooldown ? 'On cooldown' : 'Visible to class'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleGhost}
          disabled={!!isOnCooldown}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isOnCooldown 
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : isGhost 
                ? 'bg-purple-500 text-white hover:bg-purple-400' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {isGhost ? 'Reveal' : 'Hide'}
        </button>
      </div>
      {isOnCooldown && cooldownEnd && (
        <p className="text-zinc-600 text-xs mt-2">
          Available in {Math.ceil((cooldownEnd.getTime() - Date.now()) / 3600000)}h
        </p>
      )}
    </div>
  );
}
