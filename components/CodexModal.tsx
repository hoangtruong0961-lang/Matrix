import React, { useState, useMemo } from 'react';
import { Player, CodexEntry, Relationship, getGenreMeta, AppSettings, GameGenre, IdentityType, LorebookGlobalSettings, LorebookTemporalStatus, WorldInfoBook, WorldInfoEntry, WorldInfoPlacement, WorldInfoLogic } from '../types';
import { 
  MapPin,
  Globe, 
  ScrollText, 
  History as HistoryIcon, 
  Users, 
  Search, 
  X, 
  ChevronRight, 
  BookOpen,
  Lock,
  Unlock,
  User,
  Heart,
  Shield,
  Zap,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  GitBranch,
  Network,
  Library,
  BookMarked,
  FileJson, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle,
  FileSearch,
  Power,
  ToggleLeft,
  ToggleRight,
  Settings
} from 'lucide-react';
import { NpcSocialColumn } from './NpcProfileBase';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MobileCodexModal } from './Mobile/MobileCodexModal';
import { lorebookService } from '../services/lorebookService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  player: Player;
  genre?: GameGenre;
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  markAsViewed: (id: string, type: 'codex' | 'npc') => void;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<Player>>;
}

type TabType = 'world' | 'rules' | 'locations' | 'entities' | 'npcs' | 'story' | 'lorebook';

