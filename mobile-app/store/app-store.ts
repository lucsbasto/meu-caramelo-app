import { create } from "zustand";

type AppState = {
  selectedPointId: string | null;
  setSelectedPointId: (id: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedPointId: null,
  setSelectedPointId: (id) => set({ selectedPointId: id }),
}));
