'use client';

import { ChatPanel } from '@/components/ChatPanel';
import { motion } from 'framer-motion';

export default function ChatPage() {
  return (
    <div className="py-12">
      <div className="section max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-6">Chat General</h1>
          <ChatPanel />
        </motion.div>
      </div>
    </div>
  );
}