const LorebookSettingsView: React.FC<{
  settings: LorebookGlobalSettings;
  onUpdate: (settings: LorebookGlobalSettings) => void;
  onClose: () => void;
}> = ({ settings, onUpdate, onClose }) => {
  const handleChange = (field: keyof LorebookGlobalSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Cấu Hình Lorebook</h2>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-2">Điều chỉnh thuật toán quét và chèn dữ liệu thế giới</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
          <X className="w-6 h-6 text-neutral-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-10">
          <section className="space-y-6">
            <h3 className="text-sm font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Search className="w-4 h-4" /> Quét Văn Bản
            </h3>
            <div className="space-y-4">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-white uppercase">Độ sâu quét (Lượt)</label>
                    <p className="text-[10px] text-neutral-500 mt-1">Số lượt hội thoại gần nhất để kiểm tra từ khóa</p>
                  </div>
                  <input 
                    type="number" 
                    value={settings.scanDepth} 
                    onChange={(e) => handleChange('scanDepth', parseInt(e.target.value))}
                    className="w-20 bg-black border border-white/20 rounded-xl px-3 py-2 text-center text-sm font-bold text-purple-400"
                  />
                </div>
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange('includeNames', !settings.includeNames)}>
                  <div>
                    <label className="text-xs font-black text-white uppercase group-hover:text-purple-400 transition-colors">Bao gồm tên nhân vật</label>
                    <p className="text-[10px] text-neutral-500 mt-1">Quét cả tên các nhân vật đang hiện diện</p>
                  </div>
                  {settings.includeNames ? <ToggleRight className="w-8 h-8 text-purple-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Nguồn đối khớp bổ sung</h4>
                {[
                  { id: 'scanNpcDescription', label: 'Mô tả nhân vật', desc: 'Đối khớp với mô tả của NPC hiện tại' },
                  { id: 'scanNpcPersonality', label: 'Tính cách nhân vật', desc: 'Đối khớp với tính cách của NPC hiện tại' },
                  { id: 'scanScenario', label: 'Bối cảnh (Scenario)', desc: 'Đối khớp với mô tả kịch bản/thế giới' },
                  { id: 'scanNpcNotes', label: 'Ghi chú nhân vật', desc: 'Đối khớp với ghi chú riêng của NPC' },
                  { id: 'scanCreatorNotes', label: 'Ghi chú tác giả', desc: 'Đối khớp với Creator Notes' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange(item.id as any, !settings[item.id as keyof LorebookGlobalSettings])}>
                    <div>
                      <label className="text-xs font-black text-white uppercase group-hover:text-purple-400 transition-colors">{item.label}</label>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</p>
                    </div>
                    {settings[item.id as keyof LorebookGlobalSettings] ? <ToggleRight className="w-8 h-8 text-purple-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Zap className="w-4 h-4" /> Kích Hoạt & Ngân Sách
            </h3>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-white uppercase">Ngân sách Token</label>
                  <p className="text-[10px] text-neutral-500 mt-1">Giới hạn tổng số tokens được chèn vào bối cảnh</p>
                </div>
                <input 
                  type="number" 
                  value={settings.tokenBudget} 
                  onChange={(e) => handleChange('tokenBudget', parseInt(e.target.value))}
                  className="w-24 bg-black border border-white/20 rounded-xl px-3 py-2 text-center text-sm font-bold text-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange('recursiveScanning', !settings.recursiveScanning)}>
                <div>
                  <label className="text-xs font-black text-white uppercase group-hover:text-emerald-400 transition-colors">Quét đệ quy</label>
                  <p className="text-[10px] text-neutral-500 mt-1">Quét từ khóa bên trong các mục Lorebook đã kích hoạt</p>
                </div>
                {settings.recursiveScanning ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
              </div>
              {settings.recursiveScanning && (
                <div className="flex items-center justify-between pl-6 border-l border-emerald-500/20">
                  <div>
                    <label className="text-[10px] font-black text-neutral-400 uppercase">Số bước đệ quy tối đa</label>
                  </div>
                  <input 
                    type="number" 
                    value={settings.maxRecursionSteps || 3} 
                    onChange={(e) => handleChange('maxRecursionSteps', parseInt(e.target.value))}
                    className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1 text-center text-[10px] font-bold text-emerald-400"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="space-y-6">
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Network className="w-4 h-4" /> Đối Khớp Vector (Semantic)
            </h3>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange('vectorEnabled', !settings.vectorEnabled)}>
                <div>
                  <label className="text-xs font-black text-white uppercase group-hover:text-rose-400 transition-colors">Kích hoạt Vector</label>
                  <p className="text-[10px] text-neutral-500 mt-1">Sử dụng AI Embeddings để đối khớp theo ý nghĩa</p>
                </div>
                {settings.vectorEnabled ? <ToggleRight className="w-8 h-8 text-rose-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Ngưỡng tương đồng: {settings.vectorThreshold}</label>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.0" 
                  step="0.01"
                  value={settings.vectorThreshold} 
                  onChange={(e) => handleChange('vectorThreshold', parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                  disabled={!settings.vectorEnabled}
                />
                <div className="flex justify-between text-[8px] mono text-neutral-700 font-bold uppercase tracking-widest">
                  <span>Rộng (Ít liên quan)</span>
                  <span>Hẹp (Rất chính xác)</span>
                </div>
              </div>
              
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl italic text-[10px] text-neutral-500 leading-relaxed">
                * Lưu ý: Đối khớp Vector yêu cầu Gemini API Key và có thể phát sinh thêm chi phí tokens (rất nhỏ) cho mỗi lượt quét. Các mục Lorebook cần được "Vector hóa" trước khi có thể sử dụng tính năng này.
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" /> Quy Tắc Từ Khóa
            </h3>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange('caseSensitive', !settings.caseSensitive)}>
                <div>
                  <label className="text-xs font-black text-white uppercase group-hover:text-neutral-300 transition-colors">Phân biệt hoa/thường (Toàn cục)</label>
                  <p className="text-[10px] text-neutral-500 mt-1">Ưu tiên cấu hình riêng của từng mục nếu có</p>
                </div>
                {settings.caseSensitive ? <ToggleRight className="w-8 h-8 text-white" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
              </div>
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => handleChange('matchWholeWords', !settings.matchWholeWords)}>
                <div>
                  <label className="text-xs font-black text-white uppercase group-hover:text-neutral-300 transition-colors">Khớp nguyên từ</label>
                  <p className="text-[10px] text-neutral-500 mt-1">Không kích hoạt nếu từ khóa là một phần của từ khác</p>
                </div>
                {settings.matchWholeWords ? <ToggleRight className="w-8 h-8 text-white" /> : <ToggleLeft className="w-8 h-8 text-neutral-700" />}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const CodexModal: React.FC<Props> = ({ player, genre, isOpen, onClose, settings, markAsViewed, onUpdatePlayer }) => {
  const [activeTab, setActiveTab] = useState<TabType>('world');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showLorebookSettings, setShowLorebookSettings] = useState(false);

  const safeCodex = player.codex || [];
  const safeRelationships = player.relationships || [];

  const worldLabel = useMemo(() => {
    if (!genre) return "Thế giới";
    if (genre === GameGenre.FREE_STYLE) return "Tự Do";
    return genre;
  }, [genre]);

  // Filtered items based on active tab and search query
  const filteredItems = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();
    
    if (activeTab === 'npcs') {
      return safeRelationships
        .filter(npc => (npc.name || '').toLowerCase().includes(query))
        .map(npc => ({
          id: npc.id,
          title: npc.name || 'Vô danh',
          subtitle: (npc.affinity || 0) >= 600 ? 'Hậu cung' : 'Xã hội',
          type: 'npc' as const,
          viewed: npc.viewed ?? true,
          data: npc
        }));
    } else if (activeTab === 'story') {
      return (player.storyNodes || [])
        .filter(node => (node.title || '').toLowerCase().includes(query) || (node.content || '').toLowerCase().includes(query))
        .map(node => ({
          id: node.id,
          title: node.title,
          subtitle: node.type === 'main' ? 'Chính tuyến' : node.type === 'branch' ? 'Nhánh' : 'Sự kiện',
          type: 'story' as const,
          viewed: true,
          data: node
        }));
    } else if (activeTab === 'lorebook') {
      return (player.worldInfoBooks || [])
        .filter(book => (book.name || '').toLowerCase().includes(query))
        .map(book => ({
          id: book.id,
          title: book.name,
          subtitle: `${book.entries.length} mục`,
          type: 'lorebook' as const,
          viewed: true,
          data: book
        }));
    } else {
      return safeCodex
        .filter(entry => {
          return entry.category === activeTab;
        })
        .filter(entry => (entry.title || '').toLowerCase().includes(query) || (entry.content || '').toLowerCase().includes(query))
        .map(entry => ({
          id: entry.title || 'Không tiêu đề', // Using title as ID if no ID exists
          title: entry.title || 'Không tiêu đề',
          subtitle: entry.unlocked ? 'Đã giải mã' : 'Bị khóa',
          type: 'codex' as const,
          viewed: entry.viewed ?? true,
          data: entry
        }));
    }
  }, [activeTab, searchQuery, safeCodex, safeRelationships]);

  const selectedItem = useMemo(() => {
    if (!selectedEntryId) return null;
    return filteredItems.find(item => item.id === selectedEntryId);
  }, [selectedEntryId, filteredItems]);

  const handleToggleRule = (title: string) => {
    const updatedCodex = player.codex.map(entry => {
      if (entry.title === title && entry.category === 'rules') {
        return { ...entry, isActive: entry.isActive === false ? true : false };
      }
      return entry;
    });
    onUpdatePlayer({ ...player, codex: updatedCodex });
  };

  const handleDeleteEntry = (id: string, type: 'codex' | 'story') => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    
    if (type === 'story') {
      const updatedStoryNodes = (player.storyNodes || []).filter(node => node.id !== id);
      onUpdatePlayer({ ...player, storyNodes: updatedStoryNodes });
    } else {
      const updatedCodex = player.codex.filter(entry => !(entry.title === id && entry.category === activeTab));
      onUpdatePlayer({ ...player, codex: updatedCodex });
    }
    setSelectedEntryId(null);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'story') {
      const updatedStoryNodes = (player.storyNodes || []).map(node => {
        if (node.id === selectedItem.id) {
          return { ...node, title: editTitle, content: editContent };
        }
        return node;
      });
      onUpdatePlayer({ ...player, storyNodes: updatedStoryNodes });
      setIsEditing(false);
    } else if (selectedItem.type === 'codex') {
      const updatedCodex = player.codex.map(entry => {
        if (entry.title === selectedItem.id && entry.category === activeTab) {
          return { ...entry, title: editTitle, content: editContent };
        }
        return entry;
      });
      onUpdatePlayer({ ...player, codex: updatedCodex });
      setIsEditing(false);
      setSelectedEntryId(editTitle);
    }
  };

  const handleAddRule = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    const newEntry: CodexEntry = {
      category: 'rules',
      title: editTitle,
      content: editContent,
      unlocked: true,
      viewed: true,
      isActive: true
    };
    onUpdatePlayer({ ...player, codex: [...player.codex, newEntry] });
    setIsAdding(false);
    setEditTitle('');
    setEditContent('');
    setSelectedEntryId(newEntry.title);
  };

  const handleImportLorebook = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const book = lorebookService.importSillyTavern(content);
          if (book) {
            const currentBooks = player.worldInfoBooks || [];
            onUpdatePlayer({
              ...player,
              worldInfoBooks: [...currentBooks, book],
              activeLorebookIds: [...(player.activeLorebookIds || []), book.id]
            });
            setSelectedEntryId(book.id);
          } else {
            alert('Không thể nhập World Info. Vui lòng kiểm tra định dạng file.');
          }
        };
        reader.readAsText(file);
      } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
        const book = await lorebookService.importSillyTavernPng(file);
        if (book) {
          const currentBooks = player.worldInfoBooks || [];
          onUpdatePlayer({
            ...player,
            worldInfoBooks: [...currentBooks, book],
            activeLorebookIds: [...(player.activeLorebookIds || []), book.id]
          });
          setSelectedEntryId(book.id);
        } else {
          alert('Không tìm thấy dữ liệu World Info trong file PNG này.');
        }
      }
    };
    input.click();
  };

  const toggleLorebookActive = (bookId: string) => {
    const activeIds = player.activeLorebookIds || [];
    const newActiveIds = activeIds.includes(bookId)
      ? activeIds.filter(id => id !== bookId)
      : [...activeIds, bookId];
    onUpdatePlayer({ ...player, activeLorebookIds: newActiveIds });
  };

  const updateLorebook = (updatedBook: WorldInfoBook) => {
    onUpdatePlayer(prev => ({ 
      ...prev, 
      worldInfoBooks: (prev.worldInfoBooks || []).map(b => b.id === updatedBook.id ? updatedBook : b) 
    }));
  };

  const deleteLorebook = (bookId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Lorebook này?')) return;
    onUpdatePlayer(prev => ({ 
      ...prev, 
      worldInfoBooks: (prev.worldInfoBooks || []).filter(b => b.id !== bookId), 
      activeLorebookIds: (prev.activeLorebookIds || []).filter(id => id !== bookId) 
    }));
    setSelectedEntryId(null);
  };

  if (settings.mobileMode && isOpen) {
    return <MobileCodexModal player={player} genre={genre} onClose={onClose} markAsViewed={markAsViewed} settings={settings} onUpdatePlayer={onUpdatePlayer} />;
  }

  if (!isOpen) return null;

  const genreMeta = getGenreMeta(genre);
  
  const labels = genreMeta.codexLabels || {
    world: "Thế giới",
    locations: "Địa danh",
    history: "Biên niên sử",
    entities: "Kỳ trân",
    npcs: "Nhân vật"
  };

  const categories = [
    { id: 'world' as TabType, label: worldLabel, icon: Globe },
    { id: 'rules' as TabType, label: "Luật Lệ", icon: ScrollText },
    { id: 'story' as TabType, label: "Cốt Truyện", icon: GitBranch },
    { id: 'npcs' as TabType, label: labels.npcs, icon: Users },
    { id: 'lorebook' as TabType, label: "World Info", icon: BookMarked },
  ];

  return (
    <div 
      className="CodexModal fixed inset-0 z-[500] bg-neutral-950 flex animate-in fade-in duration-300 overflow-hidden"
      style={{ 
        fontFamily: settings.fontFamily || 'Inter',
        fontSize: `${settings.fontSize || 16}px`
      }}
    >
      {/* Left Rail: Main Categories */}
      <div className="w-20 border-r border-white/5 bg-neutral-900/50 flex flex-col items-center py-8 gap-6 shrink-0">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-neutral-500 hover:text-white hover:bg-red-500/10 transition-all mb-4"
          title="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-12 h-px bg-white/5 mb-4"></div>
        
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveTab(cat.id);
              setSelectedEntryId(null);
            }}
            className={cn(
              "group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              activeTab === cat.id 
                ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
                : "text-neutral-500 hover:text-white hover:bg-white/5"
            )}
            title={cat.label}
          >
            <cat.icon className="w-5 h-5" />
            {activeTab === cat.id && (
              <div className="absolute left-full ml-4 px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md whitespace-nowrap z-10 pointer-events-none">
                {cat.label}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Middle Pane: List of Items */}
      <div className="w-80 md:w-96 border-r border-white/5 bg-neutral-900/20 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
              {categories.find(c => c.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-2">
              {activeTab === 'rules' && (
                <button 
                  onClick={() => {
                    setIsAdding(true);
                    setEditTitle('');
                    setEditContent('');
                    setSelectedEntryId(null);
                  }}
                  className="h-9 px-3 rounded-xl bg-amber-500 text-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  title="Thêm quy tắc mới"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Thêm mới</span>
                </button>
              )}
              {activeTab === 'lorebook' && (
                <button 
                  onClick={handleImportLorebook}
                  className="h-9 px-3 rounded-xl bg-purple-500 text-white flex items-center gap-2 hover:bg-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  title="Nhập Lorebook (SillyTavern JSON)"
                >
                  <FileJson className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nhập ST</span>
                </button>
              )}
              {activeTab === 'lorebook' && (
                <button 
                  onClick={() => setShowLorebookSettings(!showLorebookSettings)}
                  className={cn(
                    "h-9 px-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)]",
                    showLorebookSettings ? "bg-amber-500 text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10"
                  )}
                  title="Cấu hình hệ thống Lorebook"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cấu hình</span>
                </button>
              )}
              <div className="flex flex-col items-end">
                <span className="text-[10px] mono font-black text-neutral-600 bg-white/5 px-2 py-0.5 rounded">
                  {filteredItems.length} MỤC
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input 
              type="text"
              placeholder="Tìm kiếm dữ liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <button
                key={`${item.type}-${item.id}-${idx}`}
                onClick={() => {
                  setSelectedEntryId(item.id);
                  markAsViewed(item.id, item.type);
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all group flex items-center gap-4 border relative",
                  selectedEntryId === item.id
                    ? "bg-amber-500/10 border-amber-500/30 shadow-lg"
                    : "bg-transparent border-transparent hover:bg-white/5"
                )}
              >
                {!item.viewed && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  selectedEntryId === item.id ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-500 group-hover:text-white"
                )}>
                  {item.type === 'npc' ? <User className="w-5 h-5" /> : item.type === 'story' ? <GitBranch className="w-5 h-5" /> : item.type === 'matrix' ? <Network className="w-5 h-5" /> : <ScrollText className="w-5 h-5" />}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className={cn(
                    "text-xs font-black uppercase tracking-tight truncate",
                    selectedEntryId === item.id ? "text-amber-500" : "text-neutral-300 group-hover:text-white"
                  )}>
                    {item.title}
                  </h4>
                  <p className="text-[9px] mono font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                {item.type === 'lorebook' && (
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      (player.activeLorebookIds || []).includes(item.id) ? "bg-emerald-500" : "bg-neutral-800"
                    )}></div>
                  </div>
                )}
                <ChevronRight className={cn(
                  "w-4 h-4 shrink-0 transition-all",
                  selectedEntryId === item.id ? "text-amber-500 translate-x-0" : "text-neutral-800 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                )} />
              </button>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
              <Lock className="w-12 h-12 mb-4" />
              <p className="mono text-[10px] font-black uppercase tracking-[0.2em]">Dữ liệu chưa được giải mã</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Content Detail */}
      <div className="flex-grow bg-neutral-950 relative overflow-hidden flex flex-col">
        {/* Background Pattern Removed for Simplicity */}
        
        {showLorebookSettings ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10 p-16 max-w-4xl mx-auto w-full">
            <LorebookSettingsView 
              settings={player.worldInfoSettings || {
                scanDepth: 5,
                includeNames: true,
                tokenBudget: 1000,
                minActivations: 0,
                maxDepth: 10,
                recursiveScanning: true,
                maxRecursionSteps: 3,
                caseSensitive: false,
                matchWholeWords: true,
                scanNpcDescription: true,
                scanNpcPersonality: true,
                scanScenario: true,
                scanNpcNotes: true,
                scanCreatorNotes: true,
                vectorEnabled: false,
                vectorThreshold: 0.8
              }}
              onUpdate={(newSettings) => onUpdatePlayer({ ...player, worldInfoSettings: newSettings })}
              onClose={() => setShowLorebookSettings(false)}
            />
          </div>
        ) : isAdding ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10 p-16 max-w-4xl mx-auto w-full">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-8 italic">Thêm Quy Tắc Mới</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Tiêu đề</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500"
                  placeholder="Vd: Những điều bị cấm..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Nội dung</label>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 resize-none custom-scrollbar"
                  placeholder="Nhập nội dung quy tắc..."
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleAddRule}
                  className="flex-1 bg-amber-500 text-black font-black uppercase py-4 rounded-xl hover:bg-amber-400 transition-all"
                >
                  Lưu Quy Tắc
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white/5 text-white font-black uppercase py-4 rounded-xl hover:bg-white/10 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        ) : selectedItem ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10">
            {selectedItem.type === 'codex' ? (
              <div className="max-w-4xl mx-auto px-8 py-16 md:px-16 md:py-24">
                <div className="flex items-center gap-4 mb-12">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-amber-500/20"></div>
                  <span className="px-4 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-full text-[10px] text-amber-500 font-black uppercase tracking-[0.4em]">
                    ARCHIVE_{activeTab.toUpperCase()}
                  </span>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-amber-500/20"></div>
                </div>

                {isEditing ? (
                  <div className="space-y-8">
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-4xl font-black text-white uppercase tracking-tight bg-transparent border-b border-white/10 w-full focus:outline-none focus:border-amber-500"
                    />
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-neutral-900/50 border border-white/10 rounded-2xl p-6 text-lg text-neutral-300 focus:outline-none focus:border-amber-500 resize-none custom-scrollbar"
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={handleSaveEdit}
                        className="px-8 py-4 bg-amber-500 text-black font-black uppercase rounded-xl hover:bg-amber-400 transition-all"
                      >
                        Lưu Thay Đổi
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-8 py-4 bg-white/5 text-white font-black uppercase rounded-xl hover:bg-white/10 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-8">
                      {selectedItem.title !== "Những điều cần có" && selectedItem.title !== "Những điều bị cấm" && (
                        <h1 className="text-[40px] font-bold text-white uppercase tracking-tight leading-[35px] flex-grow">
                          {selectedItem.title}
                        </h1>
                      )}
                      {(activeTab === 'rules' || activeTab === 'world') && (
                        <div className="flex gap-3 shrink-0">
                          <button 
                            onClick={() => {
                              setIsEditing(true);
                              setEditTitle(selectedItem.title);
                              setEditContent((selectedItem.data as CodexEntry).content || '');
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 hover:border-amber-500/30 transition-all group/edit"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4 group-hover/edit:text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sửa</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(selectedItem.id, 'codex')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all group/del"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="markdown-body prose prose-invert max-w-none">
                      <div className="text-lg md:text-xl text-neutral-300 leading-relaxed">
                        <ReactMarkdown>{(selectedItem.data as CodexEntry).content || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer Decoration */}
                <div className="mt-24 pt-12 border-t border-white/5 flex justify-between items-center">
                  <div className="mono text-[8px] text-neutral-700 font-black uppercase tracking-[0.5em]">
                    MATRIX Engine // Codex Archive
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500/20"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-500/40"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-500/60"></div>
                  </div>
                </div>
              </div>
            ) : selectedItem.type === 'story' ? (
              <div className="max-w-4xl mx-auto px-8 py-16 md:px-16 md:py-24">
                <div className="flex items-center gap-4 mb-12">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-amber-500/20"></div>
                  <span className="px-4 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-full text-[10px] text-amber-500 font-black uppercase tracking-[0.4em]">
                    STORY_NODE_{selectedItem.subtitle.toUpperCase()}
                  </span>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-amber-500/20"></div>
                </div>

                {isEditing ? (
                  <div className="space-y-8">
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-4xl font-black text-white uppercase tracking-tight bg-transparent border-b border-white/10 w-full focus:outline-none focus:border-amber-500"
                    />
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-neutral-900/50 border border-white/10 rounded-2xl p-6 text-lg text-neutral-300 focus:outline-none focus:border-amber-500 resize-none custom-scrollbar"
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={handleSaveEdit}
                        className="px-8 py-4 bg-amber-500 text-black font-black uppercase rounded-xl hover:bg-amber-400 transition-all"
                      >
                        Lưu Thay Đổi
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-8 py-4 bg-white/5 text-white font-black uppercase rounded-xl hover:bg-white/10 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-8">
                      <h1 className="text-[40px] font-bold text-white uppercase tracking-tight leading-[35px] flex-grow">
                        {selectedItem.title}
                      </h1>
                      <div className="flex gap-3 shrink-0">
                        <button 
                          onClick={() => {
                            setIsEditing(true);
                            setEditTitle(selectedItem.title);
                            setEditContent((selectedItem.data as any).content || '');
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 hover:border-amber-500/30 transition-all group/edit"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4 group-hover/edit:text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Sửa</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteEntry(selectedItem.id, 'story')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all group/del"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Xóa</span>
                        </button>
                      </div>
                    </div>

                    <div className="markdown-body prose prose-invert max-w-none">
                      <div className="text-lg md:text-xl text-neutral-300 leading-relaxed">
                        <ReactMarkdown>{(selectedItem.data as any).content || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </>
                )}

                {/* Story Metadata */}
                <div className="mt-12 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Loại</span>
                    <span className="text-xs font-bold text-white">{selectedItem.subtitle}</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Lượt chơi</span>
                    <span className="text-xs font-bold text-white">Lượt {(selectedItem.data as any).turnCount || 0}</span>
                  </div>
                </div>

                {/* Footer Decoration */}
                <div className="mt-24 pt-12 border-t border-white/5 flex justify-between items-center">
                  <div className="mono text-[8px] text-neutral-700 font-black uppercase tracking-[0.5em]">
                    MATRIX Engine // Story Archive
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500/20"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-500/40"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-500/60"></div>
                  </div>
                </div>
              </div>
            ) : selectedItem.type === 'lorebook' ? (
              <LorebookView 
                book={selectedItem.data as WorldInfoBook} 
                isActive={(player.activeLorebookIds || []).includes(selectedItem.id)}
                onToggleActive={() => toggleLorebookActive(selectedItem.id)}
                onDelete={() => deleteLorebook(selectedItem.id)}
                onUpdateBook={updateLorebook}
                settings={settings}
              />
            ) : (
              /* NPC Profile View */
              <div className="max-w-5xl mx-auto px-8 py-16 md:px-16 md:py-24">
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                  <div className="relative shrink-0 mx-auto lg:mx-0">
                    <div className={cn(
                      "w-64 aspect-[3/4] rounded-[3rem] border-8 flex items-center justify-center shadow-2xl bg-neutral-900 overflow-hidden relative group",
                      ((selectedItem.data as Relationship).affinity || 0) >= 600 ? 'border-pink-500/20 shadow-pink-500/5' : 'border-cyan-500/20 shadow-cyan-500/5'
                    )}>
                      {(selectedItem.data as Relationship).avatar ? (
                        <img 
                          src={(selectedItem.data as Relationship).avatar} 
                          alt={selectedItem.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center opacity-10">
                          <User className="w-24 h-24" />
                        </div>
                      )}
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    </div>

                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full px-4">
                      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                          <span className="mono text-[10px] font-black text-white uppercase tracking-widest">
                            {(selectedItem.data as Relationship).affinity}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-cyan-500" />
                          <span className="mono text-[10px] font-black text-white uppercase tracking-widest">
                            {(selectedItem.data as Relationship).loyalty || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow space-y-10">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border",
                          ((selectedItem.data as Relationship).affinity || 0) >= 600 
                            ? "bg-pink-500/10 border-pink-500/20 text-pink-500" 
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                        )}>
                          {((selectedItem.data as Relationship).affinity || 0) >= 600 ? 'Hậu cung' : 'Xã hội'}
                        </span>
                        <span className="text-neutral-700 mono text-[9px] font-black uppercase tracking-widest">
                          ID: {(selectedItem.data as Relationship).id}
                        </span>
                      </div>
                      <h1 className="text-[40px] font-bold text-white uppercase tracking-tight leading-[35px] mb-2">
                        {selectedItem.title}
                      </h1>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
                        {(selectedItem.data as Relationship).temporaryName && (
                          <span className="text-sm font-black text-neutral-500 uppercase italic">
                            ~{(selectedItem.data as Relationship).temporaryName}
                          </span>
                        )}
                        {(selectedItem.data as Relationship).alias && (
                          <span className="text-sm font-black text-rose-500/70 uppercase">
                            [{(selectedItem.data as Relationship).alias}]
                          </span>
                        )}
                        {(selectedItem.data as Relationship).nickname && (
                          <span className="text-sm font-black text-emerald-500/70 uppercase">
                            ({(selectedItem.data as Relationship).nickname})
                          </span>
                        )}
                      </div>

                      {/* Relationship Network Section - Moved to top for prominence */}
                      <div className="mb-10">
                        <NpcSocialColumn 
                          npc={selectedItem.data as Relationship}
                          player={player}
                          onSwitchNpc={(target) => setSelectedEntryId(target.id)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          {(selectedItem.data as Relationship).status}
                        </span>
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">
                          Tâm trạng: {(selectedItem.data as Relationship).mood || 'Bình thản'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="mono text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Ấn tượng chủ quan
                      </h4>
                      <div className="p-6 bg-neutral-900 border border-white/5 rounded-2xl relative overflow-hidden group leading-[22.5px]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <p className="text-[18px] text-neutral-300 font-normal leading-[15px] italic">
                          "{(selectedItem.data as Relationship).impression || 'Dữ liệu sơ cấp...'}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="mono text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
                          <Lock className="w-3 h-3" /> Vạn Giới Thân Phận
                        </h4>
                        <div className="space-y-2">
                          {((selectedItem.data as Relationship).identities || []).map((identity, idx) => (
                            <div key={idx} className={cn(
                              "p-4 border rounded-2xl flex flex-col gap-2 transition-all",
                              identity.isRevealed 
                                ? "bg-rose-500/5 border-rose-500/20" 
                                : "bg-neutral-900 border-white/5 opacity-50"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                    identity.type === IdentityType.FANFIC ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' :
                                    identity.type === IdentityType.DESTINY ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                                    identity.type === IdentityType.LEGENDARY ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                                    'bg-white/5 border-white/10 text-white/40'
                                  )}>
                                    {identity.type || IdentityType.NORMAL}
                                  </span>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Thân phận #{idx + 1}</span>
                                </div>
                                {identity.isRevealed ? <Unlock className="w-3 h-3 text-rose-500" /> : <Lock className="w-3 h-3 text-neutral-700" />}
                              </div>
                              {identity.isRevealed ? (
                                <>
                                  <span className="text-sm font-black text-white uppercase tracking-tight">{identity.name}</span>
                                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">{identity.role}</span>
                                  <p className="text-[10px] text-neutral-400 italic">{identity.description}</p>
                                </>
                              ) : (
                                <span className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em]">Dữ liệu bị ẩn</span>
                              )}
                            </div>
                          ))}
                          {Array.isArray((selectedItem.data as Relationship).secrets) && (selectedItem.data as Relationship).secrets!.length > 0 ? (
                            (selectedItem.data as Relationship).secrets!.map((s, i) => (
                              <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 group hover:bg-amber-500/10 transition-all">
                                <span className="text-lg">🗝️</span>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-tight leading-tight">{s}</span>
                              </div>
                            ))
                          ) : (
                            !(selectedItem.data as Relationship).identities?.length && (
                              <div className="py-12 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center opacity-20">
                                <Lock className="w-8 h-8 mb-3" />
                                <p className="mono text-[8px] font-black uppercase tracking-widest">Chưa có bí mật nào</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="mono text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Đặc điểm nhận dạng
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Tuổi</span>
                            <span className="text-xs font-bold text-white">{(selectedItem.data as Relationship).age || '??'}</span>
                          </div>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Chủng tộc</span>
                            <span className="text-xs font-bold text-white">{(selectedItem.data as Relationship).race || 'Nhân loại'}</span>
                          </div>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Phe phái</span>
                            <span className="text-xs font-bold text-white">{(selectedItem.data as Relationship).faction || 'Tự do'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full"></div>
              <BookOpen className="w-32 h-32 text-amber-500/20 relative z-10 animate-pulse" />
            </div>
            <h3 className="text-5xl font-black text-white mono uppercase tracking-[0.4em] mb-4 opacity-10">
              CODEX_ARCHIVE
            </h3>
            <p className="max-w-md text-neutral-700 mono text-xs font-bold uppercase tracking-widest leading-relaxed">
              Chọn một mục từ danh sách bên trái để truy xuất dữ liệu từ ma trận lượng tử.
            </p>
          </div>
        )}

        {/* Top Header Bar for Content Area */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-end px-8 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500/20"></div>
              <div className="w-1 h-3 bg-amber-500/40"></div>
              <div className="w-1 h-3 bg-amber-500/60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LorebookViewProps {
  book: WorldInfoBook;
  isActive: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
  onUpdateBook: (book: WorldInfoBook) => void;
  settings: AppSettings;
}

const LorebookView: React.FC<LorebookViewProps> = ({ book, isActive, onToggleActive, onDelete, onUpdateBook, settings }) => {
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editKeys, setEditKeys] = useState('');
  const [editSecondaryKeys, setEditSecondaryKeys] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editRole, setEditRole] = useState<'system' | 'user' | 'model'>('system');
  const [editPlacement, setEditPlacement] = useState<WorldInfoPlacement>('after_char');
  const [editDepth, setEditDepth] = useState<number | undefined>(undefined);
  const [editUseRegex, setEditUseRegex] = useState(false);
  const [editCaseSensitive, setEditCaseSensitive] = useState(false);
  const [editLogic, setEditLogic] = useState<WorldInfoLogic>('AND_ANY');
  const [editProbability, setEditProbability] = useState(100);
  const [editSticky, setEditSticky] = useState(0);
  const [editCooldown, setEditCooldown] = useState(0);
  const [editDelay, setEditDelay] = useState(0);

  const toggleEntry = (id: string) => {
    if (editingEntryId) return; // Prevent collapse while editing
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditEntry = (entry: WorldInfoEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntryId(entry.id);
    setEditTitle(entry.title || (entry as any).comment || '');
    setEditContent(entry.content || '');
    setEditKeys((entry.keys || []).join(', '));
    setEditSecondaryKeys((entry.secondaryKeys || []).join(', '));
    setEditOrder(entry.order || 0);
    setEditRole(entry.role || 'system');
    setEditPlacement(entry.placement || 'after_char');
    setEditDepth(entry.depth);
    setEditUseRegex(entry.useRegex || false);
    setEditCaseSensitive(entry.caseSensitive || false);
    setEditLogic(entry.logic || 'AND_ANY');
    setEditProbability(entry.probability !== undefined ? entry.probability : 100);
    setEditSticky(entry.sticky || 0);
    setEditCooldown(entry.cooldown || 0);
    setEditDelay(entry.delay || 0);
    if (!expandedEntries[entry.id]) {
        setExpandedEntries(prev => ({ ...prev, [entry.id]: true }));
    }
  };

  const handleSaveEntry = (entry: WorldInfoEntry) => {
    const updatedEntries = book.entries.map(e => {
        if (e.id === entry.id) {
            return {
                ...e,
                title: editTitle,
                content: editContent,
                keys: editKeys.split(',').map(k => k.trim()).filter(Boolean),
                secondaryKeys: editSecondaryKeys.split(',').map(k => k.trim()).filter(Boolean),
                order: editOrder,
                role: editRole,
                placement: editPlacement,
                depth: editDepth,
                useRegex: editUseRegex,
                caseSensitive: editCaseSensitive,
                logic: editLogic,
                probability: editProbability,
                sticky: editSticky,
                cooldown: editCooldown,
                delay: editDelay
            };
        }
        return e;
    });
    onUpdateBook({ ...book, entries: updatedEntries });
    setEditingEntryId(null);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
  };

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10">
      <div className="max-w-4xl mx-auto px-8 py-16 md:px-16 md:py-24">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-grow bg-gradient-to-r from-transparent to-purple-500/20"></div>
          <span className="px-4 py-1.5 bg-purple-500/5 border border-purple-500/20 rounded-full text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">
            WORLD_INFO_{book.name.toUpperCase().replace(/\s+/g, '_')}
          </span>
          <div className="h-px flex-grow bg-gradient-to-l from-transparent to-purple-500/20"></div>
        </div>

        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4 italic">
              {book.name}
            </h1>
            <p className="text-neutral-500 text-sm italic max-w-2xl leading-relaxed">
              {book.description || "Không có mô tả cho lorebook này."}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={onToggleActive}
              className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl transition-all border font-black uppercase tracking-widest text-[10px]",
                isActive 
                  ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  : "bg-white/5 text-neutral-500 border-white/10 hover:text-white"
              )}
            >
              <Power className="w-4 h-4" />
              {isActive ? "Đang hoạt động" : "Kích hoạt"}
            </button>
            <button 
              onClick={onDelete}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
              title="Xóa Lorebook"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <ScrollText className="w-4 h-4 text-purple-500" />
              Danh sách mục từ ({book.entries.length})
            </h3>
            <div className="h-px flex-grow mx-8 bg-white/5"></div>
          </div>

          {book.entries.sort((a, b) => a.order - b.order).map((entry) => (
            <div 
              key={entry.id}
              className={cn(
                "group bg-neutral-900/50 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300",
                expandedEntries[entry.id] ? "border-purple-500/30 bg-purple-500/5 ring-1 ring-purple-500/20" : "hover:border-white/10"
              )}
            >
              <button 
                onClick={() => toggleEntry(entry.id)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    expandedEntries[entry.id] ? "bg-purple-500 text-black" : "bg-white/5 text-neutral-600 group-hover:text-purple-400"
                  )}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-sm font-black uppercase tracking-tight",
                      expandedEntries[entry.id] ? "text-white" : "text-neutral-300 group-hover:text-white"
                    )}>
                      {entry.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                      {entry.keys.slice(0, 3).map((key, ki) => (
                        <span key={ki} className="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[8px] font-bold text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                          {key}
                        </span>
                      ))}
                      {entry.keys.length > 3 && (
                        <span className="text-[8px] font-bold text-neutral-700 uppercase tracking-widest">
                          +{entry.keys.length - 3} thêm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-4 text-neutral-600">
                    <div className="text-[9px] mono font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">
                      Order: {entry.order}
                    </div>
                    {entry.probability < 100 && (
                      <div className="text-[9px] mono font-bold uppercase tracking-widest px-2 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
                        {entry.probability}%
                      </div>
                    )}
                  </div>
                  {expandedEntries[entry.id] ? (
                    <ChevronUp className="w-5 h-5 text-purple-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-700 group-hover:text-neutral-400" />
                  )}
                </div>
              </button>

              {expandedEntries[entry.id] && (
                <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                  <div className="h-px bg-white/5 mb-8"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4 relative">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ScrollText className="w-3 h-3" /> Nội dung chèn
                            </h5>
                            {editingEntryId === entry.id ? (
                                <div className="flex gap-2">
                                    <button onClick={handleCancelEdit} className="text-[9px] uppercase tracking-widest font-black px-3 py-1 bg-neutral-800 text-neutral-400 rounded hover:text-white hover:bg-neutral-700 transition">Hủy</button>
                                    <button onClick={() => handleSaveEntry(entry)} className="text-[9px] uppercase tracking-widest font-black px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500 hover:text-white transition">Lưu</button>
                                </div>
                            ) : (
                                <button onClick={(e) => handleEditEntry(entry, e)} className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-white/5 text-neutral-400 rounded hover:text-white hover:bg-white/10 transition flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> Sửa
                                </button>
                            )}
                        </div>
                        {editingEntryId === entry.id ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Từ khóa (cách nhau bởi dấu phẩy)</label>
                                    <input 
                                        value={editKeys}
                                        onChange={e => setEditKeys(e.target.value)}
                                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm font-mono text-purple-400 outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Từ khóa phụ (nhấn mạnh)</label>
                                      <input 
                                          value={editSecondaryKeys}
                                          onChange={e => setEditSecondaryKeys(e.target.value)}
                                          className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm font-mono text-purple-400 outline-none focus:border-purple-500"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Logic từ khóa phụ</label>
                                      <select 
                                          value={editLogic}
                                          onChange={e => setEditLogic(e.target.value as any)}
                                          className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                      >
                                          <option value="AND_ANY">Yêu cầu ít nhất 1 (AND ANY)</option>
                                          <option value="AND_ALL">Yêu cầu tất cả (AND ALL)</option>
                                          <option value="NOT_ANY">Không có bất kỳ (NOT ANY)</option>
                                          <option value="NOT_ALL">Không được có tất cả (NOT ALL)</option>
                                      </select>
                                  </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Tiêu đề / Bình luận</label>
                                    <input 
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Nội dung</label>
                                    <textarea 
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        className="w-full h-80 bg-black/40 border border-purple-500/30 rounded-xl p-4 text-sm text-neutral-300 resize-y custom-scrollbar outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                                        placeholder="Nội dung entry..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Order</label>
                                        <input 
                                            type="number"
                                            value={editOrder}
                                            onChange={e => setEditOrder(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Vị trí chèn</label>
                                        <select 
                                            value={editPlacement}
                                            onChange={e => setEditPlacement(e.target.value as any)}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        >
                                            <option value="before_char">Trước Mô tả NV (Before Char)</option>
                                            <option value="after_char">Sau Mô tả NV (After Char)</option>
                                            <option value="before_examples">Trước Ví dụ (Before Example)</option>
                                            <option value="after_examples">Sau Ví dụ (After Example)</option>
                                            <option value="authors_note_top">Đầu AN (Author's Note Top)</option>
                                            <option value="authors_note_bottom">Cuối AN (Author's Note Bottom)</option>
                                            <option value="at_depth">@ Độ sâu (At Depth)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Vai trò (Role)</label>
                                        <select 
                                            value={editRole}
                                            onChange={e => setEditRole(e.target.value as any)}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        >
                                            <option value="system">⚙️ Hệ thống (System)</option>
                                            <option value="user">👤 Người dùng (User)</option>
                                            <option value="model">🤖 Trợ lý (Assistant)</option>
                                        </select>
                                    </div>
                                    {editPlacement === 'at_depth' && (
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Depth</label>
                                            <input 
                                                type="number"
                                                value={editDepth ?? 0}
                                                onChange={e => setEditDepth(parseInt(e.target.value))}
                                                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Xác Suất (%)</label>
                                        <input 
                                            type="number"
                                            value={editProbability ?? 100}
                                            onChange={e => setEditProbability(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Sticky (Lượt duy trì)</label>
                                        <input 
                                            type="number"
                                            value={editSticky ?? 0}
                                            onChange={e => setEditSticky(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Cooldown (Lượt khóa)</label>
                                        <input 
                                            type="number"
                                            value={editCooldown ?? 0}
                                            onChange={e => setEditCooldown(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Delay (Lưu trễ)</label>
                                        <input 
                                            type="number"
                                            value={editDelay ?? 0}
                                            onChange={e => setEditDelay(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editUseRegex}
                                                onChange={e => setEditUseRegex(e.target.checked)}
                                                className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500/50 bg-black/40 border-purple-500/30"
                                            />
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Dùng Regex</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer ml-4">
                                            <input 
                                                type="checkbox" 
                                                checked={editCaseSensitive}
                                                onChange={e => setEditCaseSensitive(e.target.checked)}
                                                className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500/50 bg-black/40 border-purple-500/30"
                                            />
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Phân biệt Hoa/Thường</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="markdown-body bg-black/40 border border-white/5 rounded-3xl p-6 text-neutral-300 text-sm leading-relaxed prose prose-invert max-w-none shadow-inner">
                                <ReactMarkdown>{entry.content}</ReactMarkdown>
                            </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Settings className="w-3 h-3" /> Cấu hình kích hoạt
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Regex</span>
                            {entry.useRegex ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-neutral-700" />}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Phân biệt hoa/thường</span>
                            {entry.caseSensitive ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-neutral-700" />}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> VỊ TRÍ CHÈN
                        </h5>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{entry.placement || 'after_char'}</span>
                          {entry.placement === 'at_depth' && (
                            <div className="mt-1 text-[9px] text-neutral-500 mono">Độ sâu: {entry.depth}</div>
                          )}
                        </div>
                      </div>

                      {(entry.includeCharacters?.length || 0) > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Users className="w-3 h-3" /> CHỈ ĐỊNH NHÂN VẬT
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {entry.includeCharacters?.map((c, ci) => (
                              <span key={ci} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] flex items-center gap-2">
                          <HistoryIcon className="w-3 h-3" /> Hiệu ứng thời gian
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Sticky (Lượt)</span>
                            <span className="text-xs font-bold text-white">{entry.sticky || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Cooldown (Lượt)</span>
                            <span className="text-xs font-bold text-white">{entry.cooldown || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Trì hoãn (Lượt)</span>
                            <span className="text-xs font-bold text-white">{entry.delay || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Thuật toán bổ sung
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Xác suất</span>
                            <span className="text-xs font-bold text-white">{entry.probability}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">Đệ quy</span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                              {entry.noRecursion ? 'Dừng' : entry.preventFurtherRecursion ? 'Chặn sâu' : 'Cho phép'}
                            </span>
                          </div>
                          {entry.vectorized && (
                            <div className="flex items-center justify-between p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                              <span className="text-[9px] font-black text-rose-500 uppercase">Vector hóa</span>
                              <CheckCircle2 className="w-4 h-4 text-rose-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Decoration */}
        <div className="mt-24 pt-12 border-t border-white/5 flex justify-between items-center opacity-30">
          <div className="mono text-[8px] text-neutral-500 font-black uppercase tracking-[0.5em]">
            SYSTEM_LORE_DATABASE // {book.id}
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
