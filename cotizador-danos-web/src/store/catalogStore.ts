import { create } from 'zustand';

export interface CatalogOption {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface GiroOption {
  id: string;
  claveGiro: string;
  descripcion: string;
  claveIncendio: string;
  categoria?: string;
}

interface CatalogStore {
  // Estado
  agents: CatalogOption[];
  subscribers: CatalogOption[];
  giros: GiroOption[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  setAgents: (agents: CatalogOption[]) => void;
  setSubscribers: (subscribers: CatalogOption[]) => void;
  setGiros: (giros: GiroOption[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  agents: [],
  subscribers: [],
  giros: [],
  loading: false,
  error: null,

  setAgents: (agents) => set({ agents }),
  setSubscribers: (subscribers) => set({ subscribers }),
  setGiros: (giros) => set({ giros }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
