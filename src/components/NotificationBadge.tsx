import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBadge;