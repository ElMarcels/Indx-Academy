'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiCheck } from 'react-icons/fi';

interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface UserAchievement {
  id: string;
  achievement: Achievement;
  earnedAt: string;
}

export function AchievementBadge({ achievement, earned }: { achievement: Achievement; earned?: boolean }) {
  return (
    <motion.div
      className={`card p-4 text-center ${earned ? 'border-yellow-500/30 bg-yellow-500/5' : 'opacity-50'}`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <h4 className="text-sm font-semibold text-white">{achievement.title}</h4>
      <p className="text-xs text-dark-400 mt-1">{achievement.description}</p>
      <div className="mt-2">
        <span className="badge-yellow text-[10px]">+{achievement.points} pts</span>
      </div>
      {earned && (
        <div className="mt-2 flex items-center justify-center gap-1 text-emerald-400 text-xs">
          <FiCheck size={12} /> Obtenido
        </div>
      )}
    </motion.div>
  );
}

export function AchievementList({ userId }: { userId?: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/achievements');
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements);
          if (userId) {
            const userRes = await fetch(`/api/users/${userId}/achievements`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setEarnedIds(new Set(userData.achievements.map((a: UserAchievement) => a.achievement.id)));
            }
          }
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {achievements.map((a) => (
        <AchievementBadge key={a.id} achievement={a} earned={earnedIds.has(a.id)} />
      ))}
    </div>
  );
}
