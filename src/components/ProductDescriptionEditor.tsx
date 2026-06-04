import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductDescriptionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
}

const PRESET_COLORS = [
  '#000000', '#1e293b', '#475569', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#3b82f6', 
  '#a855f7', '#ec4899', '#ffffff'
];

const PRESET_HIGHLIGHTS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', 
  '#fbcfe8', '#fed7aa', '#ddd6fe', '#cbd5e1'
];

export default function ProductDescriptionEditor({ 
  isOpen, 
  onClose, 
  initialValue, 
  onSave 
}: ProductDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [activeFormatName, setActiveFormatName] = useState('Normal');
  const [isEmpty, setIsEmpty] = useState(true);

  const handleInput = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      const html = editorRef.current.innerHTML || '';
      const empty = text.trim() === '' && !html.includes('<img');
      setIsEmpty(empty);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const isValEmpty = !initialValue || initialValue.trim() === '' || initialValue.trim() === '<p><br></p>' || initialValue.trim() === '<p></p>';
      setIsEmpty(isValEmpty);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialValue || '';
          handleInput();
        }
      }, 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleFormatChange = (tag: string, displayName: string) => {
    setActiveFormatName(displayName);
    execCommand('formatBlock', tag);
    setShowFormatDropdown(false);
    handleInput();
  };

  const addLink = () => {
    const url = prompt('Enter link URL (e.g., https://example.com):', 'https://');
    if (url) {
      execCommand('createLink', url);
      handleInput();
    }
  };

  const addImage = () => {
    const url = prompt('Enter Image URL:', 'https://');
    if (url) {
      execCommand('insertImage', url);
      handleInput();
    }
  };

  const handleSave = () => {
    const finalContent = editorRef.current?.innerHTML || '';
    onSave(finalContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] font-sans">
      <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        
        {/* Modal Header exactly like the screenshot */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-205">
          <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">
            Edit Product Description
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        {/* Content & Toolbar Area */}
        <div className="p-5 flex-1 overflow-y-auto bg-white">
          <div className="border border-[#c5c8cc] rounded-md overflow-hidden flex flex-col">
            
            {/* Toolbar exactly matching image icons and structure */}
            <div className="bg-white border-b border-[#e2e4e6] p-3 flex flex-wrap items-center gap-x-4 gap-y-3 select-none text-[#5f6368]">
              
              {/* Dropdown with up-down carets exactly as the image */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormatDropdown(!showFormatDropdown);
                    setShowTextColor(false);
                    setShowHighlight(false);
                  }}
                  className="flex items-center gap-6 px-1 py-1.5 hover:bg-slate-100 rounded text-[16px] text-[#202124] font-medium min-w-[100px] justify-between transition-colors"
                >
                  <span>{activeFormatName}</span>
                  <div className="flex flex-col text-[#5f6368] scale-75 -space-y-1">
                    <ChevronUp className="w-3 h-3 stroke-[3]" />
                    <ChevronDown className="w-3 h-3 stroke-[3]" />
                  </div>
                </button>

                {showFormatDropdown && (
                  <div className="absolute top-10 left-0 z-[1200] w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-sm text-slate-700">
                    <button
                      type="button"
                      onClick={() => handleFormatChange('p', 'Normal')}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-150 ${activeFormatName === 'Normal' ? 'bg-amber-50 font-bold text-amber-900' : ''}`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange('h2', 'Heading L')}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-150 text-lg font-bold ${activeFormatName === 'Heading L' ? 'bg-amber-50 text-amber-900' : ''}`}
                    >
                      Heading L
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange('h3', 'Heading M')}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-150 text-base font-bold ${activeFormatName === 'Heading M' ? 'bg-amber-50 text-amber-900' : ''}`}
                    >
                      Heading M
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange('blockquote', 'Quote block')}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-150 italic ${activeFormatName === 'Quote block' ? 'bg-amber-50 text-amber-900' : ''}`}
                    >
                      Quote block
                    </button>
                  </div>
                )}
              </div>

              {/* Vertical line separator */}
              <div className="h-6 w-px bg-[#e2e4e6]" />

              {/* Bold Icon Styled identically */}
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Bold"
              >
                <span className="font-serif font-black text-xl text-[#3c4043] block select-none leading-none px-0.5">B</span>
              </button>

              {/* Italic Icon */}
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Italic"
              >
                <span className="font-serif italic font-bold text-xl text-[#3c4043] block select-none leading-none px-0.5">I</span>
              </button>

              {/* Underline Icon */}
              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Underline"
              >
                <span className="font-serif underline font-medium text-xl text-[#3c4043] block select-none leading-none px-0.5">U</span>
              </button>

              {/* Strikethrough Icon */}
              <button
                type="button"
                onClick={() => execCommand('strikeThrough')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Strikethrough"
              >
                <span className="font-serif line-through font-medium text-xl text-[#3c4043] block select-none leading-none px-0.5">S</span>
              </button>

              {/* Vertical line separator */}
              <div className="h-6 w-px bg-[#e2e4e6]" />

              {/* Ordered list icon */}
              <button
                type="button"
                onClick={() => execCommand('insertOrderedList')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Ordered List"
              >
                <svg className="w-5 h-5 text-[#3c4043]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="10" y1="6" x2="21" y2="6"></line>
                  <line x1="10" y1="12" x2="21" y2="12"></line>
                  <line x1="10" y1="18" x2="21" y2="18"></line>
                  <path d="M4 6h1v4"></path>
                  <path d="M4 10h2"></path>
                  <path d="M6 18H4c0-1 2-2 2-3a1 1 0 0 0-2 0"></path>
                </svg>
              </button>

              {/* Bulleted list icon */}
              <button
                type="button"
                onClick={() => execCommand('insertUnorderedList')}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Bulleted List"
              >
                <svg className="w-5 h-5 text-[#3c4043]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="9" y1="6" x2="20" y2="6"></line>
                  <line x1="9" y1="12" x2="20" y2="12"></line>
                  <line x1="9" y1="18" x2="20" y2="18"></line>
                  <circle cx="4" cy="12" r="1.5" fill="currentColor"></circle>
                  <circle cx="4" cy="6" r="1.5" fill="currentColor"></circle>
                  <circle cx="4" cy="18" r="1.5" fill="currentColor"></circle>
                </svg>
              </button>

              {/* Second Row/Inline Items from image */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Font Color Picker A */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTextColor(!showTextColor);
                      setShowHighlight(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded transition flex flex-col items-center justify-center relative"
                    title="Text Color"
                  >
                    <span className="text-lg font-bold text-[#3c4043] leading-none select-none">A</span>
                    <div className="w-4 h-1 bg-black mt-0.5 rounded-sm" />
                  </button>
                  {showTextColor && (
                    <div className="absolute top-10 left-0 z-[1200] bg-white p-2 rounded-lg shadow-xl border border-slate-200 grid grid-cols-4 gap-1.5 w-32">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            execCommand('foreColor', c);
                            setShowTextColor(false);
                          }}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition shrink-0"
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid Highlight Color Picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHighlight(!showHighlight);
                      setShowTextColor(false);
                    }}
                    className="p-1 hover:bg-slate-100 rounded transition flex flex-col items-center justify-center"
                    title="Highlight Background"
                  >
                    <div className="border border-dashed border-[#5f6368] p-0.5 rounded">
                      <span className="text-xs font-bold text-[#3c4043] select-none block leading-none">A</span>
                    </div>
                  </button>
                  {showHighlight && (
                    <div className="absolute top-10 left-0 z-[1200] bg-white p-2 rounded-lg shadow-xl border border-slate-200 grid grid-cols-4 gap-1.5 w-32">
                      {PRESET_HIGHLIGHTS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            execCommand('hiliteColor', c);
                            setShowHighlight(false);
                          }}
                          style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                          className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition shrink-0 flex items-center justify-center text-[9px] text-slate-500 font-semibold"
                          title={c}
                        >
                          {c === 'transparent' ? '🚫' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link Icon */}
                <button
                  type="button"
                  onClick={addLink}
                  className="p-1 hover:bg-slate-100 rounded transition"
                  title="Add Link"
                >
                  <svg className="w-5 h-5 text-[#3c4043]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </button>

                {/* Image Icon */}
                <button
                  type="button"
                  onClick={addImage}
                  className="p-1 hover:bg-slate-100 rounded transition"
                  title="Add Image"
                >
                  <svg className="w-5 h-5 text-[#3c4043]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </button>

                {/* Tx Icon (Format Eraser) styled like a bold letter T with x subscript */}
                <button
                  type="button"
                  onClick={() => execCommand('removeFormat')}
                  className="p-1 hover:bg-slate-100 rounded transition flex items-baseline select-none"
                  title="Clear Formatting"
                >
                  <span className="font-serif font-black text-lg text-[#3c4043] select-none block leading-none">T</span>
                  <span className="text-[10px] font-bold text-red-500 leading-none select-none relative -bottom-1 -left-0.5">x</span>
                </button>
              </div>

            </div>

            {/* Content editable viewport exactly matching layout in screenshot */}
            <div className="bg-white min-h-[140px] relative">
              <div
                ref={editorRef}
                onInput={handleInput}
                className="w-full min-h-[140px] p-4 text-[16px] text-[#202124] focus:outline-none overflow-y-auto prose editor-content max-w-none prose-slate prose-sm leading-relaxed"
                contentEditable
                style={{ minHeight: '140px' }}
              />
              
              {isEmpty && (
                <div 
                  onClick={() => editorRef.current?.focus()}
                  className="absolute top-4 left-4 text-[#757575] text-[16px] italic pointer-events-none select-none font-sans"
                >
                  Write your product description...
                </div>
              )}
              
              {/* Invisible trigger so click goes onto editable block */}
              <div 
                className="absolute inset-0 -z-10 cursor-text" 
                onClick={() => editorRef.current?.focus()}
              />
            </div>

          </div>
        </div>

        {/* Modal Action Buttons: Cancel (White BG with Border) & Save (Black block bg) */}
        <div className="py-4 px-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-[15px] font-medium text-[#3c4043] border border-[#dadce0] hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg text-[15px] font-medium bg-[#141517] text-white hover:bg-[#202124] transition-colors shadow-sm"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
