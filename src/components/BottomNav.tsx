import React from 'react';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'categories' | 'cart' | 'profile';
  onTabChange: (tab: 'home' | 'categories' | 'cart' | 'profile') => void;
  cartCount: number;
}

export default function BottomNav({ currentTab, onTabChange, cartCount }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-6 flex justify-around items-center z-40 shadow-lg">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 text-xs transition-colors ${
          currentTab === 'home' ? 'text-green-700 font-medium' : 'text-gray-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onTabChange('categories')}
        className={`flex flex-col items-center gap-1 text-xs transition-colors ${
          currentTab === 'categories' ? 'text-green-700 font-medium' : 'text-gray-500'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span>Categories</span>
      </button>

      <button
        onClick={() => onTabChange('cart')}
        className={`flex flex-col items-center gap-1 text-xs transition-colors relative ${
          currentTab === 'cart' ? 'text-green-700 font-medium' : 'text-gray-500'
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1.5 bg-[#40a832] text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span>Cart</span>
      </button>

      <button
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 text-xs transition-colors ${
          currentTab === 'profile' ? 'text-green-700 font-medium' : 'text-gray-500'
        }`}
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </button>
    </div>
  );
}
