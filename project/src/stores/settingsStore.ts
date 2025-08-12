import { create } from 'zustand';

interface SettingsState {
  investedCapital: number;
  setInvestedCapital: (value: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  investedCapital: 100000,
  setInvestedCapital: (value: number) => set({ investedCapital: Number.isFinite(value) ? value : 100000 }),
}));


