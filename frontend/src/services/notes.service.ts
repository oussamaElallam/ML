import { apiClient } from './api';
import type {
  Note,
  CreateNoteRequest,
  GenerateNoteResponse,
  SOAPNote,
  DashboardStats,
  ExportFormat,
} from '../types';

export class NotesService {
  async createNote(data: CreateNoteRequest, onProgress?: (progress: number) => void): Promise<Note> {
    if (data.audioFile) {
      // Upload audio file
      const uploadResponse = await apiClient.uploadFile<{ noteId: string; rawText: string }>(
        '/notes/upload-audio',
        data.audioFile,
        onProgress
      );

      // Create note with transcribed text
      const noteResponse = await apiClient.post<Note>('/notes', {
        inputType: data.inputType,
        rawText: uploadResponse.data!.rawText,
        patientIdentifier: data.patientIdentifier,
        templateType: data.templateType,
      });

      return noteResponse.data!;
    } else {
      // Create note with text
      const response = await apiClient.post<Note>('/notes', data);
      return response.data!;
    }
  }

  async generateSOAPNote(noteId: string): Promise<SOAPNote> {
    const response = await apiClient.post<GenerateNoteResponse>(`/notes/${noteId}/generate`);
    return response.data!.structuredNote;
  }

  async transcribeAudio(audioFile: File, onProgress?: (progress: number) => void): Promise<string> {
    const response = await apiClient.uploadFile<{ text: string }>(
      '/transcribe',
      audioFile,
      onProgress
    );
    return response.data!.text;
  }

  async getNotes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ notes: Note[]; total: number; page: number; totalPages: number }> {
    const response = await apiClient.get<{
      notes: Note[];
      total: number;
      page: number;
      totalPages: number;
    }>('/notes', params);
    return response.data!;
  }

  async getNoteById(noteId: string): Promise<Note> {
    const response = await apiClient.get<Note>(`/notes/${noteId}`);
    return response.data!;
  }

  async updateNote(noteId: string, data: Partial<Note>): Promise<Note> {
    const response = await apiClient.put<Note>(`/notes/${noteId}`, data);
    return response.data!;
  }

  async deleteNote(noteId: string): Promise<void> {
    await apiClient.delete(`/notes/${noteId}`);
  }

  async exportNote(noteId: string, format: ExportFormat): Promise<Blob> {
    const response = await apiClient.post<Blob>(
      `/notes/${noteId}/export`,
      { format },
      { responseType: 'blob' }
    );
    return response.data!;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/notes/dashboard/stats');
    return response.data!;
  }

  async searchNotes(query: string): Promise<Note[]> {
    const response = await apiClient.get<Note[]>('/notes/search', { q: query });
    return response.data!;
  }
}

export const notesService = new NotesService();
