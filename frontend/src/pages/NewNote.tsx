import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { notesService } from '../services/notes.service';
import toast from 'react-hot-toast';
import {
  Mic,
  Square,
  Upload,
  FileText,
  Loader2,
  X,
  Play,
  Pause,
} from 'lucide-react';
import type { NoteInputType } from '../types';

type InputMode = 'record' | 'upload' | 'text';

export function NewNote() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.success('Recording started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success('Recording stopped');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/webm'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast.error('Please upload a valid audio file (MP3, WAV, M4A)');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploadedFile(file);
    toast.success('Audio file uploaded');
  };

  const handleGenerateNote = async () => {
    setIsGenerating(true);
    setUploadProgress(0);

    try {
      let inputType: NoteInputType;
      let audioFile: File | undefined;
      let rawText: string | undefined;

      if (inputMode === 'record' && audioBlob) {
        inputType = 'audio_record';
        audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      } else if (inputMode === 'upload' && uploadedFile) {
        inputType = 'audio_upload';
        audioFile = uploadedFile;
      } else if (inputMode === 'text' && textInput.trim()) {
        inputType = 'text';
        rawText = textInput.trim();
      } else {
        toast.error('Please provide input for the note');
        setIsGenerating(false);
        return;
      }

      // Create note
      const note = await notesService.createNote(
        {
          inputType,
          audioFile,
          rawText,
          patientIdentifier: patientIdentifier.trim() || undefined,
        },
        (progress) => setUploadProgress(progress)
      );

      // Generate SOAP note
      await notesService.generateSOAPNote(note.id);

      toast.success('Note generated successfully!');
      navigate(`/notes/${note.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate note');
    } finally {
      setIsGenerating(false);
      setUploadProgress(0);
    }
  };

  const canGenerate =
    (inputMode === 'record' && audioBlob) ||
    (inputMode === 'upload' && uploadedFile) ||
    (inputMode === 'text' && textInput.trim().length > 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Note</h1>
          <p className="text-gray-600 mt-2">
            Record audio, upload a file, or type your clinical notes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Patient Identifier */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Identifier (Optional)
            </label>
            <input
              type="text"
              value={patientIdentifier}
              onChange={(e) => setPatientIdentifier(e.target.value)}
              placeholder="e.g., Patient initials or ID"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Do not include personally identifiable information (HIPAA compliance)
            </p>
          </div>

          {/* Input Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Input Method
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setInputMode('record');
                  clearRecording();
                }}
                className={`p-4 border-2 rounded-lg transition-all ${
                  inputMode === 'record'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mic className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <span className="block text-sm font-medium">Record Audio</span>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  inputMode === 'upload'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <span className="block text-sm font-medium">Upload File</span>
              </button>

              <button
                onClick={() => setInputMode('text')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  inputMode === 'text'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <span className="block text-sm font-medium">Type Text</span>
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            {/* Record Mode */}
            {inputMode === 'record' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  {!isRecording && !audioBlob && (
                    <button
                      onClick={handleStartRecording}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Mic className="h-5 w-5" />
                      <span>Start Recording</span>
                    </button>
                  )}

                  {isRecording && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="h-4 w-4 bg-red-500 rounded-full recording-pulse"></div>
                        <span className="text-lg font-medium">Recording...</span>
                      </div>
                      <div className="text-3xl font-bold text-primary-600">
                        {formatDuration(duration)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Maximum duration: 5 minutes
                      </p>
                      <button
                        onClick={handleStopRecording}
                        className="btn-primary inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                      >
                        <Square className="h-5 w-5" />
                        <span>Stop Recording</span>
                      </button>
                    </div>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium">
                          Recording complete! Duration: {formatDuration(duration)}
                        </p>
                      </div>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={clearRecording}
                          className="btn-secondary inline-flex items-center space-x-2"
                        >
                          <X className="h-5 w-5" />
                          <span>Clear & Re-record</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Mode */}
            {inputMode === 'upload' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  {!uploadedFile ? (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Upload an audio file (MP3, WAV, M4A)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary"
                      >
                        Choose File
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Maximum file size: 50MB
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="btn-secondary inline-flex items-center space-x-2"
                      >
                        <X className="h-5 w-5" />
                        <span>Remove File</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Mode */}
            {inputMode === 'text' && (
              <div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type or paste your clinical notes here..."
                  rows={12}
                  className="input-field resize-none font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {textInput.length} characters
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isGenerating && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateNote}
              disabled={!canGenerate || isGenerating}
              className="btn-primary inline-flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating Note...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Generate SOAP Note</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Choose your input method (record, upload, or type)</li>
            <li>Provide your clinical notes or dictation</li>
            <li>
              AI will transcribe audio (if applicable) and generate a structured
              SOAP note
            </li>
            <li>Review and edit the generated note before saving</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
