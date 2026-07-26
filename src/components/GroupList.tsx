'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUsers, FiPlus, FiUserPlus } from 'react-icons/fi';

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
  members: { user: { id: string; name: string | null; image: string | null } }[];
  isMember?: boolean;
}

export function GroupList() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        toast.success('Grupo creado');
        setNewName('');
        setNewDesc('');
        setShowCreate(false);
        loadGroups();
      }
    } catch {
      toast.error('Error al crear grupo');
    }
  }

  async function joinGroup(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
      if (res.ok) {
        toast.success('¡Te uniste al grupo!');
        loadGroups();
      }
    } catch {
      toast.error('Error al unirse');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Grupos de Estudio</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm flex items-center gap-2">
          <FiPlus size={14} /> Crear Grupo
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 space-y-3"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del grupo"
            className="input"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            className="input"
          />
          <div className="flex gap-2">
            <button onClick={createGroup} className="btn-primary text-sm">Crear</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </motion.div>
      )}

      {groups.length === 0 ? (
        <div className="card p-8 text-center">
          <FiUsers size={32} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No hay grupos aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <motion.div key={group.id} className="card-hover p-5" whileHover={{ scale: 1.01 }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-dark-400 mt-1">{group.description}</p>
                  )}
                </div>
                <span className="badge-blue flex items-center gap-1 text-[10px]">
                  <FiUsers size={10} /> {group._count.members}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 5).map((m) => (
                    <div
                      key={m.user.id}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 border-2 border-dark-900 flex items-center justify-center text-[10px] text-white font-bold"
                    >
                      {(m.user.name || '?')[0].toUpperCase()}
                    </div>
                  ))}
                  {group._count.members > 5 && (
                    <div className="w-7 h-7 rounded-full bg-dark-700 border-2 border-dark-900 flex items-center justify-center text-[10px] text-dark-400">
                      +{group._count.members - 5}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => joinGroup(group.id)}
                  className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <FiUserPlus size={12} /> Unirse
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
