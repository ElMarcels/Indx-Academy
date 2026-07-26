'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

interface ChallengeData {
  title: string;
  description: string;
  difficulty: string;
  points: number;
}

interface AdminChallengeEditorProps {
  courseId: string;
  existingChallenge?: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    points: number;
  };
  onUpdate: () => void;
}

export function AdminChallengeEditor({ courseId, existingChallenge, onUpdate }: AdminChallengeEditorProps) {
  const [challenge, setChallenge] = useState<ChallengeData>({
    title: existingChallenge?.title || '',
    description: existingChallenge?.description || '',
    difficulty: existingChallenge?.difficulty || 'EASY',
    points: existingChallenge?.points || 10,
  });
  const [saving, setSaving] = useState(false);

  async function saveChallenge() {
    if (!challenge.title.trim() || !challenge.description.trim()) {
      toast.error('Título y descripción son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/challenges`, {
        method: existingChallenge ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, ...challenge, challengeId: existingChallenge?.id }),
      });
      if (res.ok) {
        toast.success('Desafío guardado');
        onUpdate();
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">Desafío</h4>
        <button onClick={saveChallenge} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
          <FiSave size={14} />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <input
        value={challenge.title}
        onChange={(e) => setChallenge((p) => ({ ...p, title: e.target.value }))}
        placeholder="Título del desafío"
        className="input"
      />

      <textarea
        value={challenge.description}
        onChange={(e) => setChallenge((p) => ({ ...p, description: e.target.value }))}
        placeholder="Describe el desafío, objetivos y criterios de evaluación..."
        rows={6}
        className="input"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Dificultad</label>
          <select
            value={challenge.difficulty}
            onChange={(e) => setChallenge((p) => ({ ...p, difficulty: e.target.value }))}
            className="input"
          >
            <option value="EASY">Fácil</option>
            <option value="MEDIUM">Medio</option>
            <option value="HARD">Difícil</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Puntos</label>
          <input
            type="number"
            value={challenge.points}
            onChange={(e) => setChallenge((p) => ({ ...p, points: parseInt(e.target.value) || 10 }))}
            min={1}
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
