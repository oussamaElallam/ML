import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest, AppError, Note } from '../types';
import exportService from '../services/export.service';

export class ExportController {
  async exportNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { id } = req.params;
      const { format } = req.body;

      if (!format || !['pdf', 'docx'].includes(format)) {
        throw new AppError('Invalid export format. Use "pdf" or "docx"', 400);
      }

      // Get note
      const result = await query(
        'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Note not found', 404);
      }

      const note: Note = result.rows[0];

      if (!note.structured_note) {
        throw new AppError('Note must have structured content to export', 400);
      }

      let buffer: Buffer;
      let mimeType: string;
      let filename: string;

      if (format === 'pdf') {
        buffer = await exportService.generatePDF(
          note.structured_note,
          note.patient_identifier
        );
        mimeType = 'application/pdf';
        filename = `note-${note.id}.pdf`;
      } else {
        buffer = await exportService.generateDOCX(
          note.structured_note,
          note.patient_identifier
        );
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `note-${note.id}.docx`;
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new ExportController();
