'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiUsers, FiUserPlus, FiCheck, FiX, FiBookOpen, FiTag, FiSearch,
  FiLoader, FiInbox,
} from 'react-icons/fi';

interface Peer {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  interests: string[];
  sharedCourses: number;
  image: string | null;
}

interface MatchRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  interests?: string[];
  sharedCourses?: number;
}

type Tab = 'find' | 'pending' | 'accepted';

export function PeerMatching() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [tab, setTab] = useState<Tab>('find');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchPeers = useCallback(async () => {
    try {
      const res = await fetch('/api/peers');
      if (res.ok) {
        const data = await res.json();
        setPeers(data.peers || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/peers?requests=true');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeers();
    fetchRequests();
  }, [fetchPeers, fetchRequests]);

  async function sendRequest(peerId: string) {
    setSendingId(peerId);
    try {
      const res = await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: peerId }),
      });
      if (res.ok) {
        toast.success('Solicitud enviada');
        await fetchRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al enviar solicitud');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSendingId(null);
    }
  }

  async function updateRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    try {
      const res = await fetch('/api/peers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok) {
        toast.success(status === 'ACCEPTED' ? 'Solicitud aceptada' : 'Solicitud rechazada');
        await fetchRequests();
      } else {
        toast.error('Error al actualizar solicitud');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  const sentIds = new Set(requests.map((r) => r.senderId === userId ? r.receiverId : r.senderId));
  const incomingPending = requests.filter((r) => r.receiverId === userId && r.status === 'PENDING');
  const accepted = requests.filter((r) => r.status === 'ACCEPTED');
  const filteredPeers = peers.filter(
    (p) =>
      !sentIds.has(p.id) &&
      p.id !== userId &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.interests.some((i) => i.toLowerCase().includes(search.toLowerCase())))
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'find', label: 'Encontrar', count: filteredPeers.length },
    { key: 'pending', label: 'Pendientes', count: incomingPending.length },
    { key: 'accepted', label: 'Aceptados', count: accepted.length },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <FiUsers size={20} className="text-brand-400" />
        <h2 className="text-lg font-bold text-white">Compañeros de Estudio</h2>
      </div>

      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <motion.button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              tab === t.key
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-dark-400 hover:text-dark-200 border border-transparent'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0 rounded-full ${
                tab === t.key ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-700 text-dark-400'
              }`}>
                {t.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {tab === 'find' && (
        <div className="relative mb-4">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o interés..."
            className="input pl-10 text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-dark-800 rounded-xl animate-pulse" />)}
        </div>
      ) : tab === 'find' ? (
        filteredPeers.length === 0 ? (
          <EmptyState
            icon={<FiInbox size={40} className="text-dark-700" />}
            message="No se encontraron compañeros de estudio"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {filteredPeers.map((peer) => (
                <motion.div
                  key={peer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-dark-800/30 border border-dark-800/50 rounded-xl p-4 hover:border-brand-500/20 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-brand-500/20 shrink-0">
                      <span className="text-sm font-semibold text-brand-400">
                        {(peer.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{peer.name}</h4>
                      {peer.bio && <p className="text-[11px] text-dark-400 line-clamp-2 mt-0.5">{peer.bio}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-[11px] text-dark-500">
                    <span className="flex items-center gap-1">
                      <FiBookOpen size={10} /> {peer.sharedCourses} cursos compartidos
                    </span>
                  </div>

                  {peer.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {peer.interests.slice(0, 4).map((interest) => (
                        <span key={interest} className="badge-blue text-[9px] py-0">
                          <FiTag size={8} className="mr-0.5" /> {interest}
                        </span>
                      ))}
                      {peer.interests.length > 4 && (
                        <span className="text-[9px] text-dark-500">+{peer.interests.length - 4}</span>
                      )}
                    </div>
                  )}

                  <motion.button
                    onClick={() => sendRequest(peer.id)}
                    disabled={sendingId === peer.id}
                    className="btn-primary text-xs py-1.5 px-3 w-full flex items-center justify-center gap-1"
                    whileTap={{ scale: 0.95 }}
                  >
                    {sendingId === peer.id ? (
                      <><FiLoader size={12} className="animate-spin" /> Enviando...</>
                    ) : (
                      <><FiUserPlus size={12} /> Enviar Solicitud</>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      ) : tab === 'pending' ? (
        incomingPending.length === 0 ? (
          <EmptyState
            icon={<FiInbox size={40} className="text-dark-700" />}
            message="No hay solicitudes pendientes"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {incomingPending.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-dark-800/30 border border-dark-800/50 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-brand-500/20 shrink-0">
                      <span className="text-sm font-semibold text-brand-400">
                        {(req.senderName || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{req.senderName}</h4>
                      <p className="text-[11px] text-dark-500">Quiere ser tu compañero de estudio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      onClick={() => updateRequest(req.id, 'ACCEPTED')}
                      className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      title="Aceptar"
                    >
                      <FiCheck size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => updateRequest(req.id, 'REJECTED')}
                      className="p-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      title="Rechazar"
                    >
                      <FiX size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        accepted.length === 0 ? (
          <EmptyState
            icon={<FiUsers size={40} className="text-dark-700" />}
            message="Aún no tienes compañeros de estudio aceptados"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {accepted.map((req) => {
                const partnerName = req.senderId === userId ? req.receiverName : req.senderName;
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-dark-800/30 border border-emerald-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-brand-500/20 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <span className="text-sm font-semibold text-emerald-400">
                          {(partnerName || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{partnerName}</h4>
                        <span className="badge-green text-[9px]">Compañero aceptado</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12">
      <div className="mb-3">{icon}</div>
      <p className="text-dark-500 text-sm">{message}</p>
    </div>
  );
}
