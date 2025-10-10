'use client';
import { motion } from 'framer-motion';

export default function LoadingScreen({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
      <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.4,
            ease: 'easeInOut',
          }}
          className="h-full w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
        />
      </div>
      <p className="mt-4 text-gray-500 font-medium tracking-wide">{text}</p>
    </div>
  );
}
