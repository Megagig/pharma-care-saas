import React, { useState } from 'react';
import { Search, Plus, Filter, FileText, Calendar, User, Tag } from 'lucide-react';

const ClinicalNotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock clinical notes data
  const clinicalNotes = [
    {
      id: 1,
      title: 'Hypertension Medication Review',
      type: 'medication_review',
      patient: { name: 'Sarah Johnson', id: 'P001' },
      date: '2024-01-15',
      priority: 'medium',
      content: {
        subjective: 'Patient reports feeling dizzy occasionally, especially in the morning.',
        objective: 'BP: 145/92 mmHg, HR: 72 bpm, currently on Lisinopril 10mg daily',
        assessment: 'Suboptimal blood pressure control, possible dose adjustment needed',
        plan: 'Increase Lisinopril to 15mg daily, follow-up in 2 weeks'
      },
      medications: ['Lisinopril', 'Hydrochlorothiazide'],
      followUpRequired: true,
      followUpDate: '2024-01-29'
    },
    {
      id: 2,
      title: 'Diabetes Consultation',
      type: 'consultation',
      patient: { name: 'Michael Chen', id: 'P002' },
      date: '2024-01-14',
      priority: 'high',
      content: {
        subjective: 'Patient concerned about recent HbA1c results, reports good medication adherence',
        objective: 'HbA1c: 8.2%, fasting glucose: 165 mg/dL, on Metformin 1000mg BID',
        assessment: 'Suboptimal glycemic control despite good adherence',
        plan: 'Add Glipizide 5mg daily, diabetes education, dietary consultation'
      },
      medications: ['Metformin', 'Glipizide'],
      followUpRequired: true,
      followUpDate: '2024-01-28'
    },
    {
      id: 3,
      title: 'Asthma Inhaler Technique Review',
      type: 'follow_up',
      patient: { name: 'Emily Rodriguez', id: 'P003' },
      date: '2024-01-13',
      priority: 'low',
      content: {
        subjective: 'Patient using rescue inhaler more frequently, technique assessment requested',
        objective: 'Demonstrated proper MDI technique, peak flow: 380 L/min (baseline 420)',
        assessment: 'Good inhaler technique, possible trigger exposure or medication adjustment needed',
        plan: 'Continue current regimen, identify triggers, scheduled follow-up'
      },
      medications: ['Albuterol MDI', 'Fluticasone'],
      followUpRequired: false,
      followUpDate: null
    }
  ];

  const noteTypes = {
    consultation: { label: 'Consultation', color: 'blue' },
    medication_review: { label: 'Medication Review', color: 'green' },
    follow_up: { label: 'Follow-up', color: 'yellow' },
    adverse_event: { label: 'Adverse Event', color: 'red' },
    other: { label: 'Other', color: 'gray' }
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const filteredNotes = clinicalNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Notes</h1>
          <p className="text-gray-600">Comprehensive patient care documentation</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes or patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {Object.entries(noteTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Note Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${noteTypes[note.type].color}-100 text-${noteTypes[note.type].color}-800`}>
                      {noteTypes[note.type].label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[note.priority]}`}>
                      {note.priority} priority
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {note.patient.name} ({note.patient.id})
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {note.date}
                    </div>
                  </div>
                </div>
                {note.followUpRequired && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                      Follow-up: {note.followUpDate}
                    </span>
                  </div>
                )}
              </div>

              {/* SOAP Notes Content */}
              <div className="space-y-3 mb-4">
                {note.content.subjective && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Subjective:</h4>
                    <p className="text-sm text-gray-700">{note.content.subjective}</p>
                  </div>
                )}
                {note.content.objective && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Objective:</h4>
                    <p className="text-sm text-gray-700">{note.content.objective}</p>
                  </div>
                )}
                {note.content.assessment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Assessment:</h4>
                    <p className="text-sm text-gray-700">{note.content.assessment}</p>
                  </div>
                )}
                {note.content.plan && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Plan:</h4>
                    <p className="text-sm text-gray-700">{note.content.plan}</p>
                  </div>
                )}
              </div>

              {/* Related Medications */}
              {note.medications && note.medications.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Related Medications:</span>
                    <div className="flex flex-wrap gap-2">
                      {note.medications.map((medication, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {medication}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No clinical notes found</p>
          <p className="text-gray-400 mb-6">Start documenting patient care by creating your first clinical note.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create First Note
          </button>
        </div>
      )}
    </div>
  );
};

export default ClinicalNotes;