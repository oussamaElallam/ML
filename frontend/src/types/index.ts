// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  licenseNumber?: string;
  subscriptionTier: 'free_trial' | 'basic' | 'pro';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  planId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// Note Types
export type NoteInputType = 'audio_record' | 'audio_upload' | 'text';
export type NoteStatus = 'draft' | 'completed' | 'archived';

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface Note {
  id: string;
  userId: string;
  title?: string;
  patientIdentifier?: string;
  inputType: NoteInputType;
  rawText?: string;
  structuredNote?: SOAPNote;
  status: NoteStatus;
  templateType?: string;
  createdAt: string;
  updatedAt: string;
}

// Audio File Types
export interface AudioFile {
  id: string;
  noteId: string;
  fileUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  mimeType?: string;
  createdAt: string;
}

// Template Types
export interface Template {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  content: {
    sections: string[];
  };
  isPublic: boolean;
  specialty?: string;
  createdAt: string;
  updatedAt: string;
}

// Usage Tracking Types
export interface UsageTracking {
  id: string;
  userId: string;
  month: string;
  notesCount: number;
  audioMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  specialty?: string;
  clinicName?: string;
  licenseNumber?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  subscription?: Subscription;
}

// Note Creation Types
export interface CreateNoteRequest {
  inputType: NoteInputType;
  rawText?: string;
  audioFile?: File;
  patientIdentifier?: string;
  templateType?: string;
}

export interface GenerateNoteResponse {
  note: Note;
  structuredNote: SOAPNote;
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    notesPerMonth: number | null; // null = unlimited
    audioMinutesPerMonth: number | null; // null = unlimited
  };
}

// Export Types
export type ExportFormat = 'pdf' | 'docx';

export interface ExportRequest {
  noteId: string;
  format: ExportFormat;
  includeHeader?: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalNotes: number;
  notesThisMonth: number;
  audioMinutesThisMonth: number;
  recentNotes: Note[];
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Recording State
export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob?: Blob;
}
