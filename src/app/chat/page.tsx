'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatPanel } from '@/components/ChatPanel';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiUsers } from 'react-icons/fi';

function ChatContent() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const groupId = searchParams.get('groupId');

  const chatLabel = contactId ? 'Privado' : groupId ? 'Grupal' : 'General';
  const chatIcon = groupId ? <FiUsers size={16} className="text-accent-400" /> : <FiMessageSquare size={16} className="text-brand-400" />;

  return (
    <div className="py-8">
      <div className="section max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-accent-600/10 to-emerald-600/10" />
            <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm" />
            <div className="relative p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dark-800/60 flex items-center justify-center border border-dark-700/30">
                  {chatIcon}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    {contactId ? 'Chat Privado' : groupId ? 'Chat del Grupo' : 'Chat General'}
                  </h1>
                  <p className="text-dark-400 text-xs">
                    Conversación {chatLabel.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <ChatPanel groupId={groupId || undefined} contactId={contactId || undefined} />
        </motion.div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="py-12 section">
        <div className="animate-pulse space-y-6">
          <div className="h-28 skeleton rounded-2xl" />
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
