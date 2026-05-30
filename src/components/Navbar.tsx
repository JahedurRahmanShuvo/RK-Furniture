import React from 'react';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  cartCount: number;
  onCartToggle: () => void;
  onSearchToggle: () => void;
  onLoginClick: () => void;
  onLogoClick: () => void;
}

export default function Navbar({
  user,
  cartCount,
  onCartToggle,
  onSearchToggle,
  onLoginClick,
  onLogoClick
}: NavbarProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-30 shadow-sm">
      {/* Brand Logo and Menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-1.5 focus:outline-none"
        >
          <span className="font-extrabold tracking-tight text-xl text-slate-800 flex items-center font-sans">
            RK<span className="text-[#c25927] font-medium font-sans">.</span>
            <span className="text-[#15803d] font-sans ml-1 text-lg font-bold">FURNITURE</span>
          </span>
        </button>
      </div>

      {/* Quick Search and Action bar */}
      <div className="flex items-center gap-3">
        {/* Search Toggle button inside colored circle */}
        <button
          onClick={onSearchToggle}
          className="w-9 h-9 border border-[#c25927]/80 text-slate-800 hover:bg-[#c25927]/5 rounded-full transition-colors flex items-center justify-center focus:outline-none"
          title="Search products"
        >
          <Search className="w-[18px] h-[18px] stroke-[2.2]" />
        </button>

        {/* Cart Trigger inside colored circle with live count badge */}
        <button
          onClick={onCartToggle}
          className="w-9 h-9 border border-[#c25927]/80 text-slate-800 hover:bg-[#c25927]/5 rounded-full transition-colors relative flex items-center justify-center focus:outline-none"
          title="Shopping cart"
        >
          <ShoppingCart className="w-[18px] h-[18px] stroke-[2.2]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#15803d] text-white font-black text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center border border-white shadow-sm">
              {cartCount}
            </span>
          )}
        </button>

        {/* Dynamic Login / Dashboard orange button */}
        <button
          onClick={onLoginClick}
          className="bg-[#c25927] hover:bg-[#b04d20] text-white font-bold text-xs sm:text-sm px-4 rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center focus:outline-none cursor-pointer leading-none h-8"
        >
          <span>{user.isLoggedIn ? 'Dashboard' : 'Login'}</span>
        </button>
      </div>
    </header>
  );
}
