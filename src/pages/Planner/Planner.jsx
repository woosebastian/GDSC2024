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

	const generateSchedule = async () => {
		try {
			if (!currentUser) {
				console.error('User not logged in');
				return;
			}

			const db = getFirestore();

			// Fetch major requirements for Computer Science
			const majorRequirementsDocRef = collection(db, 'classRequirements').doc(
				'Computer Science B.S.'
			);
			const majorRequirementsDoc = await getDocs(majorRequirementsDocRef);

			if (!majorRequirementsDoc.exists()) {
				console.error('Major requirements document not found');
				return;
			}

			const majorRequirements = majorRequirementsDoc.data();

			// Fetch user's schedule data
			const schedulesCollectionRef = collection(db, 'schedules');
			const schedulesQuery = query(
				schedulesCollectionRef,
				where('_userId', '==', currentUser.uid)
			);

			const schedulesQuerySnapshot = await getDocs(schedulesQuery);

			if (!schedulesQuerySnapshot.empty) {
				const scheduleData = schedulesQuerySnapshot.docs[0].data();
				const currentSchedule = scheduleData.schedule;

				// Filter out already added classes
				const addedClasses = currentSchedule.flatMap((season) =>
					season.flatMap((course) => course)
				);

				// Generate a new schedule based on major requirements and pre-requisites
				const newSchedule = generateNewSchedule(
					majorRequirements,
					addedClasses
				);

				// Update userSchedule state with the new schedule
				setUserSchedule(newSchedule);

				// Update the schedule in the Firebase database
				// Note: You need to implement the function to update the schedule in Firebase
				// It would involve updating the 'schedules' collection for the current user
				// with the newSchedule data
			} else {
				console.error('Schedule document does not exist.');
			}
		} catch (error) {
			console.error('Error generating schedule:', error.message);
		}
	};

	// Function to generate a new schedule based on major requirements and pre-requisites
	const generateNewSchedule = (majorRequirements, addedClasses) => {
		// Implement your logic here to generate the new schedule
		// Ensure at most two major classes each quarter and follow the order specified

		// Example logic:
		// 1. Iterate through majorRequirements and check pre-requisites
		// 2. Check if each major class is not already added (use addedClasses)
		// 3. Add classes to the new schedule

		// Dummy implementation for illustration purposes
		const newSchedule = majorRequirements.map((course) => [course]); // Assuming one class per season

		return newSchedule;
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
						<tr className='schedule-table-header'>
							<th className='schedule-table-column-header'>Year</th>
							<th className='schedule-table-column-header'>Fall</th>
							<th className='schedule-table-column-header'>Winter</th>
							<th className='schedule-table-column-header'>Spring</th>
							<th className='schedule-table-column-header'>Summer</th>
						</tr>
					</thead>
					<tbody>
						{years.map((year) => (
							<tr className='schedule-table-row' key={year}>
								<td className='schedule-table-year'>Year {year}</td>
								{['fall', 'winter', 'spring', 'summer'].map((season) => (
									<td className='schedule-table-season' key={season}>
										{(userSchedule[year][season] || []).map((course, index) => (
											<div className='schedule-table-class' key={index}>
												{course || 'No course'}
											</div>
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
				<h2 className='navbar-title'>{userName}'s Course Planner</h2>
				<div className='nav-links'>
					<a onClick={generateSchedule} href='/planner'>
						Generate
					</a>
					<a className='navbar-buttons' onClick={signOutHandler} href='/'>
						Log Out
					</a>
				</div>
			</nav>
			<div className='planner'>{renderScheduleTable()}</div>
		</>
	);
};

export default Planner;
