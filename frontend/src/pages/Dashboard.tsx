import React from 'react';
import { Users, FileText, Pill, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      name: 'Total Patients',
      value: '147',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'blue'
    },
    {
      name: 'Clinical Notes',
      value: '523',
      change: '+18%',
      changeType: 'increase',
      icon: FileText,
      color: 'green'
    },
    {
      name: 'Active Medications',
      value: '1,284',
      change: '+7%',
      changeType: 'increase',
      icon: Pill,
      color: 'purple'
    },
    {
      name: 'Adherence Rate',
      value: '84.2%',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const recentPatients = [
    { name: 'Sarah Johnson', age: 65, condition: 'Hypertension', lastVisit: '2024-01-15' },
    { name: 'Michael Chen', age: 45, condition: 'Diabetes', lastVisit: '2024-01-14' },
    { name: 'Emily Rodriguez', age: 28, condition: 'Asthma', lastVisit: '2024-01-13' },
    { name: 'David Thompson', age: 72, condition: 'Heart Disease', lastVisit: '2024-01-12' }
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'Drug interaction alert for Patient #1247',
      time: '2 hours ago'
    },
    {
      type: 'info',
      message: 'Follow-up required for Patient #1256',
      time: '4 hours ago'
    },
    {
      type: 'error',
      message: 'Medication adherence below 70% for Patient #1234',
      time: '6 hours ago'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening in your practice.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'increase' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.name}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentPatients.map((patient, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">Age {patient.age} • {patient.condition}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last visit</p>
                  <p className="text-sm font-medium text-gray-900">{patient.lastVisit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Mark all read
            </button>
          </div>
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === 'warning' ? 'bg-yellow-400' :
                  alert.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="w-3 h-3 text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Add New Patient</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Create Clinical Note</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Pill className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Add Medication</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;