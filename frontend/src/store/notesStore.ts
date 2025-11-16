import { create } from 'zustand';
import type { Note, DashboardStats } from '../types';
import { notesService } from '../services/notes.service';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  loadNotes: (page?: number, search?: string) => Promise<void>;
  loadNote: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  loadDashboardStats: () => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  dashboardStats: null,
  isLoading: false,
  totalPages: 1,
  currentPage: 1,

  setNotes: (notes) => set({ notes }),

  setCurrentNote: (note) => set({ currentNote: note }),

  loadNotes: async (page = 1, search = '') => {
    set({ isLoading: true });
    try {
      const response = await notesService.getNotes({
        page,
        limit: 20,
        search: search || undefined,
      });
      set({
        notes: response.notes,
        totalPages: response.totalPages,
        currentPage: response.page,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadNote: async (id: string) => {
    set({ isLoading: true });
    try {
      const note = await notesService.getNoteById(id);
      set({ currentNote: note, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    set({ isLoading: true });
    try {
      await notesService.deleteNote(id);
      const { notes } = get();
      set({
        notes: notes.filter((n) => n.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await notesService.getDashboardStats();
      set({ dashboardStats: stats, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
