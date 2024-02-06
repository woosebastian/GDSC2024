import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import {
	doc,
	setDoc,
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

	const updateScheduleInFirebase = async (userId, newSchedule) => {
		try {
			const db = getFirestore();

			// Reference to the user's schedule document
			const userScheduleDocRef = doc(db, 'schedules', userId);

			// Use setDoc to either update the existing document or create a new one if it doesn't exist
			await setDoc(userScheduleDocRef, {
				_userId: userId,
				schedule: newSchedule,
			});

			console.log('Schedule updated in Firebase');
		} catch (error) {
			console.error('Error updating schedule in Firebase:', error.message);
		}
	};

	const generateSchedule = async () => {
		try {
			if (!currentUser) {
				console.error('User not logged in');
				return;
			}

			const db = getFirestore();

			const majorReq = collection(db, 'majorRequirements');
			const majorReqQuery = query(
				majorReq,
				where('major', '==', 'Computer Science B.S.')
			);

			const majorRequirementsDoc = await getDocs(majorReqQuery);

			if (majorRequirementsDoc.empty) {
				console.error('Major requirements document not found');
				return;
			}

			const majorRequirements = majorRequirementsDoc.docs[0].data();

			console.log('Major Requirements:', majorRequirements);

			// Fetch user's schedule data
			const schedulesCollectionRef = collection(db, 'schedules');
			const schedulesQuery = query(
				schedulesCollectionRef,
				where('_userId', '==', currentUser.uid)
			);

			const schedulesQuerySnapshot = await getDocs(schedulesQuery);

			if (!schedulesQuerySnapshot.empty) {
				const scheduleData = schedulesQuerySnapshot.docs[0].data();
				const currentSchedule = Array.isArray(scheduleData.schedule)
					? scheduleData.schedule
					: [];

				// Filter out already added classes
				const addedClasses = currentSchedule.flatMap((season) =>
					season.flatMap((course) => course)
				);

				console.log('Added Classes:', addedClasses);

				// Generate a new schedule based on major requirements and pre-requisites
				const newSchedule = generateNewSchedule(
					majorRequirements,
					addedClasses
				);

				// Update the schedule in the Firebase database
				await updateScheduleInFirebase(currentUser.uid, newSchedule);

				// Update userSchedule state with the new schedule
				setUserSchedule(newSchedule);
			} else {
				console.error('Schedule document does not exist.');
			}
		} catch (error) {
			console.error('Error generating schedule:', error.message);
		}
	};

	// Function to generate a new schedule based on major requirements and pre-requisites
	const generateNewSchedule = (majorRequirements, addedClasses) => {
		const newSchedule = {};
		const years = Array.from({ length: 4 }, (_, i) => i + 1);
		const quarters = ['fall', 'winter', 'spring', 'summer'];

		years.forEach((year) => {
			newSchedule[year] = {};
			quarters.forEach((quarter) => {
				const quarterSchedule = [];

				// First, add classes with null value
				Object.keys(majorRequirements.classRequirements).forEach((course) => {
					if (
						quarterSchedule.length < 2 &&
						!addedClasses.includes(course) &&
						majorRequirements.classRequirements[course][0] === null
					) {
						quarterSchedule.push(course);
						addedClasses.push(course);
					}
				});

				// Then, add other classes that have satisfied prerequisites
				Object.keys(majorRequirements.classRequirements).forEach((course) => {
					if (
						quarterSchedule.length < 2 &&
						!addedClasses.includes(course) &&
						majorRequirements.classRequirements[course] !== null &&
						arePrerequisitesSatisfied(course, majorRequirements, addedClasses)
					) {
						quarterSchedule.push(course);
						addedClasses.push(course);
					}
				});

				// If needed, fill in the remaining slots with random classes
				while (quarterSchedule.length < 2) {
					const randomClass = getRandomClass();
					quarterSchedule.push(randomClass);
					addedClasses.push(randomClass);
				}

				newSchedule[year][quarter] = quarterSchedule;
			});
		});

		return newSchedule;
	};

	const getRandomClass = () => {
		const randomClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
		return randomClasses[Math.floor(Math.random() * randomClasses.length)];
	};

	const arePrerequisitesSatisfied = (
		course,
		majorRequirements,
		addedClasses
	) => {
		const prerequisites = majorRequirements.classRequirements[course];

		console.log('Checking prerequisites for course:', course);
		console.log('Prerequisites:', prerequisites);

		if (Array.isArray(prerequisites)) {
			// Prioritize courses with an empty string value
			const prioritizedPrerequisites = prerequisites.sort((a, b) => {
				if (a === null) return -1;
				if (b === null) return 1;
				return 0;
			});

			return prioritizedPrerequisites.every((prereq) =>
				addedClasses.includes(prereq)
			);
		} else {
			console.error('Prerequisites array is not an array for course:', course);
			return false;
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
					<button className='navbar-buttons' onClick={generateSchedule}>
						Generate
					</button>
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
