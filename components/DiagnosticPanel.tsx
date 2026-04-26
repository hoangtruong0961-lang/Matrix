
import React, { useState, useMemo, useEffect } from 'react';
import { GameLog, AppSettings, Player } from '../types';
import { AlertCircle, ChevronRight, Info, Wrench, Zap, X, ShieldAlert, Activity, Cpu, Terminal as TerminalIcon, RefreshCw, Maximize2, Minimize2, Database, Trash2 } from 'lucide-react';

interface DiagnosticPanelProps {
  logs: GameLog[];
  isMobile?: boolean;
  settings?: AppSettings;
  player?: Player;
  isOpen?: boolean;
  onClose?: () => void;
  proxyStreams?: { proxy1: string; proxy2: string };
  onResetProxyStreams?: () => void;
}

interface DiagnosticResult {
  type: string;
  cause: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  rawContent: string;
  source?: 'system' | 'console';
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ 
  logs, 
  isMobile, 
  settings, 
  player, 
  isOpen: externalIsOpen, 
  onClose, 
  proxyStreams,
  onResetProxyStreams 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsExpanded = onClose || setInternalIsOpen;

  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(Date.now());
  const [hasNewError, setHasNewError] = useState(false);
  const [consoleErrors, setConsoleErrors] = useState<DiagnosticResult[]>([]);

  // Intercept console errors and warnings
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      setConsoleErrors(prev => [...prev.slice(-19), {
        type: 'CONSOLE_ERROR',
        cause: 'Phát hiện lỗi từ trình duyệt (Browser Console Error).',
        solution: 'Kiểm tra log chi tiết bên dưới hoặc liên hệ kỹ thuật nếu lỗi lặp lại.',
        severity: 'high',
        timestamp: Date.now(),
        rawContent: message,
        source: 'console'
      }]);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      setConsoleErrors(prev => [...prev.slice(-19), {
        type: 'CONSOLE_WARNING',
        cause: 'Phát hiện cảnh báo từ trình duyệt (Browser Console Warning).',
        solution: 'Cảnh báo này thường không ảnh hưởng trực tiếp, nhưng nên lưu ý nếu hiệu năng giảm.',
        severity: 'medium',
        timestamp: Date.now(),
        rawContent: message,
        source: 'console'
      }]);
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const diagnostics = useMemo(() => {
    const errorLogs = logs.filter(log => log.type === 'error');
    const systemDiagnostics = errorLogs.slice(-10).map(log => {
      const content = (log.content || '').toLowerCase();
      let result: {
        type: string;
        cause: string;
        solution: string;
        severity: 'low' | 'medium' | 'high';
      } = {
        type: 'LỖI HỆ THỐNG KHÔNG XÁC ĐỊNH',
        cause: 'Mất đồng bộ trong dòng thời gian hoặc lỗi kết nối máy chủ không xác định.',
        solution: 'Thử lại hành động hoặc tải lại trang (F5).',
        severity: 'medium'
      };

      if (content.includes('api key') || content.includes('invalid')) {
        result = {
          type: 'LỖI XÁC THỰC MA TRẬN (API AUTH ERROR)',
          cause: 'Khóa API (API Key) không hợp lệ, đã hết hạn hoặc bị thu hồi.',
          solution: 'Vào Cài đặt (Settings) -> Kiểm tra lại danh sách API Key. Đảm bảo khóa đang hoạt động trên Google AI Studio.',
          severity: 'high'
        };
      } else if (content.includes('quota') || content.includes('rate limit')) {
        result = {
          type: 'HẾT HẠN MỨC TRUY XUẤT (QUOTA EXCEEDED)',
          cause: 'Tần suất gửi yêu cầu quá nhanh hoặc đã dùng hết hạn mức miễn phí của mô hình.',
          solution: 'Tạm dừng thao tác trong 60 giây. Nếu vẫn lỗi, hãy thêm nhiều API Key khác để hệ thống tự động luân chuyển.',
          severity: 'medium'
        };
      } else if (content.includes('safety') || content.includes('blocked')) {
        result = {
          type: 'BỘ LỌC AN TOÀN KÍCH HOẠT (SAFETY FILTER)',
          cause: 'Hành động hoặc lời dẫn truyện vi phạm chính sách nội dung (Bạo lực, Nhạy cảm quá mức...).',
          solution: 'Thay đổi cách diễn đạt hành động. Tránh các từ ngữ quá trực diện hoặc thô tục. Thử một hướng tiếp cận khác.',
          severity: 'medium'
        };
      } else if (content.includes('phân tích dữ liệu') || content.includes('json') || content.includes('parse_error')) {
        result = {
          type: 'LỖI CẤU TRÚC LƯỢNG TỬ (DATA PARSE ERROR)',
          cause: 'AI phản hồi dữ liệu bị lỗi cấu trúc JSON hoặc bị ngắt quãng giữa chừng.',
          solution: 'Nhấn F5 (Refresh) trình duyệt để đồng bộ lại thực tại. Nếu lặp lại, hãy thử "Tải Lại" (Retry) hành động trong khung chat.',
          severity: 'low'
        };
      } else if (content.includes('proxy')) {
        result = {
          type: 'LỖI MÁY CHỦ TRUNG GIAN (PROXY ERROR)',
          cause: 'Không thể kết nối tới Proxy hoặc Proxy Key/URL không hợp lệ.',
          solution: 'Kiểm tra lại cấu hình Proxy trong phần Cài đặt. Đảm bảo máy chủ Proxy đang hoạt động.',
          severity: 'high'
        };
      } else if (content.includes('network') || content.includes('fetch') || content.includes('kết nối') || content.includes('failed to fetch')) {
        result = {
          type: 'MẤT KẾT NỐI THỰC TẠI (NETWORK ERROR)',
          cause: 'Đường truyền internet không ổn định hoặc máy chủ Gemini không phản hồi.',
          solution: 'Kiểm tra kết nối mạng của bạn. Nhấn "Retry" để gửi lại yêu cầu.',
          severity: 'high'
        };
      }

      return { ...result, timestamp: log.timestamp, rawContent: log.content, source: 'system' as const };
    });

    // Merge system diagnostics with console errors
    const all = [...systemDiagnostics, ...consoleErrors].sort((a, b) => a.timestamp - b.timestamp);
    return all.slice(-20); // Keep last 20 total
  }, [logs, consoleErrors]);

