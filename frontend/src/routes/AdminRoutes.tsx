import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FeatureFlags from '../pages/FeatureFlags';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Admin Dashboard</div>} />
      <Route path="/feature-flags" element={<FeatureFlags />} />
    </Routes>
  );
};

export default AdminRoutes;
