'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiUserPlus, FiUser, FiCheck, FiX, FiMessageSquare, FiSearch, FiShield,
  FiShieldOff, FiUsers, FiClock, FiUserMinus,
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
      // Find the contact record or create one
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
        // Create a blocked contact
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: blockTarget.id }),
        });
        if (res.ok) {
          // Now block it
          const data = await res.json();
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-12 skeleton rounded-xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">Contactos</h1>

          {/* Search */}
          <div className="card p-4 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Buscar personas por nombre o email..."
                  className="input pl-10"
                />
              </div>
              <button onClick={searchUsers} disabled={searching} className="btn-primary text-sm">
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ProfilePopup userId={user.id}>
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                              <FiUser size={14} className="text-brand-400" />
                            </div>
                          )}
                        </div>
                      </ProfilePopup>
                      <div>
                        <span className="text-sm text-white block">{user.name || 'Sin nombre'}</span>
                        <span className="text-xs text-dark-500">{user.email}</span>
                      </div>
                    </div>
                    <button onClick={() => addContact(user.id)} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                      <FiUserPlus size={12} /> Añadir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            {!showSuggestions ? (
              <button onClick={loadSuggestions} className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5">
                <FiUsers size={14} /> Personas que podrías conocer
              </button>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white">Personas que podrías conocer</h2>
                    <button onClick={() => setShowSuggestions(false)} className="text-dark-500 hover:text-white"><FiX size={14} /></button>
                  </div>
                  {suggestions.length === 0 ? (
                    <p className="text-dark-500 text-sm">No hay sugerencias disponibles</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {suggestions.map((s) => (
                        <div key={s.user.id} className="card p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <ProfilePopup userId={s.user.id}>
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                                {s.user.image ? (
                                  <img src={s.user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                                    <FiUser size={14} className="text-brand-400" />
                                  </div>
                                )}
                              </div>
                            </ProfilePopup>
                            <div className="min-w-0">
                              <span className="text-sm text-white block truncate">{s.user.name || 'Sin nombre'}</span>
                              <span className="text-xs text-dark-500 block truncate">
                                {s.sharedCoursesCount} curso{s.sharedCoursesCount > 1 ? 's' : ''} en común
                              </span>
                            </div>
                          </div>
                          <button onClick={() => addContact(s.user.id)} className="btn-outline text-xs py-1 px-2 flex-shrink-0 flex items-center gap-1">
                            <FiUserPlus size={10} /> Añadir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Solicitudes recibidas</h2>
              <div className="space-y-2">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProfilePopup userId={req.id}>
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
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
                        <span className="text-sm text-white block">{req.name || req.email}</span>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts list */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Tus contactos <span className="text-dark-500 font-normal text-sm">({contacts.length})</span>
            </h2>
            {contacts.length === 0 ? (
              <div className="card p-8 text-center">
                <FiUserPlus size={32} className="text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">Aún no tienes contactos. Busca personas para añadir.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {contacts.map((c) => {
                  const online = isOnline(c.lastSeen);
                  return (
                    <motion.div key={c.contactId || c.id} className="card p-4 flex items-center justify-between" whileHover={{ scale: 1.01 }}>
                      <Link href={`/estudiantes/${c.id}`} className="flex items-center gap-3 group flex-1 min-w-0">
                        <ProfilePopup userId={c.id}>
                          <div className="relative flex-shrink-0 cursor-pointer">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              {c.image ? (
                                <img src={c.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                                  <FiUser size={14} className="text-brand-400" />
                                </div>
                              )}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-900 ${online ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                          </div>
                        </ProfilePopup>
                        <div className="min-w-0">
                          <span className="text-sm text-white block truncate group-hover:text-brand-400 transition-colors">{c.name || 'Sin nombre'}</span>
                          <div className="flex items-center gap-1 text-xs text-dark-500">
                            {online ? (
                              <span className="text-emerald-400">En línea</span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <FiClock size={8} /> {formatLastSeen(c.lastSeen)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <Link href={`/chat?contactId=${c.id}`} className="p-2 text-dark-500 hover:text-brand-400 transition-colors" title="Enviar mensaje">
                          <FiMessageSquare size={14} />
                        </Link>
                        <button
                          onClick={() => setBlockTarget({ id: c.id, name: c.name || c.email })}
                          className="p-2 text-dark-500 hover:text-yellow-400 transition-colors"
                          title="Bloquear contacto"
                        >
                          <FiShieldOff size={14} />
                        </button>
                        <button onClick={() => removeContact(c.contactId || c.id)} className="p-2 text-dark-500 hover:text-red-400 transition-colors" title="Eliminar contacto">
                          <FiX size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked contacts */}
          {blocked.length > 0 && (
            <div>
              <button
                onClick={() => setShowBlocked(!showBlocked)}
                className="text-sm text-dark-500 hover:text-dark-300 transition-colors flex items-center gap-1.5 mb-3"
              >
                <FiShield size={14} /> Contactos bloqueados ({blocked.length})
                <span className="text-[10px]">{showBlocked ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {showBlocked && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    {blocked.map((b) => (
                      <div key={b.id} className="card p-3 flex items-center justify-between opacity-60">
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

      {/* Block confirmation modal */}
      <DeleteConfirmModal
        open={!!blockTarget}
        title="Bloquear contacto"
        message={`¿Bloquear a ${blockTarget?.name}? No podrá enviarte mensajes ni ver tu perfil.`}
        onConfirm={blockUser}
        onCancel={() => setBlockTarget(null)}
        loading={blockLoading}
      />

      {/* Unblock confirmation modal */}
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
