import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../types';
import { Download, Printer, CheckCircle, Clock, Loader } from 'lucide-react';
import BoxWithRays from './BoxWithRays';

interface OrderReceiptProps {
  order: Order;
  onClose: () => void;
}

export default function OrderReceipt({ order, onClose }: OrderReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;

    if (printContent) {
      // Simple preview target print styling
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Invoice - ${order.orderNumber}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                body { font-family: 'Anek Bangla', 'Inter', sans-serif; padding: 40px; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body onload="window.print();window.close()">
              ${printContent}
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const sanitizeColorsForPDF = (root: HTMLElement) => {
    const classMap: { [key: string]: { prop: string; value: string }[] } = {
      'bg-white': [{ prop: 'backgroundColor', value: '#ffffff' }],
      'bg-slate-50': [{ prop: 'backgroundColor', value: '#f8fafc' }],
      'bg-slate-50/50': [{ prop: 'backgroundColor', value: 'rgba(248, 250, 252, 0.5)' }],
      'bg-slate-50/30': [{ prop: 'backgroundColor', value: 'rgba(248, 250, 252, 0.3)' }],
      'text-slate-450': [{ prop: 'color', value: '#94a3b8' }],
      'text-slate-400': [{ prop: 'color', value: '#94a3b8' }],
      'text-slate-500': [{ prop: 'color', value: '#64748b' }],
      'text-slate-600': [{ prop: 'color', value: '#475569' }],
      'text-slate-650': [{ prop: 'color', value: '#384252' }],
      'text-slate-705': [{ prop: 'color', value: '#334155' }],
      'text-slate-700': [{ prop: 'color', value: '#334155' }],
      'text-slate-800': [{ prop: 'color', value: '#1e293b' }],
      'text-slate-850': [{ prop: 'color', value: '#111827' }],
      'text-slate-900': [{ prop: 'color', value: '#0f172a' }],
      'text-[#c25927]': [{ prop: 'color', value: '#c25927' }],
      'border-slate-100': [
        { prop: 'borderColor', value: '#f1f5f9' },
        { prop: 'borderTopColor', value: '#f1f5f9' },
        { prop: 'borderBottomColor', value: '#f1f5f9' },
        { prop: 'borderLeftColor', value: '#f1f5f9' },
        { prop: 'borderRightColor', value: '#f1f5f9' }
      ],
      'border-slate-200': [
        { prop: 'borderColor', value: '#e2e8f0' },
        { prop: 'borderTopColor', value: '#e2e8f0' },
        { prop: 'borderBottomColor', value: '#e2e8f0' },
        { prop: 'borderLeftColor', value: '#e2e8f0' },
        { prop: 'borderRightColor', value: '#e2e8f0' }
      ],
      'divide-slate-100': [
        { prop: 'borderColor', value: '#f1f5f9' }
      ]
    };

    const traverse = (node: Element) => {
      if (node instanceof HTMLElement) {
        // 1. Class list mapping for absolute override
        node.classList.forEach(className => {
          if (classMap[className]) {
            classMap[className].forEach(({ prop, value }) => {
              node.style[prop as any] = value;
            });
          }
        });

        // 2. Query computed style to catch anything else that contains oklch/oklab
        try {
          const computed = window.getComputedStyle(node);
          const colorProps = [
            'color', 
            'backgroundColor', 
            'borderColor', 
            'borderTopColor', 
            'borderBottomColor', 
            'borderLeftColor', 
            'borderRightColor'
          ];
          
          colorProps.forEach(prop => {
            const val = computed[prop as any] as string;
            if (val && (val.includes('oklab') || val.includes('oklch') || val.includes('color('))) {
              // Apply fallback simple solid color depending on property
              if (prop === 'backgroundColor') {
                node.style.backgroundColor = '#ffffff';
              } else if (prop.startsWith('border')) {
                node.style[prop as any] = '#f1f5f9';
              } else {
                node.style.color = '#1e293b';
              }
            }
          });
        } catch (e) {
          // ignore error in non-visible browsers
        }
      }

      Array.from(node.children).forEach(child => traverse(child));
    };

    traverse(root);
  };

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    setIsDownloading(true);
    try {
      // Create off-screen clone with precise printable width to avoid scrolling/viewport cut-offs
      const clone = element.cloneNode(true) as HTMLDivElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = '640px'; 
      clone.style.height = 'auto';
      clone.style.padding = '32px';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      // Clean oklab / oklch modern styles before html2canvas parses color properties
      sanitizeColorsForPDF(clone);

      const canvas = await html2canvas(clone, {
        scale: 2, // crisp quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice_RK_Furniture_${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      // Fallback
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[94vh] sm:h-auto sm:max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col">
        {/* Actions bar */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">Order Invoice</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1 bg-[#15803d] hover:bg-emerald-800 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-75 cursor-pointer whitespace-nowrap"
            >
              {isDownloading ? (
                <>
                  <Loader className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-850 font-bold px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice document content */}
        <div ref={printRef} className="p-4 sm:p-8 overflow-y-auto flex-1 font-sans bg-white">
          {/* Top Info block (Sender / Summary metadata) */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 text-left text-xs text-slate-700 leading-relaxed shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-2 font-sans">RK Furniture</h2>
              <div className="space-y-1 text-slate-600">
                <p><span className="font-semibold text-slate-400">Address:</span> </p>
                <p><span className="font-semibold text-slate-400">Email:</span> N/A</p>
                <p><span className="font-semibold text-slate-400">Mobile number:</span> 01715838191</p>
              </div>
            </div>
            <div className="sm:text-right space-y-1 text-slate-650 sm:self-start">
              <p><span className="text-slate-400 font-semibold">Payment Status:</span> <span className="font-bold text-slate-800">{order.status === 'completed' || order.status === 'delivered' ? 'Paid' : 'Unpaid'}</span></p>
              <p><span className="text-slate-400 font-semibold">Payment Type:</span> <span className="font-bold text-slate-800">{order.paymentMethod ? order.paymentMethod.toUpperCase() : 'CASH ON DELIVERY'}</span></p>
              <p><span className="text-slate-400 font-semibold">Order ID:</span> <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span></p>
              <p><span className="text-slate-400 font-semibold">Order Date:</span> <span className="font-bold text-slate-800">{order.date.split(' at ')[0] || order.date}</span></p>
            </div>
          </div>

          {/* Bill To block */}
          <div className="border border-slate-100 p-5 rounded-2xl text-left text-xs bg-white mb-4 shadow-sm leading-relaxed">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill to:</p>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1">{order.customerName}</h3>
            <p className="text-slate-700 mb-1 leading-relaxed font-sans">{order.deliveryAddress}</p>
            <div className="space-y-0.5 text-slate-600 mt-2">
              <p><span className="font-semibold text-slate-400">Email:</span> N/A</p>
              <p><span className="font-semibold text-slate-400">Mobile number:</span> <span className="font-mono">{order.customerMobile}</span></p>
            </div>
          </div>

          {/* Ordered Products Section */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden mb-4 shadow-sm text-xs bg-white text-left">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Product Name</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Delivery Type</th>
                  <th className="py-3 px-1.5 text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Qty</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Unit Price</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.products.map(({ product, quantity }) => (
                  <tr key={product.id} className="text-slate-700 hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{product.name}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-1.5 text-center font-bold text-slate-850">{quantity}</td>
                    <td className="py-3.5 px-4 text-center font-mono">AED {product.price.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">AED {(product.price * quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-2">
            <div className="border border-slate-100 rounded-2xl p-4 w-full max-w-xs text-xs space-y-2 bg-slate-50/30 text-left shadow-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sub Total</span>
                <span className="font-mono font-bold text-slate-850">AED {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service Charge</span>
                <span className="font-mono text-slate-700">AED 0</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Cost</span>
                <span className="font-mono font-bold text-slate-850">AED {order.shippingCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-dashed border-slate-200 pt-2">
                <span>Grand Total</span>
                <span className="font-mono font-black text-[#c25927]">AED {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
