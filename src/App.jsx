import React from 'react';
import { createRoot } from 'react-dom/client'; // ⚠️ 這行你漏了！
import './music.css';
import Music from './music.jsx'; // ⚠️ 刪掉最後那個斜線

export default function App1() {
  return (
    <main style={{ padding: 24 }}>
      <Music />
    </main>
  );
}

// React 掛載點
const el = document.getElementById('musicroot');
if (el) {
  createRoot(el).render(<App1 />);
}
