// App.jsx
import React from 'react';
import {Routes, Route} from 'react-router-dom';
import Index from '../pages/Index/Index';
import Planner from '../pages/Planner/Planner';
import Onboarding from '../pages/Onboarding/Onboarding';
import Navigation from '../pages/Navigation/Navigation';

const App = () => {
  return (
    <div>
      <Navigation />
      <Routes>
        <Route path='/' element={<Index />} />
        <Route path='/planner' element={<Planner />} />
        <Route path='/onboarding' element={<Onboarding />} />
      </Routes>
    </div>
  );
};

export default App;
