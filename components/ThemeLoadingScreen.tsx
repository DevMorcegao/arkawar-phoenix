'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const ThemeLoadingScreen = () => {
  return (
    <motion.div
      data-testid="theme-loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} // Adiciona saída suave para evitar flash
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
    >
      <div className="relative w-40 h-40">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            opacity: 1,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500 rounded-full opacity-75 blur-lg"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [1.1, 0.9, 1.1],
            rotate: [0, -360],
            opacity: 1,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{
              y: [0, -5, 0],
              opacity: 1,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-5xl"
          >
            🔥
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
