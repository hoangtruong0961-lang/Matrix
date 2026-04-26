
import { MvuUpdateCommand } from '../types';

export class MvuService {
  /**
   * Replaces macros in a string with values from the MVU state.
   * Format: {{get_message_variable::stat_data.path.to.variable}}
   */
  replaceMacros(text: string, state: Record<string, any>): string {
    if (!text || !state) return text;

    return text.replace(/\{\{get_message_variable::stat_data\.([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(state, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Parses an AI response for <update> blocks and extracts _.set commands.
   */
  parseUpdates(response: string): MvuUpdateCommand[] {
    const updates: MvuUpdateCommand[] = [];
    const updateBlockRegex = /<update>([\s\S]*?)<\/update>/g;
    let match;

    while ((match = updateBlockRegex.exec(response)) !== null) {
      const blockContent = match[1];
      // Regex for _.set('path', oldValue, newValue); or _.set('path', newValue);
      const setRegex = /_\.set\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^,)]+)(?:\s*,\s*([^,)]+))?\s*\)\s*;?\s*(?:\/\/.*)?/g;
      let setMatch;

      while ((setMatch = setRegex.exec(blockContent)) !== null) {
        const path = setMatch[1];
        let oldValue: any = undefined;
        let newValue: any = undefined;

        if (setMatch[3] !== undefined) {
          // Three arguments: path, old, new
          oldValue = this.parseValue(setMatch[2]);
          newValue = this.parseValue(setMatch[3]);
        } else {
          // Two arguments: path, new
          newValue = this.parseValue(setMatch[2]);
        }

        // Extract reason if available in comment
        const reasonMatch = /\/\/\s*(.*)/.exec(setMatch[0]);
        const reason = reasonMatch ? reasonMatch[1].trim() : undefined;

        updates.push({ path, oldValue, newValue, reason });
      }
    }

    return updates;
  }

  /**
   * Applies updates to the state and returns the new state.
   */
  applyUpdates(state: Record<string, any>, updates: MvuUpdateCommand[]): Record<string, any> {
    const newState = JSON.parse(JSON.stringify(state)); // Deep clone

    for (const update of updates) {
      this.setValueByPath(newState, update.path, update.newValue);
    }

    return newState;
  }

  /**
   * Parses initial variables from a string (YAML-like or JSON).
   * For simplicity, we'll support a basic YAML-like structure as described in the prompt.
   */
  parseInitVars(content: string): Record<string, any> {
    const state: Record<string, any> = {};
    const lines = content.split('\n');
    const stack: { indent: number; obj: any; key: string }[] = [{ indent: -1, obj: state, key: '' }];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.search(/\S/);
      const colonIndex = trimmed.indexOf(':');
      
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      const valueStr = trimmed.substring(colonIndex + 1).trim();

      // Pop from stack if indent is less than or equal to current top
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const currentParent = stack[stack.length - 1].obj;

      if (valueStr === '') {
        // It's a folder/object
        currentParent[key] = {};
        stack.push({ indent, obj: currentParent[key], key });
      } else {
        // It's a value
        currentParent[key] = this.parseValue(valueStr);
      }
    }

    return state;
  }

  private parseValue(val: string): any {
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) return val.substring(1, val.length - 1);
    if (val.startsWith("'") && val.endsWith("'")) return val.substring(1, val.length - 1);
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    if (!isNaN(Number(val)) && val !== '') return Number(val);
    return val;
  }

  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
}

export const mvuService = new MvuService();
