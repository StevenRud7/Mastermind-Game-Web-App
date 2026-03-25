import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isGame = location.pathname === '/game';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between"
      style={{
        background: 'linear-gradient(to bottom, rgba(8,9,12,0.95), transparent)',
      }}
    >
      {/* Logo */}
      <motion.button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f0c060, #c8881a)',
            boxShadow: '0 2px 12px rgba(240,192,96,0.35)',
          }}
        >
          <span className="text-ink-950 font-display font-black text-sm">M</span>
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">
          Mastermind
        </span>
      </motion.button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isGame && (
          <button
            onClick={() => navigate('/')}
            className="btn-ghost text-xs py-2 px-4"
          >
            ← Menu
          </button>
        )}
      </div>
    </header>
  );
}