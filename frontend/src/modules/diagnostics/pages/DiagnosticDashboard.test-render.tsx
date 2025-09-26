import React from 'react';
import DiagnosticDashboard from './DiagnosticDashboard';

// Simple test component to check if DiagnosticDashboard renders without infinite loop
const TestRender: React.FC = () => {
  console.log('TestRender component rendering');

  return (
    <div>
      <h1>Testing DiagnosticDashboard</h1>
      <DiagnosticDashboard />
    </div>
  );
};

export default TestRender;
