import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useNotesStore } from '../store/notesStore';
import { format } from 'date-fns';
import {
  PlusCircle,
  FileText,
  Clock,
  TrendingUp,
  Search,
  Trash2,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notes, dashboardStats, loadNotes, loadDashboardStats, deleteNote } =
    useNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadNotes(), loadDashboardStats()]);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loadNotes(1, searchQuery);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(noteId);
      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your clinical documentation summary
              </p>
            </div>
            <Link
              to="/notes/new"
              className="mt-4 md:mt-0 btn-primary flex items-center space-x-2"
            >
              <PlusCircle className="h-5 w-5" />
              <span>New Note</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardStats?.totalNotes || 0}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notes This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardStats?.notesThisMonth || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Audio Minutes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audio Minutes (Month)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(dashboardStats?.audioMinutesThisMonth || 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Recent Notes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notes</h2>

            {/* Search */}
            <form onSubmit={handleSearch} className="mt-4 md:mt-0 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-full md:w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notes yet. Create your first note!</p>
              <Link to="/notes/new" className="btn-primary mt-4 inline-flex items-center">
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Note
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {note.title || `Note from ${format(new Date(note.createdAt), 'PPP')}`}
                      </h3>
                      {note.patientIdentifier && (
                        <p className="text-sm text-gray-600 mt-1">
                          Patient: {note.patientIdentifier}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="capitalize">{note.inputType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{format(new Date(note.createdAt), 'PPp')}</span>
                        <span>•</span>
                        <span className="capitalize">{note.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                      <button
                        onClick={() => navigate(`/notes/${note.id}`)}
                        className="btn-outline flex items-center space-x-1 text-sm py-1 px-3"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
