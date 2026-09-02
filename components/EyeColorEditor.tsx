import React, { useState, useEffect } from 'react';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { parseHeterochromiaDetails, formatHeterochromiaEyeColor } from '../utils/eyeColorHelper';

export interface EyeColorEditorProps {
  eyeColor?: string;
  hasHeterochromia?: boolean;
  eyeColorLeft?: string;
  eyeColorRight?: string;
  onChange: (updates: {
    eyeColor: string;
    hasHeterochromia?: boolean;
    eyeColorLeft?: string;
    eyeColorRight?: string;
  }) => void;
  labelClassName?: string;
  inputClassName?: string;
}

export const EyeColorEditor: React.FC<EyeColorEditorProps> = ({
  eyeColor = '',
  hasHeterochromia,
  eyeColorLeft,
  eyeColorRight,
  onChange,
  labelClassName = 'text-[10px] text-slate-500 block uppercase font-bold',
  inputClassName = 'w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500'
}) => {
  const parsed = parseHeterochromiaDetails(hasHeterochromia, eyeColor, eyeColorLeft, eyeColorRight);
  const [isHetero, setIsHetero] = useState<boolean>(parsed.hasHeterochromia);
  const [left, setLeft] = useState<string>(parsed.eyeColorLeft);
  const [right, setRight] = useState<string>(parsed.eyeColorRight);

  useEffect(() => {
    const current = parseHeterochromiaDetails(hasHeterochromia, eyeColor, eyeColorLeft, eyeColorRight);
    setIsHetero(current.hasHeterochromia);
    setLeft(current.eyeColorLeft);
    setRight(current.eyeColorRight);
  }, [hasHeterochromia, eyeColor, eyeColorLeft, eyeColorRight]);

  const handleToggleHeterochromia = (checked: boolean) => {
    setIsHetero(checked);
    if (checked) {
      const initialLeft = left || (eyeColor ? eyeColor.replace(/^heterochromie:?\s*/i, '').trim() : '');
      const initialRight = right || '';
      const formatted = formatHeterochromiaEyeColor(initialLeft, initialRight);
      setLeft(initialLeft);
      setRight(initialRight);
      onChange({
        hasHeterochromia: true,
        eyeColorLeft: initialLeft,
        eyeColorRight: initialRight,
        eyeColor: formatted
      });
    } else {
      const fallbackColor = left || eyeColor.replace(/^heterochromie(\s*\(links:?\s*|\s*:\s*links\s*|\s+)?/i, '').replace(/\)?$/, '').split(/,\s*rechts:?/i)[0].trim() || '';
      onChange({
        hasHeterochromia: false,
        eyeColorLeft: '',
        eyeColorRight: '',
        eyeColor: fallbackColor
      });
    }
  };

  const handleLeftChange = (val: string) => {
    setLeft(val);
    const formatted = formatHeterochromiaEyeColor(val, right);
    onChange({
      hasHeterochromia: true,
      eyeColorLeft: val,
      eyeColorRight: right,
      eyeColor: formatted
    });
  };

  const handleRightChange = (val: string) => {
    setRight(val);
    const formatted = formatHeterochromiaEyeColor(left, val);
    onChange({
      hasHeterochromia: true,
      eyeColorLeft: left,
      eyeColorRight: val,
      eyeColor: formatted
    });
  };

  const handleSingleChange = (val: string) => {
    onChange({
      hasHeterochromia: false,
      eyeColorLeft: '',
      eyeColorRight: '',
      eyeColor: val
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClassName}>Augenfarbe</label>
        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 transition-colors select-none">
          <input
            type="checkbox"
            checked={isHetero}
            onChange={e => handleToggleHeterochromia(e.target.checked)}
            className="w-3 h-3 rounded bg-slate-900 border border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
          />
          <span>Heterochromie</span>
        </label>
      </div>

      {isHetero ? (
        <div className="grid grid-cols-2 gap-1.5">
          <AutoExpandingTextarea
            className={inputClassName}
            placeholder="Links (z.B. Rubinrot)"
            value={left}
            onChange={e => handleLeftChange(e.target.value)}
          />
          <AutoExpandingTextarea
            className={inputClassName}
            placeholder="Rechts (z.B. Gold)"
            value={right}
            onChange={e => handleRightChange(e.target.value)}
          />
        </div>
      ) : (
        <AutoExpandingTextarea
          className={inputClassName}
          placeholder="z.B. Blau"
          value={eyeColor || ''}
          onChange={e => handleSingleChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default EyeColorEditor;
