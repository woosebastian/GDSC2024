import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import './Onboarding.css';
import { generateSchedule } from '../Planner/Planner';

const Onboarding = () => {
	const [major, setMajor] = useState('');
	const [name, setName] = useState('');
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const [userSchedule, setUserSchedule] = useState(null); // Initialize userSchedule state

	useEffect(() => {
		const fetchUserData = async () => {
			if (currentUser) {
				try {
					const db = getFirestore();
					const userDocRef = doc(db, 'users', currentUser.uid);
					const userDocSnapshot = await getDoc(userDocRef);

					if (userDocSnapshot.exists()) {
						const userData = userDocSnapshot.data();
						setName(userData.name);
					}
				} catch (error) {
					console.error('Error fetching user data:', error.message);
				}
			}
		};

		fetchUserData();
	}, [currentUser]);

	const handleMajorSubmit = async () => {
		try {
			const db = getFirestore();
			const userRef = doc(db, 'users', currentUser.uid);

			// Create or update user document with name, major, and email
			await setDoc(userRef, {
				_userId: currentUser.uid,
				name: name,
				major: major,
				email: currentUser.email,
			});

			console.log('User document updated successfully');

			// Generate the schedule
			await generateSchedule(currentUser, navigate, setUserSchedule); // Pass setUserSchedule callback
			navigate('/planner');
		} catch (error) {
			console.error(
				'Error creating user document or generating schedule:',
				error.message
			);
		}
	};

	return (
		<div className='onboarding-wrapper'>
			<div className='major-popup'>
				<div className='prompt'>What's your name?</div>
				<br />
				<input
					className='major-input'
					type='text'
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<br />
				<br />
				<div className='prompt'>What's your major?</div>
				<br />
				<input
					className='major-input'
					type='text'
					value={major}
					onChange={(e) => setMajor(e.target.value)}
				/>
				<br />
				<div className='submit-onboarding' onClick={handleMajorSubmit}>
					Submit
				</div>
			</div>
		</div>
	);
};

export default Onboarding;