  useEffect(() => {
    const latestError = diagnostics[diagnostics.length - 1];
    if (latestError && latestError.timestamp > lastSeenTimestamp) {
      setHasNewError(true);
    }
  }, [diagnostics, lastSeenTimestamp]);

  const handleOpen = () => {
    setIsExpanded(true);
    setHasNewError(false);
    if (diagnostics.length > 0) {
      setLastSeenTimestamp(diagnostics[diagnostics.length - 1].timestamp);
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="DiagnosticPanel fixed right-0 top-0 bottom-0 z-[1000] w-full md:w-[450px] bg-neutral-950/95 border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden font-mono shadow-2xl backdrop-blur-md">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      {/* Header */}
      <div className="h-14 border-b border-white/10 bg-neutral-900/80 backdrop-blur-xl flex items-center justify-between px-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest italic">Chẩn Đoán Ma Trận</h2>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Errors: {diagnostics.length}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(false)}
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg border border-white/10 transition-all"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content - Simplified and Condensed */}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10 p-4 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-neutral-900/50 border border-white/5 rounded-xl">
            <h4 className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Mô hình</h4>
            <p className="text-[10px] text-white font-black truncate">
              {(settings?.proxyUrl && settings?.proxyKey && settings?.proxyModel) ? settings.proxyModel : (settings?.aiModel || 'Unknown')}
            </p>
          </div>
          <div className="p-3 bg-neutral-900/50 border border-white/5 rounded-xl">
            <h4 className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Token</h4>
            <p className="text-[10px] text-white font-black">
              {player?.tokenUsage?.latest?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Diagnostic List */}
        <div className="space-y-4">
          {/* RAW PROXY STREAMS */}
          {(settings?.dualProxyEnabled || (proxyStreams?.proxy1 || proxyStreams?.proxy2)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-cyan-500" />
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Luồng Dữ Liệu Dual Proxy</span>
                </div>
                <div className="flex items-center gap-2">
                  {onResetProxyStreams && (
                    <button 
                      onClick={onResetProxyStreams}
                      className="p-1 hover:bg-white/10 rounded transition-colors group"
                      title="Xóa bộ đệm stream"
                    >
                      <Trash2 className="w-3 h-3 text-neutral-500 group-hover:text-rose-500" />
                    </button>
                  )}
                  {!settings?.dualProxyEnabled && (
                    <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase">Legacy Data</span>
                  )}
                  <div className="h-px w-12 bg-white/5"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Proxy 1: Writing AI</span>
                    <span className="text-[7px] text-neutral-600 uppercase italic">Narrative & Guidance</span>
                  </div>
                  <div className="bg-black/60 rounded-xl border border-white/5 p-3 font-mono text-[9px] text-neutral-400 h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {proxyStreams?.proxy1 || (settings?.dualProxyEnabled ? "Đang chờ dữ liệu từ Proxy 1..." : "Không có dữ liệu")}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[8px] font-black text-blue-500 uppercase">Proxy 2: Variable AI</span>
                    <span className="text-[7px] text-neutral-600 uppercase italic">Data Extraction (JSON)</span>
                  </div>
                  <div className="bg-black/60 rounded-xl border border-white/5 p-3 font-mono text-[9px] text-neutral-400 h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {proxyStreams?.proxy2 || (settings?.dualProxyEnabled ? "Đang chờ dữ liệu từ Proxy 2..." : "Không có dữ liệu")}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <TerminalIcon className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Nhật ký chẩn đoán</span>
            <div className="h-px flex-grow bg-white/5"></div>
          </div>

          {diagnostics.length > 0 ? (
            diagnostics.slice().reverse().map((diag, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  diag.severity === 'high' 
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : diag.severity === 'medium'
                    ? 'bg-orange-500/5 border-orange-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                      diag.source === 'console' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {diag.source === 'console' ? 'CONSOLE' : 'SYSTEM'}
                    </span>
                    <span className="text-[10px] font-black text-white uppercase truncate max-w-[200px]">{diag.type}</span>
                  </div>
                  <span className="text-[8px] text-neutral-600 font-bold">{new Date(diag.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] text-neutral-400 leading-relaxed italic">"{diag.cause}"</p>
                  <p className="text-[9px] text-emerald-400 font-bold">Fix: {diag.solution}</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="bg-black/40 rounded-lg p-2 font-mono text-[8px] text-neutral-500 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                    {diag.rawContent}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center opacity-20 text-center">
              <Zap className="w-8 h-8 mb-3 text-emerald-500" />
              <p className="text-[9px] font-black uppercase tracking-widest">Hệ thống ổn định</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 border-t border-white/10 bg-neutral-900/50 flex items-center justify-center px-4 shrink-0">
        <span className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.3em]">MATRIX_V4_DIAGNOSTICS_ACTIVE</span>
      </div>
    </div>
  );
};
