import React from 'react';

export default function BoxWithRays({ className = 'w-24 h-24 text-slate-800' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      {/* Rays */}
      <line x1="50" y1="20" x2="50" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="24" x2="32" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="62" y1="24" x2="68" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="32" x2="18" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="72" y1="32" x2="82" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* Cardboard Box geometry */}
      {/* Lid Flaps */}
      <polygon points="50,42 22,34 30,30 56,38" fill="currentColor" opacity="0.85" />
      <polygon points="50,42 78,34 70,30 44,38" fill="currentColor" opacity="0.85" />
      <polygon points="22,34 26,48 50,42 50,38" fill="currentColor" opacity="0.9" />
      <polygon points="78,34 74,48 50,42 50,38" fill="currentColor" opacity="0.9" />

      {/* Main Box body */}
      {/* Front Left Panel */}
      <polygon points="26,48 50,58 50,78 26,66" fill="currentColor" opacity="0.95" />
      {/* Front Right Panel */}
      <polygon points="74,48 50,58 50,78 74,66" fill="currentColor" />
      
      {/* Inside Shadow panel / fold line */}
      <line x1="50" y1="58" x2="50" y2="78" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
}
