import React from 'react';
import { motion } from 'framer-motion';

export default function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        <p className="font-body font-medium text-sm text-white/80">{label}</p>
        {description && (
          <p className="font-body text-xs text-white/40 mt-0.5">{description}</p>
        )}
      </div>
      <div
        className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 cursor-pointer"
        style={{
          background: checked
            ? 'linear-gradient(135deg, #f0c060, #c8881a)'
            : 'rgba(255,255,255,0.1)',
          boxShadow: checked ? '0 2px 10px rgba(240,192,96,0.3)' : 'none',
        }}
        onClick={() => onChange(!checked)}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full shadow-md"
          animate={{ left: checked ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            background: checked ? '#08090c' : 'rgba(255,255,255,0.5)',
          }}
        />
      </div>
    </label>
  );
}