import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import notesController from '../controllers/notes.controller';
import exportController from '../controllers/export.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /audio\/(mpeg|mp3|wav|m4a|webm)/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

router.post('/', notesController.createNote.bind(notesController));
router.post('/upload-audio', upload.single('file'), notesController.uploadAudio.bind(notesController));
router.post('/:id/generate', notesController.generateSOAPNote.bind(notesController));
router.get('/', notesController.getNotes.bind(notesController));
router.get('/dashboard/stats', notesController.getDashboardStats.bind(notesController));
router.get('/:id', notesController.getNoteById.bind(notesController));
router.put('/:id', notesController.updateNote.bind(notesController));
router.delete('/:id', notesController.deleteNote.bind(notesController));
router.post('/:id/export', exportController.exportNote.bind(exportController));

export default router;
