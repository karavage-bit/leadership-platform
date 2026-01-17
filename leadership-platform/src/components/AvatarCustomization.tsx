'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const AVATAR_PARTS = {
  base: ['🌟', '💫', '✨', '🔮', '💎', '🌙'],
  aura: ['none', 'glow-blue', 'glow-purple', 'glow-gold', 'glow-green'],
  trait: ['focused', 'creative', 'resilient', 'curious', 'bold']
};

interface AvatarCustomizationProps {
  studentId: string;
  onSave?: () => void;
}

export default function AvatarCustomization({ studentId, onSave }: AvatarCustomizationProps) {
  const [avatar, setAvatar] = useState({ base: '🌟', aura: 'none', trait: 'focused' });
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('student_cores')
        .select('avatar_config')
        .eq('student_id', studentId)
        .single();
      if (data?.avatar_config) setAvatar(data.avatar_config);
    };
    load();
  }, [studentId, supabase]);

  const save = async () => {
    setSaving(true);
    await supabase
      .from('student_cores')
      .update({ avatar_config: avatar })
      .eq('student_id', studentId);
    setSaving(false);
    onSave?.();
  };

  const auraClass = {
    'glow-blue': 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    'glow-purple': 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    'glow-gold': 'shadow-[0_0_30px_rgba(234,179,8,0.5)]',
    'glow-green': 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
    'none': ''
  }[avatar.aura] || '';

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold text-white mb-6">Customize Your Core</h2>
      
      {/* Preview */}
      <div className="flex justify-center mb-8">
        <div className={`w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center ${auraClass} transition-all`}>
          <span className="text-6xl">{avatar.base}</span>
        </div>
      </div>

      {/* Base Symbol */}
      <div className="mb-6">
        <label className="text-zinc-400 text-sm mb-2 block">Symbol</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_PARTS.base.map(b => (
            <button key={b} onClick={() => setAvatar({...avatar, base: b})}
              className={`w-12 h-12 rounded-xl text-2xl ${avatar.base === b ? 'bg-blue-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Aura */}
      <div className="mb-6">
        <label className="text-zinc-400 text-sm mb-2 block">Aura</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_PARTS.aura.map(a => (
            <button key={a} onClick={() => setAvatar({...avatar, aura: a})}
              className={`px-4 py-2 rounded-xl text-sm capitalize ${avatar.aura === a ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {a === 'none' ? 'None' : a.replace('glow-', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Trait */}
      <div className="mb-6">
        <label className="text-zinc-400 text-sm mb-2 block">Core Trait</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_PARTS.trait.map(t => (
            <button key={t} onClick={() => setAvatar({...avatar, trait: t})}
              className={`px-4 py-2 rounded-xl text-sm capitalize ${avatar.trait === t ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Avatar'}
      </button>
    </div>
  );
}
