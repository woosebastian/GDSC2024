import React, { useState, useEffect } from 'react';
import { useAuth } from '../../firebase';
import {
	getFirestore,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore';
import './Planner.css';

const Planner = () => {
	const [userName, setUserName] = useState('');
	const [userSchedule, setUserSchedule] = useState([]);
	const { currentUser } = useAuth();

	useEffect(() => {
		const fetchUserData = async () => {
			if (currentUser) {
				const db = getFirestore();

				// Query 'users' collection
				const usersCollectionRef = collection(db, 'users');
				const usersQuery = query(
					usersCollectionRef,
					where('_userId', '==', currentUser.uid)
				);

				try {
					const usersQuerySnapshot = await getDocs(usersQuery);

					if (!usersQuerySnapshot.empty) {
						const userData = usersQuerySnapshot.docs[0].data();
						setUserName(userData.name);

						// Now, query 'schedules' collection
						const schedulesCollectionRef = collection(db, 'schedules');
						const schedulesQuery = query(
							schedulesCollectionRef,
							where('_userId', '==', currentUser.uid)
						);

						const schedulesQuerySnapshot = await getDocs(schedulesQuery);

						if (!schedulesQuerySnapshot.empty) {
							const scheduleData = schedulesQuerySnapshot.docs[0].data();
							setUserSchedule(scheduleData.schedule);
						} else {
							console.error('Schedule document does not exist.');
						}
					} else {
						console.error('User document does not exist.');
					}
				} catch (error) {
					console.error('Error fetching user data:', error.message);
				}
			}
		};

		fetchUserData();
	}, [currentUser]);

	console.log('userSchedule:', userSchedule);

	const renderScheduleTable = () => {
		const years = Array.from({ length: 4 }, (_, i) => i + 1);

		console.log('userSchedule:', userSchedule);

		// Check if userSchedule is an object and has entries for all years
		if (
			typeof userSchedule === 'object' &&
			years.every((year) => userSchedule[year])
		) {
			return <table className='schedule-table'>{/* ... */}</table>;
		} else if (userSchedule === null) {
			// If userSchedule is still loading, show a loading message
			return <p>Loading...</p>;
		} else {
			// If userSchedule is not an object or doesn't have the expected structure, show a message
			return <p>No schedule data available.</p>;
		}
	};

	return (
		<>
			<nav className='navbar'>
				<h2>{userName}'s Course Planner</h2>
				<div className='nav-links'>
					<a href='google.com'>Generate</a>
					<a href='google.com'>Log Out</a>
				</div>
			</nav>
			<div className='planner'>{renderScheduleTable()}</div>
		</>
	);
};

export default Planner;
