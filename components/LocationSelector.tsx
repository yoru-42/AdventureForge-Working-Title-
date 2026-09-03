import React, { useState, useMemo, useEffect } from 'react';
import { LoreEntry } from '../types';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loreDatabase: LoreEntry[];
  placeholder?: string;
  world?: any;
  className?: string;
}

interface LocationNode {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  description?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value = "",
  onChange,
  loreDatabase = [],
  placeholder = 'z.B. Zum Tänzelnden Pony',
  world,
  className
}) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const safeValue = value || "";

  // 1. Convert Lore Orte into standard LocationNodes
  const loreNodes = useMemo(() => {
    const locations = loreDatabase.filter(l => l.category === 'Orte' || (l.category as string) === 'Weltkarte');
    return locations.map(l => {
      const mapLevel = l.details?.mapLevel || 'micro';
      let parentId = l.details?.parentPlaceId || null;
      
      // If parentId is a string name, resolve it to an ID where possible
      if (parentId) {
        const parentEntry = locations.find(p => (p.title || '').trim().toLowerCase() === parentId!.trim().toLowerCase());
        if (parentEntry) {
          parentId = parentEntry.id;
        }
      }

      return {
        id: l.id,
        name: l.title || '',
        type: mapLevel === 'macro' ? 'welt' 
            : mapLevel === 'meso' ? 'region' 
            : mapLevel === 'micro' ? 'ort' 
            : mapLevel === 'building' ? 'gebäude' 
            : 'ort',
        parentId: parentId,
        description: l.description
      } as LocationNode;
    });
  }, [loreDatabase]);

  // 2. Convert World Territories into standard LocationNodes
  const territoryNodes = useMemo(() => {
    const territories = world?.territories || [];
    return territories.map((t: any) => ({
      id: t.id,
      name: t.name || '',
      type: t.type,
      parentId: t.parentId || null,
      description: t.description
    } as LocationNode));
  }, [world?.territories]);

  // 2b. Convert World Region Markers into standard LocationNodes
  const regionMarkerNodes = useMemo(() => {
    const markers = world?.regionMarkers || [];
    return markers.map((m: any) => ({
      id: m.id || `marker-${m.name}`,
      name: m.name || '',
      type: m.type || 'ort',
      parentId: m.parentId || null,
      description: m.description
    } as LocationNode));
  }, [world?.regionMarkers]);

  // 3. Determine active nodes list (combine world territories, region markers, and lore Orte)
  const nodes = useMemo(() => {
    const combined = [...territoryNodes];

    regionMarkerNodes.forEach(rn => {
      const exists = combined.some(cn => cn.id === rn.id || (cn.name || '').trim().toLowerCase() === (rn.name || '').trim().toLowerCase());
      if (!exists) {
        combined.push(rn);
      }
    });

    loreNodes.forEach(ln => {
      const exists = combined.some(cn => cn.id === ln.id || (cn.name || '').trim().toLowerCase() === (ln.name || '').trim().toLowerCase());
      if (!exists) {
        combined.push(ln);
      }
    });

    return combined;
  }, [territoryNodes, regionMarkerNodes, loreNodes]);

  // 4. Build hierarchically ordered flat list with depth information for the <select> options
  const hierarchyOptions = useMemo(() => {
    const parentToChildren: Record<string, LocationNode[]> = {};
    const roots: LocationNode[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    nodes.forEach(node => {
      let pId = node.parentId;
      // Sanitize parentId to check for common string representations of null
      if (pId === 'null' || pId === 'undefined' || pId === 'none' || pId === 'Keines' || !pId) {
        pId = null;
      }
      
      // Orphan protection: if the parent does not exist in the nodes array, treat this node as a root
      if (pId && !nodeIds.has(pId)) {
        pId = null;
      }

      if (!pId) {
        roots.push({ ...node, parentId: null });
      } else {
        const cleanedNode = { ...node, parentId: pId };
        if (!parentToChildren[pId]) {
          parentToChildren[pId] = [];
        }
        parentToChildren[pId].push(cleanedNode);
      }
    });

    // Sort alphabetically
    roots.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    Object.keys(parentToChildren).forEach(key => {
      parentToChildren[key].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    const result: { id: string; name: string; fullPath: string; depth: number }[] = [];

    const traverse = (node: LocationNode, depth: number, currentPath: string) => {
      const nodeName = node.name || 'Unbenannter Ort';
      const fullPath = currentPath ? `${currentPath} ➔ ${nodeName}` : nodeName;
      result.push({
        id: node.id,
        name: nodeName,
        fullPath,
        depth
      });

      const children = parentToChildren[node.id] || [];
      children.forEach(child => traverse(child, depth + 1, fullPath));
    };

    roots.forEach(root => traverse(root, 0, ''));
    return result;
  }, [nodes]);

  // 5. Try to find if currently selected value matches any option in the list
  const matchedOption = useMemo(() => {
    if (!safeValue) return null;
    
    // Clean coordinates like " (X:10, Y:15)" from the value for matching
    const cleanValue = safeValue.replace(/\s*\(X:\d+,\s*Y:\d+\)/i, '').trim();
    if (!cleanValue) return null;

    // Try exact full path match first
    const exact = hierarchyOptions.find(opt => opt.fullPath.toLowerCase() === cleanValue.toLowerCase());
    if (exact) return exact;
    // Try trailing name match
    const tail = hierarchyOptions.find(opt => opt.fullPath.split(' ➔ ').pop()?.toLowerCase() === cleanValue.toLowerCase());
    return tail;
  }, [safeValue, hierarchyOptions]);

  // 6. Automatically sync manual mode if we have a custom typed value
  useEffect(() => {
    if (safeValue && !matchedOption) {
      setIsManualMode(true);
    } else {
      setIsManualMode(false);
    }
  }, [safeValue, matchedOption]);

  const selectStyle = className || "w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer";

  if (isManualMode) {
    return (
      <div className="flex gap-1.5 w-full items-center" id="location-selector-manual-container">
        <input
          type="text"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-500"
          placeholder={placeholder}
          value={safeValue}
          onChange={e => onChange(e.target.value)}
          autoFocus
          id="location-selector-manual-input"
        />
        <button
          type="button"
          onClick={() => {
            setIsManualMode(false);
            onChange("");
          }}
          className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all cursor-pointer h-[38px] shrink-0"
          title="Zurück zur Auswahlliste"
          id="location-selector-back-btn"
        >
          <i className="fa-solid fa-list text-[10px]"></i>
          <span className="hidden sm:inline">Auswahlliste</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full text-slate-200" id="location-selector-root">
      <select
        className={selectStyle}
        value={matchedOption ? matchedOption.fullPath : safeValue ? "custom" : ""}
        onChange={e => {
          const val = e.target.value;
          if (val === "manual") {
            setIsManualMode(true);
            onChange("");
          } else if (val === "custom") {
            // keep custom
          } else {
            onChange(val);
          }
        }}
        id="location-selector-select"
      >
        <option value="">-- Standort wählen --</option>
        
        {safeValue && !matchedOption && (
          <option value="custom">{safeValue} (Eigener Ort)</option>
        )}

        {hierarchyOptions.map((opt, index) => {
          const indent = '\u00A0\u00A0'.repeat(opt.depth);
          const prefix = opt.depth > 0 ? '↳ ' : '';
          return (
            <option key={`${opt.id}-${index}`} value={opt.fullPath}>
              {indent}{prefix}{opt.name}
            </option>
          );
        })}

        <option value="manual" className="text-amber-400 font-semibold bg-slate-950">
          Freitext eingeben (Eigener Ort)...
        </option>
      </select>
    </div>
  );
};
