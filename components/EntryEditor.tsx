import React from "react";
import {
  WorldBookEntry,
  EntryPosition,
  SelectiveLogic,
} from "../types/world-book";
import { useWorldBook } from "../context/WorldBookContext";

export const EntryEditor: React.FC<{ entry: WorldBookEntry }> = ({ entry }) => {
  const { updateEntry } = useWorldBook();

  const update = (field: keyof WorldBookEntry, value: any) => {
    updateEntry(entry.uid, { [field]: value });
  };

  return (
    <div className="entry-editor bg-neutral-900 border border-neutral-700 p-4 rounded-xl mb-4 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Comment / Memo"
          value={entry.comment || ""}
          onChange={(e) => update("comment", e.target.value)}
          className="flex-1 bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
        />
        <input
          type="number"
          value={entry.order}
          onChange={(e) => update("order", parseInt(e.target.value) || 0)}
          className="w-24 bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
          title="Insertion Order"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">
          Primary Keys (comma separated)
        </label>
        <input
          type="text"
          value={entry.key.join(", ")}
          onChange={(e) =>
            update(
              "key",
              e.target.value.split(",").map((s) => s.trim()),
            )
          }
          className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-emerald-400 transition-colors">
          <input
            type="checkbox"
            checked={entry.selective}
            onChange={(e) => update("selective", e.target.checked)}
            className="accent-emerald-500"
          />
          Selective
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-emerald-400 transition-colors">
          <input
            type="checkbox"
            checked={entry.constant}
            onChange={(e) => update("constant", e.target.checked)}
            className="accent-emerald-500"
          />
          Constant
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-emerald-400 transition-colors">
          <input
            type="checkbox"
            checked={entry.caseSensitive}
            onChange={(e) => update("caseSensitive", e.target.checked)}
            className="accent-emerald-500"
          />
          Case Sensitive
        </label>
      </div>

      {entry.selective && (
        <div className="space-y-2">
          <label className="block text-xs text-neutral-400">
            Secondary Keys
          </label>
          <input
            type="text"
            value={entry.keysecondary.join(", ")}
            onChange={(e) =>
              update(
                "keysecondary",
                e.target.value.split(",").map((s) => s.trim()),
              )
            }
            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
          />
          <select
            value={entry.selectiveLogic}
            onChange={(e) => update("selectiveLogic", parseInt(e.target.value))}
            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
          >
            <option value={SelectiveLogic.AND_ANY}>
              AND ANY (có ít nhất 1)
            </option>
            <option value={SelectiveLogic.AND_ALL}>AND ALL (tất cả)</option>
            <option value={SelectiveLogic.NOT_ANY}>NOT ANY (không có)</option>
            <option value={SelectiveLogic.NOT_ALL}>
              NOT ALL (không phải tất cả)
            </option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Position</label>
        <select
          value={entry.position}
          onChange={(e) => update("position", parseInt(e.target.value))}
          className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
        >
          <option value={EntryPosition.BEFORE_CHAR}>Before Char</option>
          <option value={EntryPosition.AFTER_CHAR}>After Char</option>
          <option value={EntryPosition.BEFORE_EXAMPLE}>Before Example</option>
          <option value={EntryPosition.AFTER_EXAMPLE}>After Example</option>
          <option value={EntryPosition.AT_DEPTH}>At Depth</option>
        </select>
      </div>

      {entry.position === EntryPosition.AT_DEPTH && (
        <input
          type="number"
          value={entry.depth}
          onChange={(e) => update("depth", parseInt(e.target.value) || 0)}
          placeholder="Depth"
          className="w-24 bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
        />
      )}

      <textarea
        value={entry.content || ""}
        onChange={(e) => update("content", e.target.value)}
        rows={4}
        className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none resize-y"
        placeholder="Lore content..."
      />

      <div className="flex gap-4 text-xs font-mono text-neutral-500">
        <span>UID: {entry.uid}</span>
        <span>
          Est. Tokens: {Math.ceil((entry.content || "").length / 3.5)}
        </span>
      </div>
    </div>
  );
};
