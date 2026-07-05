
import React, { useState } from 'react';
import { UserProfile } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { autoCalculateAppearance } from '../utils/appearance';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Androgyn"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Kurvig"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const UserProfileEditor: React.FC<Props> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleAppearanceChange = (field: keyof UserProfile['appearance'], value: string) => {
    let updatedAppearance = { ...formData.appearance, [field]: value };
    updatedAppearance = autoCalculateAppearance(updatedAppearance, field);
    setFormData({
      ...formData,
      appearance: updatedAppearance
    });
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 min-h-screen sm:bg-transparent sm:py-10 sm:items-center overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900/50 sm:rounded-3xl border sm:border-slate-700 backdrop-blur-md p-6 sm:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-fantasy text-amber-500">Mein Profil</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Grundlage für deine Helden</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Bevorzugte Rolle</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                placeholder="z.B. Magier"
                value={formData.preferredRole || ''}
                onChange={e => setFormData({...formData, preferredRole: e.target.value})}
              />
            </div>
          </div>

          <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stamm-Aussehen</h4>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="text-[10px] text-slate-500 block mb-1">Geschlecht</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none"
                  value={formData.appearance.gender || 'Weiblich'}
                  onChange={e => handleAppearanceChange('gender', e.target.value)}
                >
                  {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Alter</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  value={formData.appearance.age || ''}
                  onChange={e => handleAppearanceChange('age', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Statur</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none"
                  value={formData.appearance.build || 'Schlank'}
                  onChange={e => handleAppearanceChange('build', e.target.value)}
                >
                  {BUILD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Haarfarbe</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  value={formData.appearance.hairColor || ''}
                  onChange={e => handleAppearanceChange('hairColor', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Augenfarbe</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  value={formData.appearance.eyeColor || ''}
                  onChange={e => handleAppearanceChange('eyeColor', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Körbchengröße</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none"
                  value={formData.appearance.cupSize || '-'}
                  onChange={e => handleAppearanceChange('cupSize', e.target.value)}
                >
                  {CUP_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Größe & Körpermaße</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="Größe (z.B. 170cm)"
                    value={formData.appearance.height || ''}
                    onChange={e => handleAppearanceChange('height', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="Maße (z.B. 90-60-90)"
                    value={formData.appearance.measurements || ''}
                    onChange={e => handleAppearanceChange('measurements', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Bevorzugte Rassemerkmale</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
                placeholder="z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe/Muster/Verteilung)"
                value={formData.appearance.raceFeatures || ''}
                onChange={e => setFormData({...formData, appearance: {...formData.appearance, raceFeatures: e.target.value}})}
              />
              <p className="text-[10px] text-slate-500 font-normal">Alle Abweichungen von der menschlichen Norm (z.B. Katzenohren, tierische Augen, Fell, etc.)</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase">Deine Geschichte (Bio)</label>
            <AutoExpandingTextarea 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white min-h-[128px] outline-none focus:border-amber-500 text-sm"
              placeholder="Erzähle der KI wer du bist..."
              value={formData.bio || ''}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onCancel} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-colors">Abbrechen</button>
            <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-500 shadow-lg shadow-amber-900/20 transition-all">Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileEditor;
