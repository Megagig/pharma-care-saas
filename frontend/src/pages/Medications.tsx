import React, { useState } from 'react';
import { Search, Plus, Filter, Pill, AlertTriangle, Clock, User } from 'lucide-react';

const Medications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock medications data
  const medications = [
    {
      id: 1,
      drugName: 'Lisinopril',
      genericName: 'Lisinopril',
      strength: { value: 10, unit: 'mg' },
      dosageForm: 'tablet',
      patient: { name: 'Sarah Johnson', id: 'P001' },
      instructions: {
        dosage: '1 tablet',
        frequency: 'once daily',
        duration: 'ongoing',
        specialInstructions: 'Take in the morning, monitor blood pressure'
      },
      status: 'active',
      indication: 'Hypertension',
      prescriber: { name: 'Dr. Smith', npi: '1234567890' },
      dateIssued: '2024-01-01',
      refillsRemaining: 3,
      interactions: [],
      adherence: { score: 85 }
    },
    {
      id: 2,
      drugName: 'Metformin',
      genericName: 'Metformin HCl',
      strength: { value: 1000, unit: 'mg' },
      dosageForm: 'tablet',
      patient: { name: 'Michael Chen', id: 'P002' },
      instructions: {
        dosage: '1 tablet',
        frequency: 'twice daily',
        duration: 'ongoing',
        specialInstructions: 'Take with meals to reduce stomach upset'
      },
      status: 'active',
      indication: 'Type 2 Diabetes',
      prescriber: { name: 'Dr. Johnson', npi: '0987654321' },
      dateIssued: '2024-01-05',
      refillsRemaining: 5,
      interactions: [
        {
          interactingDrug: 'Warfarin',
          severity: 'moderate',
          description: 'May enhance anticoagulant effect'
        }
      ],
      adherence: { score: 92 }
    },
    {
      id: 3,
      drugName: 'Albuterol MDI',
      genericName: 'Albuterol Sulfate',
      strength: { value: 90, unit: 'mcg' },
      dosageForm: 'inhaler',
      patient: { name: 'Emily Rodriguez', id: 'P003' },
      instructions: {
        dosage: '2 puffs',
        frequency: 'as needed',
        duration: '1 year',
        specialInstructions: 'For rescue use during asthma attacks'
      },
      status: 'active',
      indication: 'Asthma',
      prescriber: { name: 'Dr. Brown', npi: '1122334455' },
      dateIssued: '2024-01-10',
      refillsRemaining: 2,
      interactions: [],
      adherence: { score: 78 }
    }
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    discontinued: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  const severityColors = {
    minor: 'text-yellow-600',
    moderate: 'text-orange-600',
    major: 'text-red-600'
  };

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = medication.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          medication.patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || medication.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600">Manage patient medications and monitor therapy</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search medications or patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
              <option value="completed">Completed</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {filteredMedications.map((medication) => (
          <div key={medication.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Medication Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Pill className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {medication.drugName} {medication.strength.value}{medication.strength.unit}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[medication.status]}`}>
                      {medication.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {medication.patient.name} ({medication.patient.id})
                    </div>
                    <div>{medication.indication}</div>
                    <div className="capitalize">{medication.dosageForm}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {medication.interactions.length > 0 && (
                    <span className="flex items-center text-orange-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {medication.interactions.length} interaction{medication.interactions.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="text-right text-sm">
                    <div className="text-gray-600">Adherence</div>
                    <div className={`font-semibold ${
                      medication.adherence.score >= 80 ? 'text-green-600' :
                      medication.adherence.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {medication.adherence.score}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Medication Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Instructions</h4>
                  <p className="text-sm text-gray-700">
                    {medication.instructions.dosage} {medication.instructions.frequency}
                  </p>
                  {medication.instructions.specialInstructions && (
                    <p className="text-sm text-gray-500 mt-1">
                      {medication.instructions.specialInstructions}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Prescriber</h4>
                  <p className="text-sm text-gray-700">{medication.prescriber.name}</p>
                  <p className="text-sm text-gray-500">NPI: {medication.prescriber.npi}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Prescription Info</h4>
                  <p className="text-sm text-gray-700">Issued: {medication.dateIssued}</p>
                  <p className="text-sm text-gray-700">Refills: {medication.refillsRemaining} remaining</p>
                </div>
              </div>

              {/* Drug Interactions */}
              {medication.interactions.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                    Drug Interactions
                  </h4>
                  <div className="space-y-2">
                    {medication.interactions.map((interaction, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {interaction.interactingDrug}
                          </span>
                          <span className={`text-xs font-medium uppercase ${severityColors[interaction.severity]}`}>
                            {interaction.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{interaction.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMedications.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No medications found</p>
          <p className="text-gray-400 mb-6">Start managing patient medications by adding the first prescription.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add First Medication
          </button>
        </div>
      )}
    </div>
  );
};

export default Medications;