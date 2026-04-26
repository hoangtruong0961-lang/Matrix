
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface RetryModalProps {
  isOpen: boolean;
  error: string;
  onCancel: () => void;
  onRetryOnce: () => void;
  onRetryInfinite: () => void;
}

export const RetryModal: React.FC<RetryModalProps> = ({ 
  isOpen, 
  error, 
  onCancel, 
  onRetryOnce, 
  onRetryInfinite 
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isOpen) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-[#0a0a0a] border border-rose-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.2)]"
        >
          <div className="p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6 relative">
              <span className="text-4xl">⚠️</span>
              <div className="absolute inset-0 border-2 border-rose-500/40 rounded-full animate-ping opacity-20"></div>
            </div>

            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter italic mb-4">
              Lỗi Kết Nối Ma Trận
            </h2>

            <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left mb-6 max-h-40 overflow-y-auto custom-scrollbar">
              <p className="text-[11px] font-bold text-rose-400/80 leading-relaxed italic">
                {error}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Đang tự động thử lại: {formatTime(seconds)}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest italic">
                Hệ thống đang nỗ lực kết nối lại với Ma Trận...
              </p>
            </div>

            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onRetryOnce}
                  className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black uppercase text-[10px] rounded-2xl hover:bg-emerald-500 hover:text-black transition-all active:scale-95 shadow-[0_10px_20px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Thử Lại Ngay
                </button>
                <button 
                  onClick={onRetryInfinite}
                  className="px-6 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase text-[10px] rounded-2xl hover:bg-indigo-500 hover:text-black transition-all active:scale-95 shadow-[0_10px_20px_rgba(99,102,241,0.1)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3 h-3" />
                  Tự Động Thử
                </button>
              </div>
              
              <button 
                onClick={onCancel}
                className="w-full px-6 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase text-[10px] rounded-2xl hover:bg-rose-500 hover:text-black transition-all active:scale-95 shadow-[0_10px_20px_rgba(244,63,94,0.1)]"
              >
                Dừng & Thoát
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
