import React from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Home as HomeIcon, FileText as NoteIcon, ArrowLeft, Edit } from 'lucide-react';

import ErrorBoundary from '../components/ErrorBoundary';
import { Button } from '@/components/ui/button';

const ClinicalNoteDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const noteId = params.id!;

  // Navigation handlers
  const handleBackNavigation = () => {
    const fromState = location.state?.from;
    if (fromState) {
      navigate(fromState);
    } else {
      navigate('/notes');
    }
  };

  const handleNavigateToEdit = () => {
    navigate(`/notes/${id}/edit`, {
      state: { from: location.pathname }
    });
  };

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    return [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <HomeIcon className="h-4 w-4" />
      },
      {
        label: 'Clinical Notes',
        path: '/notes',
        icon: <NoteIcon className="h-4 w-4" />
      },
      {
        label: 'Note Details',
        path: `/notes/${noteId}`,
        icon: <NoteIcon className="h-4 w-4" />
      }
    ];
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    const breadcrumbs = getBreadcrumbs();
    return (
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={crumb.path} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {isLast ? (
                  <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {crumb.icon}
                    <span className="ml-1">{crumb.label}</span>
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {crumb.icon}
                    <span className="ml-1">{crumb.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          {renderBreadcrumbs()}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBackNavigation}
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clinical Note Details
              </h1>
            </div>
            <Button
              onClick={handleNavigateToEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Note
            </Button>
          </div>
        </div>

        {/* Detail Content */}
        <div className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center py-12">
              <NoteIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Clinical Note Detail
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Note ID: {noteId}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                This page is under construction. The clinical note detail component will be displayed here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ClinicalNoteDetailPage;