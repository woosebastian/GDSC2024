// index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Index from './pages/Index/Index';
import Planner from './pages/Planner/Planner';
import Onboarding from './pages/Onboarding/Onboarding';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Router>
    <Routes>
      <Route path='/' element={<Index />} />
      <Route path='/planner' element={<Planner />} />
      <Route path='/onboarding' element={<Onboarding />} />
    </Routes>
  </Router>
);
