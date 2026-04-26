import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppSettings, Preset, RegexRule, PresetConfig } from '../types';
import { regexService } from '../services/regexService';
import { DEFAULT_GLOBAL_REGEXES } from '../constants/defaultRegexes';

export function usePresetRegexBinder(
  settings: AppSettings, 
  updateSettings: (s: Partial<AppSettings>) => void
) {
  const presetConfig = settings.presetConfig || {
    presets: [],
    activePresetId: null,
    globalRegexes: DEFAULT_GLOBAL_REGEXES
  };

  const presets = presetConfig.presets || [];
  
  // Merge missing default global regexes into the user's saved globalRegexes
  const savedGlobalRegexes = presetConfig.globalRegexes || [];
  const globalRegexes = useMemo(() => {
    let merged = [...savedGlobalRegexes];
    for (const defRule of DEFAULT_GLOBAL_REGEXES) {
      const idx = merged.findIndex(r => r.id === defRule.id);
      if (idx === -1) {
        merged.push(defRule);
      } else {
        // Force update defaults to ensure promptOnly, markdownOnly and latest patterns are applied
        merged[idx] = { ...merged[idx], ...defRule, enabled: merged[idx].enabled };
      }
    }
    return merged;
  }, [savedGlobalRegexes]);

  const activePresetId = presetConfig.activePresetId;

  // Tính toán regex đang active dựa trên preset được chọn
  const currentRegexes = useMemo(() => {
    if (!activePresetId) {
       return globalRegexes.filter(r => r.enabled).sort((a, b) => a.order - b.order);
    }
    
    const activePreset = presets.find(p => p.id === activePresetId);
    if (!activePreset) return globalRegexes.filter(r => r.enabled).sort((a, b) => a.order - b.order);

    // Merge: global regexes + preset-attached regexes
    const merged = [
      ...globalRegexes.filter(r => r.enabled),
      ...(activePreset.attachedRegexes || []).filter(r => r.enabled)
    ].sort((a, b) => a.order - b.order);

    return merged;
  }, [presets, globalRegexes, activePresetId]);

  // Hook vào regexService mỗi khi currentRegexes thay đổi
  useEffect(() => {
    regexService.setActiveScripts(currentRegexes);
  }, [currentRegexes]);

  const updatePresetConfig = useCallback((newConfig: Partial<PresetConfig>) => {
    updateSettings({
      presetConfig: {
        ...presetConfig,
        ...newConfig
      }
    });
  }, [updateSettings, presetConfig]);

  const activatePreset = useCallback((presetId: string | null) => {
    updatePresetConfig({ activePresetId: presetId });
  }, [updatePresetConfig]);

  const addPreset = useCallback((preset: Preset) => {
    updatePresetConfig({ presets: [...presets, preset] });
  }, [presets, updatePresetConfig]);

  const addAndActivatePreset = useCallback((preset: Preset) => {
    updatePresetConfig({
        presets: [...presets, preset],
        activePresetId: preset.id
    });
  }, [presets, updatePresetConfig]);

  const updatePreset = useCallback((presetId: string, updates: Partial<Preset>) => {
    updatePresetConfig({
        presets: presets.map(p => p.id === presetId ? { ...p, ...updates } : p)
    });
  }, [presets, updatePresetConfig]);

  const deletePreset = useCallback((presetId: string) => {
    updatePresetConfig({
        presets: presets.filter(p => p.id !== presetId),
        activePresetId: activePresetId === presetId ? null : activePresetId
    });
  }, [presets, activePresetId, updatePresetConfig]);

  const moveRegex = useCallback((
    regexId: string, 
    from: 'global' | string,
    to: 'global' | string
  ) => {
    if (from === to) return;

    let targetRule: RegexRule | undefined;
    let newGlobalRegexes = [...globalRegexes];
    let newPresets = [...presets];

    // Find and remove from origin
    if (from === 'global') {
      targetRule = newGlobalRegexes.find(r => r.id === regexId);
      newGlobalRegexes = newGlobalRegexes.filter(r => r.id !== regexId);
    } else {
      const presetIndex = newPresets.findIndex(p => p.id === from);
      if (presetIndex !== -1) {
          targetRule = newPresets[presetIndex].attachedRegexes.find(r => r.id === regexId);
          newPresets[presetIndex] = {
              ...newPresets[presetIndex],
              attachedRegexes: newPresets[presetIndex].attachedRegexes.filter(r => r.id !== regexId)
          };
      }
    }

    if (!targetRule) return;

    // Add to destination
    if (to === 'global') {
        newGlobalRegexes.push({ ...targetRule, scope: 'global' });
    } else {
        const presetIndex = newPresets.findIndex(p => p.id === to);
        if (presetIndex !== -1) {
            newPresets[presetIndex] = {
                ...newPresets[presetIndex],
                attachedRegexes: [...newPresets[presetIndex].attachedRegexes, { ...targetRule, scope: 'preset' }]
            };
        }
    }

    updatePresetConfig({
        globalRegexes: newGlobalRegexes,
        presets: newPresets
    });

  }, [globalRegexes, presets, updatePresetConfig]);

  const addRegexToGlobal = useCallback((rule: RegexRule) => {
      updatePresetConfig({ globalRegexes: [...globalRegexes, { ...rule, scope: 'global' }] });
  }, [globalRegexes, updatePresetConfig]);

  const addRegexToPreset = useCallback((presetId: string, rule: RegexRule) => {
      updatePresetConfig({
          presets: presets.map(p => p.id === presetId ? { ...p, attachedRegexes: [...p.attachedRegexes, { ...rule, scope: 'preset' }]} : p)
      });
  }, [presets, updatePresetConfig]);

  const removeRegex = useCallback((regexId: string, scopeId: 'global' | string) => {
     if (scopeId === 'global') {
         updatePresetConfig({ globalRegexes: globalRegexes.filter(r => r.id !== regexId) });
     } else {
         updatePresetConfig({
             presets: presets.map(p => p.id === scopeId ? { ...p, attachedRegexes: p.attachedRegexes.filter(r => r.id !== regexId) } : p)
         });
     }
  }, [globalRegexes, presets, updatePresetConfig]);

  const updateRegex = useCallback((regexId: string, scopeId: 'global' | string, updates: Partial<RegexRule>) => {
    if (scopeId === 'global') {
        updatePresetConfig({
            globalRegexes: globalRegexes.map(r => r.id === regexId ? { ...r, ...updates } : r)
        });
    } else {
        updatePresetConfig({
            presets: presets.map(p => p.id === scopeId ? {
                ...p, 
                attachedRegexes: p.attachedRegexes.map(r => r.id === regexId ? { ...r, ...updates } : r)
            } : p)
        });
    }
  }, [globalRegexes, presets, updatePresetConfig]);

  return {
    presets,
    globalRegexes,
    currentRegexes,
    activePresetId,
    activatePreset,
    addPreset,
    addAndActivatePreset,
    updatePreset,
    deletePreset,
    moveRegex,
    addRegexToGlobal,
    addRegexToPreset,
    removeRegex,
    updateRegex
  };
}
