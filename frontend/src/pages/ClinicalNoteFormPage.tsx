import React from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Home as HomeIcon, FileText as NoteIcon, Plus as AddIcon, ArrowLeft as ArrowBackIcon } from 'lucide-react';

import ClinicalNoteForm from '../components/ClinicalNoteForm';
import ClinicalNotesUXEnhancer from '../components/ClinicalNotesUXEnhancer';
import { Button } from '@/components/ui/button';

const ClinicalNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const noteId = params.id;
  const isEditing = location.pathname.includes('/edit');
  const patientId = location.state?.patientId || params.patientId;

  // Navigation handlers
  const handleBackNavigation = () => {
    const fromState = location.state?.from;
    if (fromState) {
      navigate(fromState);
    } else {
      navigate('/notes');
    }
  };

  const handleNoteCreated = (note: any) => {
    navigate(`/notes/${note._id}`, {
      replace: true,
      state: {
        from: '/notes',
        message: 'Note created successfully',
      },
    });
  };

  const handleNoteUpdated = (note: any) => {
    navigate(`/notes/${note._id}`, {
      replace: true,
      state: {
        from: '/notes',
        message: 'Note updated successfully',
      },
    });
  };

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <HomeIcon className="h-4 w-4" />,
      },
      {
        label: 'Clinical Notes',
        path: '/notes',
        icon: <NoteIcon className="h-4 w-4" />,
      },
    ];

    if (isEditing) {
      breadcrumbs.push(
        {
          label: 'Note Details',
          path: `/notes/${noteId}`,
          icon: <NoteIcon className="h-4 w-4" />,
        },
        {
          label: 'Edit',
          path: `/notes/${noteId}/edit`,
          icon: <AddIcon className="h-4 w-4" />,
        }
      );
    } else {
      breadcrumbs.push({
        label: 'New Note',
        path: '/notes/new',
        icon: <AddIcon className="h-4 w-4" />,
      });
    }

    return breadcrumbs;
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    const breadcrumbs = getBreadcrumbs();
    return (
      <div className="flex items-center space-x-2 text-sm mb-4" aria-label="breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          if (isLast) {
            return (
              <div key={crumb.path} className="flex items-center text-gray-500">
                {crumb.icon}
                <span className="ml-1">{crumb.label}</span>
              </div>
            );
          }
          return (
            <Link
              key={crumb.path}
              to={crumb.path}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {crumb.icon}
              <span className="ml-1">{crumb.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <ClinicalNotesUXEnhancer context="clinical-note-form-page">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          {renderBreadcrumbs()}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleBackNavigation}
                size="sm"
                className="flex items-center"
              >
                <ArrowBackIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold ml-4">
                {isEditing ? 'Edit Clinical Note' : 'Create New Clinical Note'}
              </h1>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <ClinicalNoteForm
              noteId={noteId}
              patientId={patientId}
              onSave={isEditing ? handleNoteUpdated : handleNoteCreated}
              onCancel={handleBackNavigation}
            />
          </div>
        </div>
      </div>
    </ClinicalNotesUXEnhancer>
  );
};

export default ClinicalNoteFormPage;