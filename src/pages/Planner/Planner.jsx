import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
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

	const navigate = useNavigate(); // Initialize the useNavigate hook

	useEffect(() => {
		const fetchUserData = async () => {
			if (currentUser) {
				const db = getFirestore();

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

	const signOutHandler = async () => {
		try {
			await signOut(auth);
			console.log('User signed out');
			// Redirect to home or any other desired page after sign-out
			navigate('/');
		} catch (error) {
			console.error('Error signing out:', error.message);
		}
	};

	const renderScheduleTable = () => {
		const years = Array.from({ length: 4 }, (_, i) => i + 1);
		if (
			typeof userSchedule === 'object' &&
			years.every((year) => userSchedule[year])
		) {
			return (
				<table className='schedule-table'>
					<thead>
						<tr>
							<th>Year</th>
							<th>Fall</th>
							<th>Winter</th>
							<th>Spring</th>
							<th>Summer</th>
						</tr>
					</thead>
					<tbody>
						{years.map((year) => (
							<tr key={year}>
								<td>Year {year}</td>
								{['fall', 'winter', 'spring', 'summer'].map((season) => (
									<td key={season}>
										{(userSchedule[year][season] || []).map((course, index) => (
											<div key={index}>{course || 'No course'}</div>
										))}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			);
		} else if (userSchedule === null) {
			return <p>Loading...</p>;
		} else {
			return <p>No schedule data available.</p>;
		}
	};

	return (
		<>
			<nav className='navbar'>
				<h2>{userName}'s Course Planner</h2>
				<div className='nav-links'>
					<a href='google.com'>Generate</a>
					<button onClick={signOutHandler}>Log Out</button>
				</div>
			</nav>
			<div className='planner'>{renderScheduleTable()}</div>
		</>
	);
};

export default Planner;
