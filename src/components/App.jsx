// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '../pages/Index/Index';
import Planner from '../pages/Planner/Planner';
import Navigation from './Navigation';

const App = () => {
	return (
		<div>
			<Navigation />
			<Routes>
				<Route path='/' element={<Index />} />
				<Route path='/planner' element={<Planner />} />
			</Routes>
		</div>
	);
};

export default App;
