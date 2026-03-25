import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import GamePage from './pages/GamePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*"     element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}