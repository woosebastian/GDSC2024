import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import {
	doc,
	setDoc,
	updateDoc,
	getFirestore,
	collection,
	query,
	where,
	getDoc,
	getDocs,
} from 'firebase/firestore';

import './Planner.css';

// https://stackoverflow.com/questions/57373072/state-is-not-defined
const Planner = () => {
	const [rerender, setRerender] = useState(false);

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
				Object.keys(majorRequirements.classRequirements)
					.sort((a, b) => {
						const prereqsA = majorRequirements.classRequirements[a];
						const prereqsB = majorRequirements.classRequirements[b];
						return (
							(prereqsA ? prereqsA.length : 0) -
							(prereqsB ? prereqsB.length : 0)
						);
					})
					.forEach((course) => {
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
								<td className='schedule-table-year'>{year}</td>
								{['fall', 'winter', 'spring', 'summer'].map((season) => (
									<td className='schedule-table-season' key={season}>
										{(userSchedule[year][season] || []).map((course, index) => (
											<div className={course.locked == false ? 'schedule-table-class' : 'schedule-table-class highlight'} key={index}>
												{course["class"] || 'No course'}
												{/* https://fonts.google.com/icons?selected=Material+Symbols+Outlined:lock_open:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=lock&icon.platform=web */}
												{/* https://chat.openai.com/share/f92fcf50-45ab-474c-9053-486fba15dab0 */}
												<span className="material-symbols-outlined" onClick={async () => {
													// https://stackoverflow.com/questions/47295541/cloud-firestore-update-fields-in-nested-objects-with-dynamic-key
													// https://www.reddit.com/r/Firebase/comments/vp8ugv/error_dbcollection_is_not_a_function/
													// https://community.retool.com/t/writing-to-nested-objects-in-firebase-cloud-firestore-using-update-document/25161
													// https://chat.openai.com/share/b420aa9a-9d80-4eb4-9fd2-0716ceeee951
													// https://g.co/gemini/share/32f59b37be66
													// https://g.co/gemini/share/856f516f439f
													// https://g.co/gemini/share/5727f64c6212
													const db = getFirestore();
													const docRef = doc(db, 'schedules', currentUser.uid);
													const docSnap = await getDoc(docRef);
													if (docSnap.exists()) {
														const updatedData = docSnap.data(); // Get the entire document data
														const updatedCourse = { ...updatedData.schedule[year][season][index] }; // Create a copy of the course
														updatedCourse.locked = !updatedCourse.locked; // Toggle the value of locked
														updatedData.schedule[year][season][index] = updatedCourse; // Update the course in the document data
														course.locked = updatedCourse.locked;

														await updateDoc(docRef, updatedData);
														console.log("Document successfully updated!");

														// https://www.educative.io/answers/how-to-force-a-react-component-to-re-render
														// https://stackoverflow.com/questions/46240647/how-to-force-a-functional-react-component-to-render
														setRerender(!rerender);
													} else {
														console.error("Document does not exist!");
													}

													console.log(course.locked);
												}}>
													{course.locked == true ? "lock" : "lock_open"}
												</span>
											</div>
										))}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table >
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
					<div className='navbar-buttons' onClick={generateSchedule}>
						Generate
					</div>
					<div className='navbar-buttons' onClick={signOutHandler} href='/'>
						Log Out
					</div>
				</div>
			</nav>
			<div className='planner'>{renderScheduleTable()}</div>
		</>
	);
};

export default Planner;
