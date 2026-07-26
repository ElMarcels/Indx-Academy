'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiUsers, FiPlus, FiTrash2, FiShield, FiUserPlus, FiChevronDown, FiChevronUp,
  FiMessageSquare, FiSettings, FiUserMinus, FiStar, FiPhone, FiVideo, FiPhoneOff,
} from 'react-icons/fi';
import { ChatPanel } from '@/components/ChatPanel';

interface GroupMember {
  user: { id: string; name: string | null; email: string; image: string | null };
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  _count: { members: number };
  members: GroupMember[];
}

interface Contact {
  id: string;
  name: string | null;
  email: string;
}

export default function GroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<any>(null);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [myRole, setMyRole] = useState<string>('MEMBER');
  const [activeCall, setActiveCall] = useState<{ id: string; groupId: string; type: string; startedAt: string } | null>(null);
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeCall) return;
    setCallTimer(0);
    const interval = setInterval(() => setCallTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  function formatCallTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function startCall(groupId: string, type: 'AUDIO' | 'VIDEO') {
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, type }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCall({ id: data.call.id, groupId, type, startedAt: new Date().toISOString() });
        toast.success(`Llamada ${type === 'VIDEO' ? 'de video' : 'de audio'} iniciada`);
      } else {
        toast.error('Error al iniciar llamada');
      }
    } catch {
      toast.error('Error al iniciar llamada');
    }
  }

  async function endCall() {
    if (!activeCall) return;
    try {
      await fetch(`/api/calls/${activeCall.id}`, { method: 'PUT' });
      setActiveCall(null);
      setCallTimer(0);
      toast.success('Llamada finalizada');
    } catch {
      toast.error('Error al finalizar llamada');
    }
  }

  async function loadData() {
    try {
      const [groupsRes, contactsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/contacts'),
      ]);
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
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
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          memberIds: selectedMembers,
        }),
      });
      if (res.ok) {
        toast.success('Grupo creado');
        setNewName('');
        setNewDesc('');
        setSelectedMembers([]);
        setShowCreate(false);
        loadData();
      }
    } catch {
      toast.error('Error al crear grupo');
    }
  }

  async function loadGroupDetail(groupId: string) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setGroupDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupDetail(data.group);
        setMyRole(data.myRole);
        setExpandedGroup(groupId);
      } else {
        toast.error('No tienes acceso a este grupo');
      }
    } catch {
      toast.error('Error al cargar grupo');
    }
  }

  async function inviteMember(groupId: string, userId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success('Miembro añadido');
        setShowInvite(null);
        loadGroupDetail(groupId);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error al añadir miembro');
    }
  }

  async function removeMember(groupId: string, userId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Miembro eliminado');
        loadGroupDetail(groupId);
        loadData();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function toggleAdmin(groupId: string, userId: string, currentRole: string) {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        toast.success(newRole === 'ADMIN' ? 'Ahora es admin' : 'Rol cambiado a miembro');
        loadGroupDetail(groupId);
      }
    } catch {
      toast.error('Error al cambiar rol');
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm('¿Eliminar este grupo? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Grupo eliminado');
        setExpandedGroup(null);
        loadData();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function leaveGroup(groupId: string) {
    if (!confirm('¿Salir del grupo?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Has salido del grupo');
        setExpandedGroup(null);
        loadData();
      }
    } catch {
      toast.error('Error al salir');
    }
  }

  const myId = (session?.user as any)?.id;

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/3" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="h-32 bg-dark-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-dark-950/95 backdrop-blur-xl flex flex-col items-center justify-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              activeCall.type === 'VIDEO' ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20' : 'bg-gradient-to-br from-green-500/30 to-green-600/20'
            }`}>
              {activeCall.type === 'VIDEO' ? <FiVideo size={40} className="text-blue-400" /> : <FiPhone size={40} className="text-green-400" />}
            </div>
            <p className="text-white text-xl font-semibold mb-1">Llamada {activeCall.type === 'VIDEO' ? 'de Video' : 'de Audio'}</p>
            <p className="text-dark-400 text-sm mb-2">En curso...</p>
            <p className="text-brand-400 text-2xl font-mono font-bold mb-8">{formatCallTime(callTimer)}</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={endCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <FiPhoneOff size={22} className="text-white" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="section max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Mis Grupos</h1>
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm flex items-center gap-2">
              <FiPlus size={14} /> Crear Grupo
            </button>
          </div>

          <AnimatePresence>
            {showCreate && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-5 mb-6">
                <h3 className="text-white font-semibold mb-3">Nuevo Grupo</h3>
                <div className="space-y-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del grupo" className="input" />
                  <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripción (opcional)" className="input" />
                  <div>
                    <label className="text-sm text-dark-400 mb-2 block">Añadir contactos al grupo:</label>
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedMembers((prev) => prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id])}
                          className={`text-xs py-1.5 px-3 rounded-xl border transition-all ${
                            selectedMembers.includes(c.id)
                              ? 'bg-brand-600 text-white border-brand-500'
                              : 'bg-dark-800 text-dark-300 border-dark-700 hover:border-brand-500/50'
                          }`}
                        >
                          {c.name || c.email}
                        </button>
                      ))}
                      {contacts.length === 0 && <span className="text-dark-500 text-xs">Añade contactos primero</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createGroup} className="btn-primary text-sm">Crear Grupo</button>
                    <button onClick={() => { setShowCreate(false); setSelectedMembers([]); }} className="btn-secondary text-sm">Cancelar</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {groups.length === 0 ? (
            <div className="card p-8 text-center">
              <FiUsers size={32} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No tienes grupos aún. Crea uno y añade a tus contactos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="card overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-dark-800/30 transition-colors" onClick={() => loadGroupDetail(group.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FiUsers size={16} className="text-brand-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{group.name}</h3>
                          {group.description && <p className="text-xs text-dark-400 mt-0.5">{group.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge-blue text-[10px]">
                          <FiUsers size={10} className="mr-1" /> {group._count.members}
                        </span>
                        {activeCall && activeCall.groupId === group.id && (
                          <span className="flex items-center gap-1 text-[10px] text-green-400 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            {activeCall.type === 'VIDEO' ? <FiVideo size={10} /> : <FiPhone size={10} />}
                          </span>
                        )}
                        {expandedGroup === group.id ? <FiChevronUp size={16} className="text-dark-400" /> : <FiChevronDown size={16} className="text-dark-400" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedGroup === group.id && groupDetail && groupDetail.id === group.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-dark-800/50 p-4">
                          {/* Call controls */}
                          <div className="flex items-center gap-2 mb-4">
                            <button
                              onClick={() => startCall(group.id, 'AUDIO')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors"
                            >
                              <FiPhone size={14} /> Llamada
                            </button>
                            <button
                              onClick={() => startCall(group.id, 'VIDEO')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors"
                            >
                              <FiVideo size={14} /> Video
                            </button>
                            {activeCall && activeCall.groupId === group.id && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 text-sm animate-pulse">
                                <span className="w-2 h-2 bg-green-400 rounded-full" /> En llamada &middot; {formatCallTime(callTimer)}
                              </span>
                            )}
                          </div>

                          {/* Group chat */}
                          <div className="mb-4">
                            <ChatPanel groupId={group.id} />
                          </div>

                          {/* Members */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">Miembros ({groupDetail.members.length})</h4>
                            {myRole === 'ADMIN' && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setShowInvite(showInvite === group.id ? null : group.id)} className="btn-outline text-xs py-1 px-3 flex items-center gap-1">
                                  <FiUserPlus size={12} /> Añadir
                                </button>
                                <button onClick={() => deleteGroup(group.id)} className="text-dark-500 hover:text-red-400 transition-colors p-1.5" title="Eliminar grupo">
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          <AnimatePresence>
                            {showInvite === group.id && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3 p-3 bg-dark-800/50 rounded-xl">
                                <input
                                  value={inviteSearch}
                                  onChange={(e) => setInviteSearch(e.target.value)}
                                  placeholder="Buscar contacto..."
                                  className="input text-sm mb-2"
                                />
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {contacts
                                    .filter((c) => !groupDetail.members.some((m: any) => m.user.id === c.id))
                                    .filter((c) => !inviteSearch || (c.name || '').toLowerCase().includes(inviteSearch.toLowerCase()) || c.email.toLowerCase().includes(inviteSearch.toLowerCase()))
                                    .map((c) => (
                                      <button key={c.id} onClick={() => inviteMember(group.id, c.id)} className="w-full text-left p-2 text-sm text-dark-200 hover:bg-dark-700 rounded-lg transition-colors flex items-center gap-2">
                                        <FiUserPlus size={12} className="text-brand-400" />
                                        {c.name || c.email}
                                      </button>
                                    ))
                                  }
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-1">
                            {groupDetail.members.map((m: GroupMember) => (
                              <div key={m.user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-800/50 transition-colors">
                                <Link href={`/estudiantes/${m.user.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    {m.role === 'ADMIN' ? (
                                      <FiStar size={12} className="text-yellow-400" />
                                    ) : (
                                      <span className="text-xs text-brand-400 font-bold">{(m.user.name || '?')[0].toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm text-white block truncate">{m.user.name || m.user.email}</span>
                                    {m.user.email && m.user.name && <span className="text-xs text-dark-500 block truncate">{m.user.email}</span>}
                                  </div>
                                </Link>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                  {m.role === 'ADMIN' && <span className="badge-yellow text-[10px] mr-1">Admin</span>}
                                  {myRole === 'ADMIN' && m.user.id !== myId && (
                                    <>
                                      <button onClick={() => toggleAdmin(group.id, m.user.id, m.role)} className="p-1.5 text-dark-500 hover:text-yellow-400 transition-colors" title={m.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}>
                                        <FiShield size={12} />
                                      </button>
                                      <button onClick={() => removeMember(group.id, m.user.id)} className="p-1.5 text-dark-500 hover:text-red-400 transition-colors" title="Eliminar del grupo">
                                        <FiUserMinus size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {myRole !== 'ADMIN' && (
                            <button onClick={() => leaveGroup(group.id)} className="mt-3 text-xs text-dark-500 hover:text-red-400 transition-colors">
                              Salir del grupo
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
