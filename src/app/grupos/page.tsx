'use client';

import { GroupList } from '@/components/GroupList';
import { motion } from 'framer-motion';

export default function GroupsPage() {
  return (
    <div className="py-12">
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GroupList />
        </motion.div>
      </div>
    </div>
  );
}
