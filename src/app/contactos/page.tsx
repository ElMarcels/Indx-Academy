'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUser, FiCheck, FiX, FiMessageSquare, FiSearch } from 'react-icons/fi';

interface Contact {
  id: string;
  userId?: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default function ContactosPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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
        setContacts(data.contacts);
      }

      if (allRes.ok) {
        const data = await allRes.json();
        const myId = (session?.user as any)?.id;
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/3" />
          <div className="h-12 bg-dark-800 rounded-xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-dark-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Contactos</h1>

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
                      <div className="w-9 h-9 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-full flex items-center justify-center">
                        <FiUser size={14} className="text-brand-400" />
                      </div>
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

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Solicitudes recibidas</h2>
              <div className="space-y-2">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center">
                        <FiUser size={14} className="text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-sm text-white block">{req.name || req.email}</span>
                        <span className="text-xs text-dark-500">Quiere ser tu contacto</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => acceptContact(req.id)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <FiCheck size={12} /> Aceptar
                      </button>
                      <button onClick={() => removeContact(req.id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <FiX size={12} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts list */}
          <div>
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
                {contacts.map((c) => (
                  <motion.div key={c.id} className="card p-4 flex items-center justify-between" whileHover={{ scale: 1.01 }}>
                    <Link href={`/estudiantes/${c.id}`} className="flex items-center gap-3 group flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser size={16} className="text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm text-white block truncate group-hover:text-brand-400 transition-colors">{c.name || 'Sin nombre'}</span>
                        <span className="text-xs text-dark-500 block truncate">{c.email}</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Link href={`/chat?contactId=${c.id}`} className="p-2 text-dark-500 hover:text-brand-400 transition-colors" title="Enviar mensaje">
                        <FiMessageSquare size={14} />
                      </Link>
                      <button onClick={() => removeContact(c.id)} className="p-2 text-dark-500 hover:text-red-400 transition-colors" title="Eliminar contacto">
                        <FiX size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
