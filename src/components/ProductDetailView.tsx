import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import BoxWithRays from './BoxWithRays';

interface ProductDetailViewProps {
  prod: Product;
  onBack: () => void;
  addToCart: (productId: string, qty: number) => void;
  setView: (view: 'home' | 'product_detail' | 'checkout' | 'order_success' | 'track_order' | 'dashboard' | 'auth') => void;
}

export default function ProductDetailView({ prod, onBack, addToCart, setView }: ProductDetailViewProps) {
  const [detailQty, setDetailQty] = useState(1);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(prod.image);

  return (
    <div className="space-y-5">
      {/* Back Navigation header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collections</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
        {/* Left: Gallery of Images */}
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-xl h-56 sm:h-72 overflow-hidden flex items-center justify-center p-4 border border-slate-100">
            {selectedGalleryImg === 'placeholder_box' ? (
              <BoxWithRays className="w-32 h-32 text-slate-800" />
            ) : (
              <img
                src={selectedGalleryImg}
                alt={prod.name}
                className="w-full h-full object-cover rounded"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Small gallery thumbnails list */}
          {prod.images && prod.images.length > 1 && (
            <div className="flex gap-2">
              {prod.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGalleryImg(img)}
                  className={`w-14 h-14 rounded border overflow-hidden bg-slate-50 p-1 transition ${
                    selectedGalleryImg === img ? 'border-[#c25927] ring-2 ring-orange-100' : 'border-slate-200'
                  }`}
                >
                  {img === 'placeholder_box' ? (
                    <BoxWithRays className="w-10 h-10 text-slate-800 mx-auto" />
                  ) : (
                    <img src={img} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#15803d] border border-[#15803d]/20 bg-emerald-50 px-2 py-0.5 rounded uppercase">
              Handcrafted Unit
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
              {prod.name}
            </h2>
            {/* Rating decoration */}
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              <span>★★★★★</span>
              <span className="text-slate-400 font-semibold">(5.0 Store Avg Ref)</span>
            </div>
            <div className="text-2xl font-extrabold text-[#c25927] pt-1">
              {prod.price.toLocaleString()}د.إ
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications/Notes</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {prod.description || 'No description available'}
            </p>
          </div>

          {/* Quantities manager and action stack */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Select Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setDetailQty((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3.5 text-xs font-bold text-slate-800">{detailQty}</span>
                <button
                  type="button"
                  onClick={() => setDetailQty((prev) => prev + 1)}
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => addToCart(prod.id, detailQty)}
                className="bg-white border border-[#15803d]/80 text-[#15803d] font-bold text-xs py-2.5 rounded-xl hover:bg-emerald-50/50 transition cursor-pointer text-center"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(prod.id, detailQty);
                  setView('checkout');
                }}
                className="bg-[#15803d] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-emerald-800 transition shadow cursor-pointer text-center"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
