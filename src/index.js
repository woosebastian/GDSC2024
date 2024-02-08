// index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index/Index';
import Planner from './pages/Planner/Planner';

ReactDOM.createRoot(document.getElementById('root')).render(
	<Router>
		<Routes>
			<Route path='/' element={<Index />} />
			<Route path='/planner' element={<Planner />} />
		</Routes>
	</Router>
);
