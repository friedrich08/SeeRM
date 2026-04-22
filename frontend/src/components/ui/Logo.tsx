import React from 'react';

export const Logo = ({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg', showText?: boolean }) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', icon: 20, text: 'text-lg', sub: 'text-[6px]' },
    md: { box: 'w-10 h-10', icon: 24, text: 'text-xl', sub: 'text-[8px]' },
    lg: { box: 'w-14 h-14', icon: 32, text: 'text-3xl', sub: 'text-[10px]' },
  }[size];

  return (
    <div className="flex items-center gap-3 group">
      {/* Stylized S Icon */}
      <div className={`${dimensions.box} bg-[#0b0f17] rounded-xl flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform group-hover:scale-105 duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 opacity-50" />
        <svg 
          width={dimensions.icon} 
          height={dimensions.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <path 
            d="M16 8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8C8 9.10457 8.89543 10 10 10H14C15.1046 10 16 10.8954 16 12C16 13.1046 15.1046 14 14 14H10C8.89543 14 8 13.1046 8 12" 
            stroke="url(#logo-gradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="logo-gradient" x1="8" y1="6" x2="16" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet */}
              <stop offset="100%" stopColor="#0ea5e9" /> {/* Blue électrique */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${dimensions.text} font-bold tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-none`}>
            SeeRM
          </span>
          <span className={`${dimensions.sub} font-black tracking-[0.3em] text-[#8b5cf6] uppercase opacity-80 mt-0.5 leading-none`}>
            CRM
          </span>
        </div>
      )}
    </div>
  );
};
