'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiBell, FiCheck, FiCheckCheck, FiAward, FiMessageSquare, FiMessageCircle,
  FiInfo, FiX, FiLoader,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'ACHIEVEMENT' | 'MESSAGE' | 'FORUM' | 'INFO';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  ACHIEVEMENT: { icon: <FiAward size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  MESSAGE: { icon: <FiMessageSquare size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  FORUM: { icon: <FiMessageCircle size={14} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  INFO: { icon: <FiInfo size={14} />, color: 'text-dark-400', bg: 'bg-dark-500/10' },
};

export function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { /* silent */ }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Todas marcadas como leídas');
    } catch {
      toast.error('Error al marcar notificaciones');
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.read) markAsRead(notif.id);
    setOpen(false);
    if (notif.link) router.push(notif.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800/50"
        whileTap={{ scale: 0.9 }}
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-dark-900 border border-dark-800/50 rounded-xl shadow-2xl shadow-dark-950/80 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-dark-800/50">
              <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <motion.button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                  whileTap={{ scale: 0.95 }}
                >
                  {markingAll ? <FiLoader size={10} className="animate-spin" /> : <FiCheckCheck size={10} />}
                  Marcar todo leído
                </motion.button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <FiLoader size={20} className="text-dark-600 animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <FiBell size={24} className="text-dark-700 mx-auto mb-2" />
                  <p className="text-dark-500 text-xs">No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.INFO;
                  return (
                    <motion.button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-dark-800/50 border-b border-dark-800/30 ${
                        !notif.read ? 'bg-dark-800/20' : ''
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-semibold truncate ${notif.read ? 'text-dark-300' : 'text-white'}`}>
                            {notif.title}
                          </h4>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-dark-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-dark-600 mt-1 block">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
