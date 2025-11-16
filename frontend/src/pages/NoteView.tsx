import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { NoteEditor } from '../components/NoteEditor';
import { useNotesStore } from '../store/notesStore';
import { notesService } from '../services/notes.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Download,
  Save,
  FileText,
  Copy,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export function NoteView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentNote, loadNote } = useNotesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (id) {
      loadNoteData();
    }
  }, [id]);

  useEffect(() => {
    if (currentNote?.structuredNote) {
      const content = formatSOAPNote(currentNote.structuredNote);
      setEditorContent(content);
    }
  }, [currentNote]);

  const loadNoteData = async () => {
    setIsLoading(true);
    try {
      await loadNote(id!);
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSOAPNote = (soapNote: any) => {
    return `
      <h2>SOAP Note</h2>

      <h3>Subjective</h3>
      <p>${soapNote.subjective || 'No data'}</p>

      <h3>Objective</h3>
      <p>${soapNote.objective || 'No data'}</p>

      <h3>Assessment</h3>
      <p>${soapNote.assessment || 'No data'}</p>

      <h3>Plan</h3>
      <p>${soapNote.plan || 'No data'}</p>
    `;
  };

  const handleSave = async () => {
    if (!currentNote) return;

    setIsSaving(true);
    try {
      await notesService.updateNote(currentNote.id, {
        structuredNote: {
          subjective: extractSection('Subjective'),
          objective: extractSection('Objective'),
          assessment: extractSection('Assessment'),
          plan: extractSection('Plan'),
        },
        status: 'completed',
      });
      setHasChanges(false);
      toast.success('Note saved successfully');
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const extractSection = (sectionName: string): string => {
    // Simple extraction - in production, you'd want more robust parsing
    const regex = new RegExp(
      `<h3>${sectionName}</h3>\\s*<p>(.*?)</p>`,
      'i'
    );
    const match = editorContent.match(regex);
    return match ? match[1] : '';
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!currentNote) return;

    setIsExporting(true);
    try {
      const blob = await notesService.exportNote(currentNote.id, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `note-${format(
        new Date(currentNote.createdAt),
        'yyyy-MM-dd'
      )}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Note exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const text = tempDiv.textContent || tempDiv.innerText;
    navigator.clipboard.writeText(text);
    toast.success('Note copied to clipboard');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!currentNote) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Note not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentNote.title ||
                  `Note from ${format(new Date(currentNote.createdAt), 'PPP')}`}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Created: {format(new Date(currentNote.createdAt), 'PPp')} •
                Status: <span className="capitalize">{currentNote.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn-primary inline-flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="btn-outline inline-flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            className="btn-outline inline-flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export DOCX</span>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="btn-outline inline-flex items-center space-x-2"
          >
            <Copy className="h-5 w-5" />
            <span>Copy to Clipboard</span>
          </button>
        </div>

        {/* Patient Info */}
        {currentNote.patientIdentifier && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              Patient Identifier: {currentNote.patientIdentifier}
            </p>
          </div>
        )}

        {/* Original Text */}
        {currentNote.rawText && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Original Transcription/Input
            </h3>
            <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {currentNote.rawText}
            </div>
          </div>
        )}

        {/* SOAP Note Editor */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Structured SOAP Note
            </h3>
            {hasChanges && (
              <span className="text-sm text-amber-600">Unsaved changes</span>
            )}
          </div>

          <NoteEditor
            content={editorContent}
            onChange={(content) => {
              setEditorContent(content);
              setHasChanges(true);
            }}
            editable={true}
          />
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Please review and verify all AI-generated
            content for accuracy before using in clinical practice. This tool is
            designed to assist, not replace, professional medical judgment.
          </p>
        </div>
      </div>
    </Layout>
  );
}
