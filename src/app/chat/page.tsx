'use client';

import { useSearchParams } from 'next/navigation';
import { ChatPanel } from '@/components/ChatPanel';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const groupId = searchParams.get('groupId');

  return (
    <div className="py-12">
      <div className="section max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-6">
            {contactId ? 'Chat Privado' : groupId ? 'Chat del Grupo' : 'Chat General'}
          </h1>
          <ChatPanel groupId={groupId || undefined} contactId={contactId || undefined} />
        </motion.div>
      </div>
    </div>
  );
}
