'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiThumbsUp, FiHeart } from 'react-icons/fi';
import { FaThumbsUp, FaHeart } from 'react-icons/fa';

interface ReactionsProps {
  targetType: string;
  targetId: string;
  compact?: boolean;
}

export function Reactions({ targetType, targetId, compact }: ReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?targetType=${targetType}&targetId=${targetId}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts || {});
        setUserReaction(data.userReaction);
      })
      .catch(() => {});
  }, [targetType, targetId]);

  const toggle = useCallback(async (type: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, type }),
      });
      const data = await res.json();
      if (data.action === 'removed') {
        setCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
        setUserReaction(null);
      } else if (data.action === 'updated') {
        setCounts((prev) => {
          const old = userReaction ? { ...prev, [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1) } : prev;
          return { ...old, [type]: (old[type] || 0) + 1 };
        });
        setUserReaction(type);
      } else {
        setCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        setUserReaction(type);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [targetType, targetId, userReaction, loading]);

  const likeCount = counts['LIKE'] || 0;
  const heartCount = counts['HEART'] || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggle('LIKE')}
          disabled={loading}
          className={`flex items-center gap-1 text-xs transition-colors ${
            userReaction === 'LIKE' ? 'text-blue-400' : 'text-dark-500 hover:text-blue-400'
          }`}
        >
          {userReaction === 'LIKE' ? <FaThumbsUp size={12} /> : <FiThumbsUp size={12} />}
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          onClick={() => toggle('HEART')}
          disabled={loading}
          className={`flex items-center gap-1 text-xs transition-colors ${
            userReaction === 'HEART' ? 'text-red-400' : 'text-dark-500 hover:text-red-400'
          }`}
        >
          {userReaction === 'HEART' ? <FaHeart size={12} /> : <FiHeart size={12} />}
          {heartCount > 0 && <span>{heartCount}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle('LIKE')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
          userReaction === 'LIKE'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-dark-800/50 text-dark-400 hover:bg-blue-500/10 hover:text-blue-400'
        }`}
      >
        {userReaction === 'LIKE' ? <FaThumbsUp size={14} /> : <FiThumbsUp size={14} />}
        <span>{likeCount}</span>
      </button>
      <button
        onClick={() => toggle('HEART')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
          userReaction === 'HEART'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-dark-800/50 text-dark-400 hover:bg-red-500/10 hover:text-red-400'
        }`}
      >
        {userReaction === 'HEART' ? <FaHeart size={14} /> : <FiHeart size={14} />}
        <span>{heartCount}</span>
      </button>
    </div>
  );
}
