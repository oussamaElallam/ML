import { Request } from 'express';

// User Types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  specialty?: string;
  clinic_name?: string;
  license_number?: string;
  subscription_tier: 'free_trial' | 'basic' | 'pro';
  email_verified: boolean;
  verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  licenseNumber?: string;
  subscriptionTier: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SignupBody {
  email: string;
  password: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  licenseNumber?: string;
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
  user_id: string;
  title?: string;
  patient_identifier?: string;
  input_type: NoteInputType;
  raw_text?: string;
  structured_note?: SOAPNote;
  status: NoteStatus;
  template_type?: string;
  created_at: Date;
  updated_at: Date;
}

// Audio File Types
export interface AudioFile {
  id: string;
  note_id: string;
  file_url: string;
  file_name?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  mime_type?: string;
  created_at: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  plan_id?: string;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

// Usage Tracking Types
export interface UsageTracking {
  id: string;
  user_id: string;
  month: string;
  notes_count: number;
  audio_minutes: number;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
