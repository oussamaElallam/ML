import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AuthRequest, AppError, Note, SOAPNote } from '../types';
import aiService from '../services/ai.service';
import fs from 'fs';
import path from 'path';

export class NotesController {
  async createNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { inputType, rawText, patientIdentifier, templateType } = req.body;

      if (!inputType) {
        throw new AppError('Input type is required', 400);
      }

      if (inputType === 'text' && !rawText) {
        throw new AppError('Raw text is required for text input type', 400);
      }

      // Create note
      const noteId = uuidv4();
      const result = await query(
        `INSERT INTO notes (id, user_id, input_type, raw_text, patient_identifier, template_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          noteId,
          req.user.id,
          inputType,
          rawText || null,
          patientIdentifier || null,
          templateType || null,
          'draft',
        ]
      );

      const note = result.rows[0];

      // Track usage
      await this.trackUsage(req.user.id);

      res.status(201).json({
        success: true,
        data: this.formatNote(note),
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAudio(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      if (!req.file) {
        throw new AppError('No audio file uploaded', 400);
      }

      // Transcribe audio
      const transcription = await aiService.transcribeAudio(req.file.path);

      // Calculate duration (simplified - in production, use proper audio analysis)
      const fileSizeInMB = req.file.size / (1024 * 1024);
      const estimatedDurationSeconds = Math.round(fileSizeInMB * 60); // Rough estimate

      // Track audio usage
      await this.trackAudioUsage(req.user.id, estimatedDurationSeconds / 60);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: {
          rawText: transcription,
          durationSeconds: estimatedDurationSeconds,
        },
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Error deleting file:', e);
        }
      }
      next(error);
    }
  }

  async generateSOAPNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { id } = req.params;

      // Get note
      const noteResult = await query(
        'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (noteResult.rows.length === 0) {
        throw new AppError('Note not found', 404);
      }

      const note: Note = noteResult.rows[0];

      if (!note.raw_text) {
        throw new AppError('Note has no text to generate from', 400);
      }

      // Generate SOAP note using Claude
      const soapNote = await aiService.generateSOAPNote(note.raw_text);

      // Update note with structured content
      const updateResult = await query(
        `UPDATE notes
         SET structured_note = $1, status = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [JSON.stringify(soapNote), 'completed', id]
      );

      const updatedNote = updateResult.rows[0];

      res.json({
        success: true,
        data: {
          note: this.formatNote(updatedNote),
          structuredNote: soapNote,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let queryText = 'SELECT * FROM notes WHERE user_id = $1';
      const params: any[] = [req.user.id];
      let paramIndex = 2;

      if (search) {
        queryText += ` AND (raw_text ILIKE $${paramIndex} OR patient_identifier ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      queryText += ' ORDER BY created_at DESC';

      // Get total count
      const countResult = await query(queryText.replace('SELECT *', 'SELECT COUNT(*)'), params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      res.json({
        success: true,
        data: {
          notes: result.rows.map((note) => this.formatNote(note)),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { id } = req.params;

      const result = await query(
        'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Note not found', 404);
      }

      res.json({
        success: true,
        data: this.formatNote(result.rows[0]),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { id } = req.params;
      const { title, structuredNote, status, patientIdentifier } = req.body;

      const result = await query(
        `UPDATE notes
         SET title = COALESCE($1, title),
             structured_note = COALESCE($2, structured_note),
             status = COALESCE($3, status),
             patient_identifier = COALESCE($4, patient_identifier),
             updated_at = NOW()
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [
          title,
          structuredNote ? JSON.stringify(structuredNote) : null,
          status,
          patientIdentifier,
          id,
          req.user.id,
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError('Note not found', 404);
      }

      res.json({
        success: true,
        data: this.formatNote(result.rows[0]),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { id } = req.params;

      const result = await query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Note not found', 404);
      }

      res.json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total notes
      const totalResult = await query(
        'SELECT COUNT(*) FROM notes WHERE user_id = $1',
        [req.user.id]
      );

      // Get notes this month
      const monthResult = await query(
        'SELECT COUNT(*) FROM notes WHERE user_id = $1 AND created_at >= $2',
        [req.user.id, firstDayOfMonth]
      );

      // Get audio minutes this month
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageResult = await query(
        'SELECT audio_minutes FROM usage_tracking WHERE user_id = $1 AND month = $2',
        [req.user.id, month]
      );

      // Get recent notes
      const recentResult = await query(
        'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          totalNotes: parseInt(totalResult.rows[0].count),
          notesThisMonth: parseInt(monthResult.rows[0].count),
          audioMinutesThisMonth: usageResult.rows[0]?.audio_minutes || 0,
          recentNotes: recentResult.rows.map((note) => this.formatNote(note)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async trackUsage(userId: string) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await query(
      `INSERT INTO usage_tracking (user_id, month, notes_count, audio_minutes)
       VALUES ($1, $2, 1, 0)
       ON CONFLICT (user_id, month)
       DO UPDATE SET notes_count = usage_tracking.notes_count + 1`,
      [userId, month]
    );
  }

  private async trackAudioUsage(userId: string, minutes: number) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await query(
      `INSERT INTO usage_tracking (user_id, month, notes_count, audio_minutes)
       VALUES ($1, $2, 0, $3)
       ON CONFLICT (user_id, month)
       DO UPDATE SET audio_minutes = usage_tracking.audio_minutes + $3`,
      [userId, month, minutes]
    );
  }

  private formatNote(note: any) {
    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      patientIdentifier: note.patient_identifier,
      inputType: note.input_type,
      rawText: note.raw_text,
      structuredNote: note.structured_note,
      status: note.status,
      templateType: note.template_type,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }
}

export default new NotesController();
