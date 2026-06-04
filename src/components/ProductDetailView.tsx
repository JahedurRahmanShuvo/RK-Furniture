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

  // Synchronize state when product changes
  React.useEffect(() => {
    setSelectedGalleryImg(prod.image);
    setDetailQty(1);
  }, [prod.id, prod.image]);

  const explicitDiscount = !!prod.discountPercent && prod.discountPercent > 0;
  const currentPrice = explicitDiscount 
    ? Math.round(prod.price * (1 - prod.discountPercent / 100))
    : prod.price;
  const oldPrice = explicitDiscount 
    ? prod.price 
    : (prod.oldPrice || undefined);

  let finalDiscountPercent = 0;
  if (explicitDiscount) {
    finalDiscountPercent = prod.discountPercent || 0;
  } else if (prod.oldPrice && prod.price && prod.price < prod.oldPrice) {
    finalDiscountPercent = Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100);
  }
  const hasDiscount = finalDiscountPercent > 0;

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
          <div className="bg-slate-50 rounded-xl h-56 sm:h-72 overflow-hidden flex items-center justify-center p-4 border border-slate-100 relative">
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
            <div className="flex gap-2 flex-wrap">
              {prod.images.filter(img => img !== '').map((img, i) => (
                <button
                  key={i}
                  type="button"
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
              {prod.name}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-extrabold text-[#c25927] font-mono">
                {currentPrice.toLocaleString()} AED
              </span>
              {oldPrice && (
                <span className="text-slate-400 font-bold line-through text-md font-mono">
                  {oldPrice.toLocaleString()} AED
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications / Notes</h4>
            {prod.description && (prod.description.includes('<') || prod.description.includes('&')) ? (
              <div 
                className="text-xs text-slate-600 leading-relaxed font-sans prose editor-content max-w-none prose-slate"
                dangerouslySetInnerHTML={{ __html: prod.description }}
              />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed font-sans pre-wrap whitespace-pre-wrap">
                {prod.description || 'No description available'}
              </p>
            )}
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
