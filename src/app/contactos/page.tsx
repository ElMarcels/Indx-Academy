'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiUserPlus, FiUser, FiCheck, FiX, FiMessageSquare, FiSearch, FiShield,
  FiShieldOff, FiUsers, FiClock, FiUserMinus, FiArrowRight,
} from 'react-icons/fi';
import { ProfilePopup } from '@/components/ProfilePopup';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Contact {
  id: string;
  contactId?: string;
  name: string | null;
  email: string;
  image: string | null;
  lastSeen: string | null;
  mutualCount?: number;
}

interface Suggestion {
  user: { id: string; name: string | null; email: string; image: string | null };
  sharedCourses: string[];
  sharedCoursesCount: number;
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(date: string | null): string {
  if (!date) return 'Nunca';
  const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  return `Hace ${Math.floor(diffH / 24)}d`;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  }
  return email[0].toUpperCase();
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ContactosPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blocked, setBlocked] = useState<Contact[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<{ id: string; name: string } | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [contactsRes, allRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/students'),
      ]);

      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
        setBlocked(data.blocked || []);
      }

      if (allRes.ok) {
        const data = await allRes.json();
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  async function loadSuggestions() {
    try {
      const res = await fetch('/api/peers');
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch { /* silent */ }
  }

  async function searchUsers() {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        const myId = (session?.user as any)?.id;
        const contactIds = contacts.map((c) => c.id);
        setSearchResults(
          (data.users || []).filter(
            (u: any) => u.id !== myId && !contactIds.includes(u.id)
          )
        );
      }
    } catch { /* silent */ } finally {
      setSearching(false);
    }
  }

  async function addContact(userId: string) {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Solicitud enviada');
        setSearchResults((prev) => prev.filter((u) => u.id !== userId));
        loadData();
      } else {
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error al enviar solicitud');
    }
  }

  async function acceptContact(contactId: string) {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      if (res.ok) {
        toast.success('Solicitud aceptada');
        loadData();
      }
    } catch {
      toast.error('Error al aceptar');
    }
  }

  async function removeContact(contactId: string) {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Contacto eliminado');
        loadData();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function blockUser() {
    if (!blockTarget) return;
    setBlockLoading(true);
    try {
      const existing = contacts.find((c) => c.id === blockTarget.id);
      if (existing?.contactId) {
        const res = await fetch(`/api/contacts/${existing.contactId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'BLOCKED' }),
        });
        if (res.ok) {
          toast.success('Contacto bloqueado');
          loadData();
        } else {
          toast.error('Error al bloquear');
        }
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: blockTarget.id }),
        });
        if (res.ok) {
          toast.success('Contacto bloqueado');
          loadData();
        }
      }
    } catch {
      toast.error('Error al bloquear');
    } finally {
      setBlockLoading(false);
      setBlockTarget(null);
    }
  }

  async function unblockUser() {
    if (!unblockTarget) return;
    try {
      const res = await fetch(`/api/contacts/${unblockTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Contacto desbloqueado');
        loadData();
      }
    } catch {
      toast.error('Error al desbloquear');
    } finally {
      setUnblockTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-6">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-14 skeleton rounded-xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const onlineCount = contacts.filter((c) => isOnline(c.lastSeen)).length;

  return (
    <div className="py-8">
      <div className="section max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero header */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-accent-600/10 to-emerald-600/10" />
            <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm" />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Contactos</h1>
                  <p className="text-dark-300 text-sm">Gestiona tu red de aprendizaje</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-dark-800/50 rounded-xl px-4 py-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm text-dark-200">{onlineCount} en línea</span>
                  </div>
                  <div className="bg-dark-800/50 rounded-xl px-4 py-2">
                    <span className="text-sm text-dark-200">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="card p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Buscar personas por nombre o email..."
                  className="input pl-10"
                />
              </div>
              <button onClick={searchUsers} disabled={searching} className="btn-primary text-sm flex items-center gap-2">
                {searching ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSearch size={14} />
                )}
                Buscar
              </button>
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2 overflow-hidden">
                  {searchResults.map((user) => (
                    <motion.div key={user.id} variants={itemVariants} initial="hidden" animate="show" className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 hover:bg-dark-800/60 transition-colors group">
                      <div className="flex items-center gap-3">
                        <ProfilePopup userId={user.id}>
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-dark-700/50 group-hover:ring-brand-500/30 transition-all">
                            {user.image ? (
                              <img src={user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="avatar-placeholder">
                                <FiUser size={14} className="text-brand-400" />
                              </div>
                            )}
                          </div>
                        </ProfilePopup>
                        <div>
                          <span className="text-sm font-medium text-white block">{user.name || 'Sin nombre'}</span>
                          <span className="text-xs text-dark-500">{user.email}</span>
                        </div>
                      </div>
                      <button onClick={() => addContact(user.id)} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <FiUserPlus size={12} /> Añadir
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Suggestions */}
          <div className="mb-8">
            {!showSuggestions ? (
              <button onClick={loadSuggestions} className="group flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <FiUsers size={14} />
                </div>
                Personas que podrías conocer
                <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Sugerencias</h2>
                    <button onClick={() => setShowSuggestions(false)} className="text-dark-500 hover:text-white transition-colors">
                      <FiX size={16} />
                    </button>
                  </div>
                  {suggestions.length === 0 ? (
                    <div className="card p-8 text-center">
                      <FiUsers size={24} className="text-dark-600 mx-auto mb-2" />
                      <p className="text-dark-500 text-sm">No hay sugerencias disponibles</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-3">
                      {suggestions.map((s) => (
                        <motion.div key={s.user.id} variants={itemVariants} className="card p-4 flex items-center justify-between hover:border-brand-500/20 transition-all group">
                          <div className="flex items-center gap-3 min-w-0">
                            <ProfilePopup userId={s.user.id}>
                              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-dark-700/50 group-hover:ring-brand-500/30 transition-all">
                                {s.user.image ? (
                                  <img src={s.user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="avatar-placeholder">
                                    <FiUser size={14} className="text-brand-400" />
                                  </div>
                                )}
                              </div>
                            </ProfilePopup>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white block truncate">{s.user.name || 'Sin nombre'}</span>
                              <span className="text-xs text-dark-500 block truncate">
                                {s.sharedCoursesCount} curso{s.sharedCoursesCount > 1 ? 's' : ''} en común
                              </span>
                            </div>
                          </div>
                          <button onClick={() => addContact(s.user.id)} className="btn-outline text-xs py-1.5 px-3 flex-shrink-0 flex items-center gap-1.5">
                            <FiUserPlus size={10} /> Añadir
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <h2 className="text-lg font-semibold text-white">Solicitudes recibidas</h2>
                <span className="badge-yellow text-[10px]">{pendingReceived.length}</span>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                {pendingReceived.map((req) => (
                  <motion.div key={req.id} variants={itemVariants} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProfilePopup userId={req.id}>
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-yellow-500/20">
                          {req.image ? (
                            <img src={req.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                              <FiUser size={14} className="text-yellow-400" />
                            </div>
                          )}
                        </div>
                      </ProfilePopup>
                      <div>
                        <span className="text-sm font-medium text-white block">{req.name || req.email}</span>
                        <span className="text-xs text-dark-500">Quiere ser tu contacto</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => acceptContact(req.contactId)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <FiCheck size={12} /> Aceptar
                      </button>
                      <button onClick={() => removeContact(req.contactId)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <FiX size={12} /> Rechazar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Contacts list */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Tus contactos
              </h2>
              <span className="text-xs text-dark-500">{contacts.length}</span>
            </div>
            {contacts.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-800/60 flex items-center justify-center mx-auto mb-4">
                  <FiUserPlus size={24} className="text-dark-500" />
                </div>
                <p className="text-dark-300 font-medium mb-1">Sin contactos aún</p>
                <p className="text-dark-500 text-sm">Busca personas o explora sugerencias para añadir contactos</p>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-3">
                {contacts.map((c) => {
                  const online = isOnline(c.lastSeen);
                  return (
                    <motion.div key={c.contactId || c.id} variants={itemVariants} className="card p-4 group">
                      <div className="flex items-center justify-between">
                        <Link href={`/estudiantes/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <ProfilePopup userId={c.id}>
                            <div className="relative flex-shrink-0 cursor-pointer">
                              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-dark-700/50 group-hover:ring-brand-500/30 transition-all">
                                {c.image ? (
                                  <img src={c.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="avatar-placeholder">
                                    <span className="text-sm font-semibold text-brand-400">{getInitials(c.name, c.email)}</span>
                                  </div>
                                )}
                              </div>
                              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-900 ${online ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                            </div>
                          </ProfilePopup>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-white block truncate group-hover:text-brand-400 transition-colors">{c.name || 'Sin nombre'}</span>
                            <div className="flex items-center gap-1.5 text-xs text-dark-500">
                              {online ? (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  En línea
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <FiClock size={10} /> {formatLastSeen(c.lastSeen)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-0.5 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/chat?contactId=${c.id}`} className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all" title="Enviar mensaje">
                            <FiMessageSquare size={14} />
                          </Link>
                          <button
                            onClick={() => setBlockTarget({ id: c.id, name: c.name || c.email })}
                            className="p-2 text-dark-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                            title="Bloquear contacto"
                          >
                            <FiShieldOff size={14} />
                          </button>
                          <button onClick={() => removeContact(c.contactId || c.id)} className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar contacto">
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Blocked contacts */}
          {blocked.length > 0 && (
            <div>
              <button
                onClick={() => setShowBlocked(!showBlocked)}
                className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-300 transition-colors mb-3"
              >
                <FiShield size={14} />
                <span>Contactos bloqueados ({blocked.length})</span>
                <span className="text-[10px] transition-transform" style={{ transform: showBlocked ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              <AnimatePresence>
                {showBlocked && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    {blocked.map((b) => (
                      <div key={b.id} className="card p-3 flex items-center justify-between opacity-60 hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-dark-800 rounded-full flex items-center justify-center">
                            <FiShield size={14} className="text-red-400" />
                          </div>
                          <div>
                            <span className="text-sm text-dark-300 block">{b.name || b.email}</span>
                            <span className="text-xs text-dark-600">Bloqueado</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setUnblockTarget({ id: b.contactId || b.id, name: b.name || b.email })}
                          className="text-xs text-dark-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          <FiShieldOff size={12} /> Desbloquear
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <DeleteConfirmModal
        open={!!blockTarget}
        title="Bloquear contacto"
        message={`¿Bloquear a ${blockTarget?.name}? No podrá enviarte mensajes ni ver tu perfil.`}
        onConfirm={blockUser}
        onCancel={() => setBlockTarget(null)}
        loading={blockLoading}
      />

      <DeleteConfirmModal
        open={!!unblockTarget}
        title="Desbloquear contacto"
        message={`¿Desbloquear a ${unblockTarget?.name}?`}
        onConfirm={unblockUser}
        onCancel={() => setUnblockTarget(null)}
      />
    </div>
  );
}
