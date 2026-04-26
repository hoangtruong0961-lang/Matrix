import React, { useState } from 'react';
import { X, Plus, Settings2, Trash2, ArrowUpCircle, ArrowDownCircle, Download } from 'lucide-react';
import { AppSettings, Preset, RegexRule, PromptChunk } from '../types';
import { usePresetRegexBinder } from '../hooks/usePresetRegexBinder';

const generateId = () => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch (e) {}
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface PresetManagerModalProps {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({ settings, updateSettings, onClose }) => {
  const binder = usePresetRegexBinder(settings, updateSettings);
  const [activeTab, setActiveTab] = useState<'presets' | 'global_regex'>('presets');
  
  const handleAddPreset = () => {
      const newPreset: Preset = {
          id: generateId(),
          name: 'Preset mới',
          prompts: [],
          attachedRegexes: []
      };
      binder.addPreset(newPreset);
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            let data;
            try {
                data = JSON.parse(event.target?.result as string);
            } catch (err) {
                console.error("Custom JSON parse error:", err);
                return alert("Lỗi đọc file JSON.");
            }
            
            let newPreset: Preset = {
                id: generateId(),
                name: file.name.replace('.json', ''),
                prompts: [],
                attachedRegexes: []
            };

            // Handle direct array of ST Regex scripts export
            if (Array.isArray(data) && data.length > 0 && ('scriptName' in data[0] || 'findRegex' in data[0])) {
                 newPreset.name = newPreset.name || 'Imported Regex';
                 newPreset.attachedRegexes = data.map((r: any, i: number) => ({
                    id: generateId(),
                    name: r.scriptName || r.name || `Imported Regex ${i+1}`,
                    pattern: r.findRegex || r.pattern || '',
                    replacement: r.replaceString || r.replacement || '',
                    flags: 'gm',
                    enabled: r.disabled === undefined ? true : !r.disabled,
                    order: i,
                    scope: 'preset',
                    placement: Array.isArray(r.placement) ? r.placement : (typeof r.placement === 'number' ? [r.placement] : [1, 2]),
                    markdownOnly: r.markdownOnly,
                    promptOnly: r.promptOnly,
                    minDepth: r.minDepth !== null ? r.minDepth : undefined,
                    maxDepth: r.maxDepth !== null ? r.maxDepth : undefined,
                    trimStrings: r.trimStrings || [],
                    substituteRegex: typeof r.substituteRegex === 'number' ? r.substituteRegex : 0
                }));
                binder.addAndActivatePreset(newPreset);
                if (e.target) e.target.value = '';
                alert('Nhập Regex Scripts thành công!');
                return;
            }

            let isJustPromptsArray = false;
            if (Array.isArray(data) && data.length > 0 && ('content' in data[0] || 'identifier' in data[0])) {
                isJustPromptsArray = true;
            }

            if (data.prompts && Array.isArray(data.prompts)) {
                newPreset.prompts = data.prompts.map((p: any, i: number) => {
                    let parsedRole: 'system' | 'user' | 'model' = 'system';
                    if (p.role === 1 || p.role === 'user') parsedRole = 'user';
                    else if (p.role === 2 || p.role === 'assistant' || p.role === 'model' || p.role === 'char') parsedRole = 'model';
                    else if (p.role === 0 || p.role === 'system') parsedRole = 'system';
                    else if (p.role === 'system') parsedRole = 'system'; // fallback

                    return {
                        id: generateId(),
                        name: p.name || `Imported ${i+1}`,
                        role: parsedRole,
                        content: p.content || '',
                        enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
                        relativeOrder: typeof p.injection_order === 'number' ? p.injection_order : (i * 10),
                        depthType: typeof p.injection_position === 'number' ? (p.injection_position === 1 ? 'top_system' : (p.injection_position === 2 ? 'relative' : 'at_depth')) : (p.system_prompt ? 'top_system' : 'at_depth'),
                        depthValue: typeof p.injection_depth === 'number' ? p.injection_depth : 0,
                        trigger: Array.isArray(p.injection_trigger) && p.injection_trigger.length > 0 ? p.injection_trigger : ['all']
                    };
                });
            } else if (isJustPromptsArray) {
                newPreset.name = newPreset.name || 'Imported Prompts';
                newPreset.prompts = data.map((p: any, i: number) => {
                    let parsedRole: 'system' | 'user' | 'model' = 'system';
                    if (p.role === 1 || p.role === 'user') parsedRole = 'user';
                    else if (p.role === 2 || p.role === 'assistant' || p.role === 'model' || p.role === 'char') parsedRole = 'model';
                    else if (p.role === 0 || p.role === 'system') parsedRole = 'system'; // fallback

                    return {
                        id: generateId(),
                        name: p.name || `Imported ${i+1}`,
                        role: parsedRole,
                        content: p.content || '',
                        enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
                        relativeOrder: typeof p.injection_order === 'number' ? p.injection_order : (i * 10),
                        depthType: typeof p.injection_position === 'number' ? (p.injection_position === 1 ? 'top_system' : (p.injection_position === 2 ? 'relative' : 'at_depth')) : (p.system_prompt ? 'top_system' : 'at_depth'),
                        depthValue: typeof p.injection_depth === 'number' ? p.injection_depth : 0,
                        trigger: Array.isArray(p.injection_trigger) && p.injection_trigger.length > 0 ? p.injection_trigger : ['all']
                    };
                });
                binder.addAndActivatePreset(newPreset);
                if (e.target) e.target.value = '';
                alert('Nhập danh sách Prompt thành công!');
                return;
            } else if (data.storyString || data.system_prompt) {
                // Handle standard ST Context or Instruct preset
                if (data.system_prompt) {
                     newPreset.prompts.push({
                        id: generateId(),
                        name: 'System Prompt',
                        role: 'system',
                        content: data.system_prompt,
                        enabled: true,
                        relativeOrder: 0,
                        depthType: 'top_system',
                        trigger: ['all']
                     });
                }
                if (data.storyString) {
                     newPreset.prompts.push({
                        id: generateId(),
                        name: 'Story String',
                        role: 'system',
                        content: data.storyString,
                        enabled: true,
                        relativeOrder: 10,
                        depthType: 'top_system',
                        trigger: ['all']
                     });
                }
                if (data.system_sequence) {
                     newPreset.prompts.push({
                        id: generateId(),
                        name: 'System Sequence',
                        role: 'system',
                        content: data.system_sequence,
                        enabled: true,
                        relativeOrder: 20,
                        depthType: 'relative',
                        trigger: ['all']
                     });
                }
            }

            const regexScriptsToImport = (data.extensions && Array.isArray(data.extensions.regex_scripts)) 
                ? data.extensions.regex_scripts 
                : (Array.isArray(data.regex_scripts) ? data.regex_scripts : null);

            if (regexScriptsToImport) {
                newPreset.attachedRegexes = regexScriptsToImport.map((r: any, i: number) => ({
                    id: generateId(),
                    name: r.scriptName || r.name || `Imported Regex ${i+1}`,
                    pattern: r.findRegex !== undefined ? r.findRegex : (r.pattern || ''),
                    replacement: r.replaceString !== undefined ? r.replaceString : (r.replacement || ''),
                    flags: r.regexFlags || r.flags || 'gm',
                    enabled: r.disabled !== undefined ? !r.disabled : (r.enabled !== undefined ? r.enabled : true),
                    order: typeof r.order === 'number' ? r.order : i,
                    scope: 'preset',
                    placement: Array.isArray(r.placement) ? r.placement : (typeof r.placement === 'number' ? [r.placement] : [1, 2]),
                    markdownOnly: !!r.markdownOnly,
                    promptOnly: !!r.promptOnly,
                    minDepth: r.minDepth !== null ? r.minDepth : undefined,
                    maxDepth: r.maxDepth !== null ? r.maxDepth : undefined,
                    trimStrings: r.trimStrings || [],
                    substituteRegex: typeof r.substituteRegex === 'number' ? r.substituteRegex : 0
                }));
            } else if (data.attachedRegexes && Array.isArray(data.attachedRegexes)) {
                newPreset.attachedRegexes = data.attachedRegexes.map((r: any) => ({
                    ...r,
                    id: generateId()
                }));
            }
            
            if (data.name) {
                newPreset.name = data.name;
            }

            binder.addAndActivatePreset(newPreset);
            
            if (e.target) {
                e.target.value = '';
            }
            alert('Nhập Preset thành công!');

        } catch (error) {
            console.error("Lỗi parse preset:", error);
            alert("Lỗi file json không hợp lệ dữ liệu không đúng định dạng.");
        }
    };
    reader.readAsText(file);
  };

  const handleExportPreset = (presetId: string) => {
    const preset = binder.presets.find(p => p.id === presetId);
    if (!preset) return;

    const stFormat = {
        name: preset.name,
        temperature: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_p: 0.9,
        top_k: 500,
        top_a: 0,
        min_p: 0,
        repetition_penalty: 1,
        max_context_unlocked: true,
        tool_reasoning_mode: "disabled",
        openai_max_context: 2000000,
        openai_max_tokens: 65535,
        names_behavior: 0,
        send_if_empty: "",
        impersonation_prompt: "[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Write 1 reply only in internet RP style. Don't write as {{char}} or system. Don't describe actions of {{char}}.]",
        new_chat_prompt: "[Start a new Chat]",
        new_group_chat_prompt: "[Start a new group chat. Group members: {{group}}]",
        new_example_chat_prompt: "[Example Chat]",
        continue_nudge_prompt: "[Continue your last message without repeating its original content.]",
        bias_preset_selected: "Default (none)",
        wi_format: "{0}",
        scenario_format: "{{scenario}}",
        personality_format: "{{personality}}",
        group_nudge_prompt: "[Write the next reply only as {{char}}.]",
        stream_openai: true,
        prompts: preset.prompts.map((p, i) => ({
            identifier: p.id,
            name: p.name,
            enabled: p.enabled,
            role: p.role === 'model' ? 'assistant' : p.role,
            content: p.content,
            system_prompt: p.role === 'system',
            marker: false,
            forbid_overrides: false,
            injection_position: p.depthType === 'top_system' ? 1 : (p.depthType === 'relative' ? 2 : 0),
            injection_depth: p.depthValue || 4,
            injection_order: p.relativeOrder ?? (i * 10),
            injection_trigger: p.trigger || []
        })),
        extensions: {
            regex_scripts: preset.attachedRegexes.map((r, i) => ({
                id: r.id,
                scriptName: r.name,
                findRegex: r.pattern,
                replaceString: r.replacement,
                trimStrings: [],
                placement: r.placement || [1, 2],
                disabled: !r.enabled,
                markdownOnly: r.markdownOnly,
                promptOnly: r.promptOnly,
                runOnEdit: true,
                substituteRegex: 0,
                minDepth: r.minDepth !== undefined ? r.minDepth : null,
                maxDepth: r.maxDepth !== undefined ? r.maxDepth : null
            }))
        }
    };

    const blob = new Blob([JSON.stringify(stFormat, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'preset'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddGlobalRegex = () => {
      const newRule: RegexRule = {
          id: generateId(),
          name: 'Regex mới',
          pattern: '',
          replacement: '',
          flags: 'g',
          enabled: true,
          order: binder.globalRegexes.length,
          scope: 'global'
      };
      binder.addRegexToGlobal(newRule);
  };

  const handleAddPresetRegex = (presetId: string) => {
      const newRule: RegexRule = {
          id: generateId(),
          name: 'Regex',
          pattern: '',
          replacement: '',
          flags: 'g',
          enabled: true,
          order: 0,
          scope: 'preset'
      };
      binder.addRegexToPreset(presetId, newRule);
  };

  const renderRegexEditor = (rule: RegexRule, scopeId: 'global' | string) => {
    return (
        <div key={rule.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative group hover:border-white/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-3">
                <input 
                    value={rule.name}
                    onChange={e => binder.updateRegex(rule.id, scopeId, { name: e.target.value })}
                    className="bg-transparent text-[13px] font-black text-white px-2 py-1 outline-none focus:bg-white/5 border border-transparent focus:border-white/10 rounded-lg w-full md:w-1/3"
                />
                <div className="flex gap-2">
                    <button 
                        onClick={() => binder.updateRegex(rule.id, scopeId, { enabled: !rule.enabled })}
                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-colors ${rule.enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-800 text-neutral-500'}`}
                    >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button onClick={() => binder.removeRegex(rule.id, scopeId)} className="text-rose-400 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Pattern (findRegex)</label>
                    <input
                        value={rule.pattern}
                        onChange={e => binder.updateRegex(rule.id, scopeId, { pattern: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-mono text-amber-400 outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="/regex/gm"
                    />
                </div>
                <div>
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Replacement</label>
                    <input
                        value={rule.replacement}
                        onChange={e => binder.updateRegex(rule.id, scopeId, { replacement: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-mono text-emerald-400 outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="Thay thế..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Placement</label>
                    <div className="flex gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={rule.placement?.includes(1) ?? !rule.markdownOnly} onChange={e => {
                                const p = new Set(rule.placement || [1, 2]);
                                if (e.target.checked) p.add(1); else p.delete(1);
                                binder.updateRegex(rule.id, scopeId, { placement: Array.from(p) });
                            }} className="hidden" />
                            <span className={`text-[10px] px-2 py-1 rounded border transition-all ${((rule.placement?.includes(1) ?? !rule.markdownOnly)) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-neutral-500'}`}>Prompt</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={rule.placement?.includes(2) ?? !rule.promptOnly} onChange={e => {
                                const p = new Set(rule.placement || [1, 2]);
                                if (e.target.checked) p.add(2); else p.delete(2);
                                binder.updateRegex(rule.id, scopeId, { placement: Array.from(p) });
                            }} className="hidden" />
                            <span className={`text-[10px] px-2 py-1 rounded border transition-all ${((rule.placement?.includes(2) ?? !rule.promptOnly)) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-black/40 border-white/10 text-neutral-500'}`}>UI/Markdown</span>
                        </label>
                    </div>
                </div>
                <div>
                   <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Depth (Tầng)</label>
                   <div className="flex gap-2">
                      <input 
                         type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white" 
                         placeholder="Min" value={rule.minDepth ?? ''} 
                         onChange={e => binder.updateRegex(rule.id, scopeId, { minDepth: e.target.value ? parseInt(e.target.value) : undefined })} 
                      />
                      <input 
                         type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white" 
                         placeholder="Max" value={rule.maxDepth ?? ''} 
                         onChange={e => binder.updateRegex(rule.id, scopeId, { maxDepth: e.target.value ? parseInt(e.target.value) : undefined })} 
                      />
                   </div>
                </div>
            </div>

            {binder.presets.length > 0 && scopeId === 'global' && (
                <div className="pt-3 border-t border-white/5 flex gap-2 items-center flex-wrap mt-3">
                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Chuyển sang Preset:</span>
                    {binder.presets.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => binder.moveRegex(rule.id, 'global', p.id)}
                            className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
            {scopeId !== 'global' && (
                <div className="pt-3 border-t border-white/5 flex gap-2 items-center flex-wrap mt-3">
                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Chuyển sang:</span>
                    <button 
                        onClick={() => binder.moveRegex(rule.id, scopeId, 'global')}
                        className="px-2 py-1 bg-indigo-500/10 rounded-md text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                        Global
                    </button>
                    {binder.presets.map(p => p.id !== scopeId && (
                        <button 
                            key={p.id}
                            onClick={() => binder.moveRegex(rule.id, scopeId, p.id)}
                            className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const handleAddPrompt = (presetId: string) => {
    const activePreset = binder.presets.find(p => p.id === presetId);
    if (!activePreset) return;
    
    const newPrompt: PromptChunk = {
        id: generateId(),
        name: 'New Prompt',
        enabled: true,
        role: 'system',
        trigger: ['all'],
        depthType: 'at_depth',
        relativeOrder: activePreset.prompts.length,
        content: ''
    };
    const updatedPrompts = [...activePreset.prompts, newPrompt];
    binder.updatePreset(presetId, { prompts: updatedPrompts });
  };

  const updatePrompt = (presetId: string, promptId: string, updates: Partial<PromptChunk>) => {
      const activePreset = binder.presets.find(p => p.id === presetId);
      if (!activePreset) return;
      const updatedPrompts = activePreset.prompts.map(p => p.id === promptId ? { ...p, ...updates } : p);
      binder.updatePreset(presetId, { prompts: updatedPrompts });
  };

  const removePrompt = (presetId: string, promptId: string) => {
      const activePreset = binder.presets.find(p => p.id === presetId);
      if (!activePreset) return;
      const updatedPrompts = activePreset.prompts.filter(p => p.id !== promptId);
      binder.updatePreset(presetId, { prompts: updatedPrompts });
  };

  const activePreset = binder.presets.find(p => p.id === binder.activePresetId);

  return (
    <div className="SettingsModal fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-1 md:p-2 animate-in zoom-in duration-300">
      <div className="w-[99%] h-[99%] bg-[#080808] border border-white/10 rounded-2xl shadow-[0_0_120px_rgba(0,0,0,1)] relative overflow-hidden flex">
        
        {/* Sidebar */}
        <div className="w-1/4 min-w-[250px] max-w-[320px] bg-black/40 border-r border-white/5 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-amber-500" />
                    Preset Manager
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                   <button 
                        onClick={() => setActiveTab('global_regex')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center ${activeTab === 'global_regex' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent'}`}
                    >
                        <span className="flex items-center gap-2 text-[10px]">🌍 Global Regexes</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${activeTab === 'global_regex' ? 'bg-indigo-500/20' : 'bg-white/5 text-neutral-400'}`}>{binder.globalRegexes.length}</span>
                    </button>
                </div>
                
                <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between px-2 mb-4">
                         <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Presets</span>
                         <div className="flex items-center gap-1.5">
                             <input 
                                 type="file" 
                                 accept=".json" 
                                 className="hidden" 
                                 id="preset-import"
                                 onChange={handleImportPreset} 
                             />
                             <label htmlFor="preset-import" className="text-indigo-400 hover:text-indigo-300 transition-colors p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg cursor-pointer" title="Import Preset JSON">
                                 <Download className="w-3.5 h-3.5" />
                             </label>
                             <button onClick={handleAddPreset} className="text-emerald-500 hover:text-emerald-400 transition-colors p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg">
                                 <Plus className="w-3.5 h-3.5" />
                             </button>
                         </div>
                    </div>
                    {binder.presets.map(preset => (
                         <div key={preset.id} className={`group flex flex-col rounded-xl border transition-all ${binder.activePresetId === preset.id ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-white/5 bg-black/40 hover:border-white/10 hover:bg-white/[0.02]'}`}>
                             <button
                                onClick={() => binder.activatePreset(preset.id)}
                                className="px-4 py-3 text-left flex-1"
                             >
                                <div className={`font-black text-xs uppercase tracking-widest ${binder.activePresetId === preset.id ? 'text-amber-400' : 'text-neutral-400'}`}>{preset.name}</div>
                                <div className="text-[9px] font-bold text-neutral-600 uppercase mt-2 flex gap-3">
                                    <span>{preset.prompts.length} Prompts</span>
                                    <span>{preset.attachedRegexes.length} Regex</span>
                                </div>
                             </button>
                             <div className="px-3 pb-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => binder.deletePreset(preset.id)} className="p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="Xóa Preset">
                                     <Trash2 className="w-3 h-3" />
                                 </button>
                                 <button onClick={() => handleExportPreset(preset.id)} className="p-1 px-3 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg ml-auto flex items-center transition-colors border border-indigo-500/20" title="Export Preset (JSON)">
                                     Export
                                 </button>
                                 <button onClick={() => setActiveTab('presets' as any)} className="p-1 px-3 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg flex items-center transition-colors border border-white/5">
                                     Sửa
                                 </button>
                             </div>
                         </div>
                    ))}
                </div>
            </div>
            
            {/* Version marker or info */}
            <div className="p-4 border-t border-white/5 bg-black/20 text-center">
                <span className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em]">Matrix AI System</span>
            </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col relative bg-[#080808]">
           <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40 h-[73px]">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                   {activeTab === 'global_regex' ? 'Global Regex Binding' : 'Preset Config'}
               </h3>
               <button onClick={onClose} className="p-2 text-neutral-500 hover:text-rose-400 bg-white/5 rounded-full hover:bg-rose-500/10 transition-all border border-white/5 hover:border-rose-500/20">
                  <X className="w-4 h-4" />
                </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 md:p-8 text-white">
                {activeTab === 'global_regex' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-8">
                             <div className="space-y-1">
                               <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Luật Regex Toàn cục</p>
                               <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Các rule này sẽ áp dụng mọi lúc trên toàn ứng dụng.</p>
                             </div>
                             <button onClick={handleAddGlobalRegex} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all shadow-lg active:scale-[0.98]">
                                 <Plus className="w-4 h-4" /> Thêm Local Rule
                             </button>
                        </div>
                        <div className="space-y-4">
                        {binder.globalRegexes.map(rule => renderRegexEditor(rule, 'global'))}
                        {binder.globalRegexes.length === 0 && (
                            <div className="text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                                Không có Global Regex nào.
                            </div>
                        )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'presets' && (
                    <div className="h-full flex flex-col">
                      {!activePreset ? (
                          <div className="flex-1 flex items-center justify-center text-neutral-500">
                            Vui lòng chọn 1 Preset bên trái.
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex items-center justify-between bg-black/40 p-6 border border-white/5 rounded-xl">
                                  <div className="flex-1">
                                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Preset Name</label>
                                    <input
                                        value={activePreset.name}
                                        onChange={e => binder.updatePreset(activePreset.id, { name: e.target.value })}
                                        className="bg-transparent border-none focus:ring-0 text-xl md:text-2xl font-black text-amber-500 uppercase tracking-widest px-0 w-full placeholder-neutral-700"
                                        placeholder="NHẬP TÊN PRESET"
                                    />
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest px-4 py-2 bg-black/40 rounded-lg border border-white/5 whitespace-nowrap">
                                          ID: {activePreset.id.slice(0,8)}
                                      </div>
                                      <button 
                                          onClick={() => handleExportPreset(activePreset.id)} 
                                          className="text-amber-500 hover:text-amber-400 transition-colors p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 shadow-lg active:scale-[0.98]"
                                          title="Export Preset"
                                      >
                                          <ArrowUpCircle className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <div className="flex justify-between items-center mb-8">
                                    <div className="space-y-1">
                                      <h4 className="font-black text-emerald-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                          Prompts / Story Strings
                                      </h4>
                                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed hidden sm:block">Thêm các prompt system/user để tiêm vào ngữ cảnh AI.</p>
                                    </div>
                                      <button onClick={() => handleAddPrompt(activePreset.id)} className="flex items-center gap-1 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-lg active:scale-[0.98]">
                                          <Plus className="w-4 h-4" /> Thêm Lời nhắc
                                      </button>
                                  </div>
                                  
                                  {activePreset.prompts.map(prompt => (
                                      <div key={prompt.id} className="bg-black/60 border border-emerald-500/10 rounded-xl p-5 space-y-4">
                                          <div className="flex items-center justify-between">
                                              <input
                                                  value={prompt.name}
                                                  onChange={e => updatePrompt(activePreset.id, prompt.id, { name: e.target.value })}
                                                  className="bg-transparent border-none focus:ring-0 text-emerald-400 font-black tracking-widest uppercase text-[10px] px-0 w-1/2"
                                                  placeholder="TÊN LỜI NHẮC"
                                              />
                                              <div className="flex items-center gap-3">
                                                  <button 
                                                      onClick={() => updatePrompt(activePreset.id, prompt.id, { enabled: !prompt.enabled })}
                                                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-colors ${prompt.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}
                                                  >
                                                      {prompt.enabled ? 'Enabled' : 'Disabled'}
                                                  </button>
                                                  <button onClick={() => removePrompt(activePreset.id, prompt.id)} className="text-rose-400 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg transition-colors">
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <div>
                                                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Trigger</label>
                                                  <select
                                                      value={prompt.trigger[0] || 'all'}
                                                      onChange={e => updatePrompt(activePreset.id, prompt.id, { trigger: [e.target.value as any] })}
                                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                                                  >
                                                      <option value="all">Mọi lúc (All)</option>
                                                      <option value="normal">Chat bình thường</option>
                                                      <option value="continue">Bấm Tiếp Tục</option>
                                                      <option value="retry">Bấm Thử Lại</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Role</label>
                                                  <select
                                                      value={prompt.role}
                                                      onChange={e => updatePrompt(activePreset.id, prompt.id, { role: e.target.value as any })}
                                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                                                  >
                                                      <option value="system">System</option>
                                                      <option value="user">User</option>
                                                      <option value="model">Assistant</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Vị trí (Position)</label>
                                                  <select
                                                      value={prompt.depthType}
                                                      onChange={e => updatePrompt(activePreset.id, prompt.id, { depthType: e.target.value as any })}
                                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                                                  >
                                                      <option value="at_depth">0 (In Chat / Mật độ)</option>
                                                      <option value="top_system">1 (Before / Đầu tiên)</option>
                                                      <option value="relative">2 (After / Cuối cùng)</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1" title="Độ ưu tiên (Order), nhỏ hơn sẽ phía trước">Độ sâu (Depth) / Order</label>
                                                  <div className="flex gap-2">
                                                      <input
                                                          type="number"
                                                          value={prompt.depthValue ?? 4}
                                                          onChange={e => updatePrompt(activePreset.id, prompt.id, { depthValue: parseInt(e.target.value) })}
                                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] font-black text-emerald-400 outline-none focus:border-emerald-500/50"
                                                          placeholder="Depth"
                                                      />
                                                      <input
                                                          type="number"
                                                          value={prompt.relativeOrder ?? 100}
                                                          onChange={e => updatePrompt(activePreset.id, prompt.id, { relativeOrder: parseInt(e.target.value) })}
                                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] font-black text-emerald-400 outline-none focus:border-emerald-500/50"
                                                          placeholder="Order"
                                                      />
                                                  </div>
                                              </div>
                                          </div>

                                          <div>
                                              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] block mb-1">Nội dung Lời nhắc</label>
                                              <textarea
                                                  value={prompt.content}
                                                  onChange={e => updatePrompt(activePreset.id, prompt.id, { content: e.target.value })}
                                                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-amber-400/90 resize-none font-mono outline-none focus:border-emerald-500/50 transition-all leading-relaxed"
                                                  placeholder="Nhập nội dung prompt vào đây..."
                                              />
                                          </div>
                                      </div>
                                  ))}

                                  {activePreset.prompts.length === 0 && (
                                      <div className="text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                                          Không có lời nhắc nào.
                                      </div>
                                  )}
                              </div>

                              <div className="space-y-4">
                                  <div className="flex justify-between items-center mb-8">
                                    <div className="space-y-1">
                                      <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs flex items-center gap-2">
                                          Preset Regex Rules
                                      </h4>
                                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed hidden sm:block">Các rules này CHỈ áp dụng khi Preset này đang được bật.</p>
                                    </div>
                                      <button onClick={() => handleAddPresetRegex(activePreset.id)} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-lg active:scale-[0.98]">
                                          <Plus className="w-4 h-4" /> Thêm Local Regex
                                      </button>
                                  </div>

                                  {activePreset.attachedRegexes.map(rule => renderRegexEditor(rule, activePreset.id))}

                                  {activePreset.attachedRegexes.length === 0 && (
                                      <div className="text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                                          Không có Regex cục bộ nào.
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                    </div>
                )}
           </div>
        </div>
      </div>
    </div>
  );
};
