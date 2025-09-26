import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ClinicalNotesDashboard from '../components/ClinicalNotesDashboard';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, FileText as NoteIcon, Plus as AddIcon } from 'lucide-react';

interface ClinicalNotesPageProps {
  patientId?: string;
}

const ClinicalNotesUXEnhancer: React.FC<{ children: React.ReactNode; context: string }> = ({ children }) => {
  return <>{children}</>;
};

const ClinicalNotes: React.FC<ClinicalNotesPageProps> = ({ patientId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToCreate = () => {
    navigate('/notes/new', {
      state: {
        from: location.pathname,
        patientId: patientId,
      },
    });
  };

  const handleNavigateToEdit = (id: string) => {
    navigate(`/notes/${id}/edit`, {
      state: { from: location.pathname },
    });
  };

  const handleNavigateToView = (id: string) => {
    navigate(`/notes/${id}`, {
      state: { from: location.pathname },
    });
  };

  const renderBreadcrumbs = () => {
    return (
      <nav className="flex mb-4" aria-label="breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                Clinical Notes
              </span>
            </div>
          </li>
        </ol>
      </nav>
    );
  };

  const renderPageHeader = () => (
    <div className="mb-6">
      {renderBreadcrumbs()}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clinical Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage SOAP notes and clinical documentation
          </p>
        </div>
        <Button
          onClick={handleNavigateToCreate}
          className="flex items-center"
        >
          <AddIcon className="w-4 h-4 mr-2" />
          New Clinical Note
        </Button>
      </div>
    </div>
  );

  return (
    <ClinicalNotesUXEnhancer context="clinical-notes-page">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderPageHeader()}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <ClinicalNotesDashboard
                patientId={patientId}
                onNoteSelect={handleNavigateToView}
                onNoteEdit={handleNavigateToEdit}
                onNoteCreate={handleNavigateToCreate}
              />
            </div>
          </div>
        </div>
      </div>
    </ClinicalNotesUXEnhancer>
  );
};

export default ClinicalNotes;