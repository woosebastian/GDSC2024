// https://react.dev/learn/importing-and-exporting-components
// https://stackoverflow.com/questions/57417643/export-function-inside-react-component-or-access-state-in-same-file-outside-of-c
// https://stackoverflow.com/questions/66737429/export-function-inside-functional-component-in-react

import React, {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
	useRef,
} from 'react';
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
import '../../MajorContext';

// https://dev.to/jeetvora331/different-types-of-export-in-react-21p8
export const generateSchedule = async (
	currentUser,
	navigate,
	setUserSchedule
) => {
	// Add setUserSchedule as a parameter
	try {
		if (!currentUser) {
			console.error('User not logged in');
			navigate('/onboarding');
			return;
		}
		console.log('generating schedule');
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

		const schedulesCollectionRef = collection(db, 'schedules');
		const schedulesQuery = query(
			schedulesCollectionRef,
			where('_userId', '==', currentUser.uid)
		);

		const schedulesQuerySnapshot = await getDocs(schedulesQuery);

		if (!schedulesQuerySnapshot.empty) {
			let newSchedule;
			const scheduleData = schedulesQuerySnapshot.docs[0].data();
			const currentSchedule = Array.isArray(scheduleData.schedule)
				? scheduleData.schedule
				: [];
			const addedClasses = currentSchedule.flatMap((season) =>
				season.flatMap((course) => course)
			);
			console.log('addedClasses: ', addedClasses);
			newSchedule = generateNewSchedule(
				scheduleData,
				majorRequirements,
				addedClasses
			);
			await updateScheduleInFirebase(currentUser.uid, newSchedule);
			setUserSchedule(newSchedule); // Update userSchedule state with the new schedule
		} else {
			const newSchedule = generateNewSchedule({}, majorRequirements, {});
			await updateScheduleInFirebase(currentUser.uid, newSchedule);
			setUserSchedule(newSchedule); // Update userSchedule state with the new schedule
		}
	} catch (error) {
		console.error('Error generating schedule:', error.message);
	}
};

// https://stackoverflow.com/questions/57373072/state-is-not-defined
const Planner = () => {
	const [rerender, setRerender] = useState(false);
	const { userSchedule, setUserSchedule } = useUserSchedule();
	const [userName, setUserName] = useState('');
	const { currentUser } = useAuth();
	const navigate = useNavigate();

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
					console.log(currentUser);
					const usersQuerySnapshot = await getDocs(usersQuery);

					if (!usersQuerySnapshot.empty) {
						// const userData = usersQuerySnapshot.docs[0].data();
						// setUserName(userData.name);
						setUserName(currentUser.displayName);

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
						// Custom hook for managing user schedule state

						// User document does not exist, open major popup
						//** SET USER SCHEDULE */
						navigate('/onboarding');
					}
				} catch (error) {
					console.error('Error fetching user data:', error.message);
				}
			}
		};

		fetchUserData();
	}, [currentUser, navigate, setUserSchedule]);

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

	// Function to generate a new schedule based on major requirements and pre-requisites
	// Function to generate a new schedule based on major requirements and pre-requisites

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
										{userSchedule[year][season].map((course, index) => (
											<div
												className={
													course.locked === false
														? 'schedule-table-class'
														: 'schedule-table-class highlight'
												}
												key={index}>
												{course.class || 'No course'}
												<span
													className='material-symbols-outlined'
													onClick={async () => {
														const db = getFirestore();
														const docRef = doc(
															db,
															'schedules',
															currentUser.uid
														);
														const docSnap = await getDoc(docRef);
														if (docSnap.exists()) {
															const updatedData = docSnap.data();
															const updatedCourse = {
																...updatedData.schedule[year][season][index],
															};
															updatedCourse.locked = !updatedCourse.locked;
															updatedData.schedule[year][season][index] =
																updatedCourse;
															course.locked = updatedCourse.locked;

															await updateDoc(docRef, updatedData);
															console.log('Document successfully updated!');

															setRerender(!rerender);
														} else {
															console.error('Document does not exist!');
														}

														console.log(course.locked);
													}}>
													{course.locked === true ? 'lock' : 'lock_open'}
												</span>
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
					<div
						className='navbar-buttons'
						onClick={generateSchedule(currentUser, navigate)}>
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

export const useUserSchedule = () => {
	// Initialize userSchedule state with an empty array
	const [userSchedule, setUserSchedule] = useState([]);

	// Return the state and setter function
	return { userSchedule, setUserSchedule };
};

//Component One

const ComponentOne = forwardRef((props, ref) => {
	useImperativeHandle(ref, () => ({
		hello() {
			console.log('Hello, says the componentOne');
		},
	}));

	return <div></div>;
});

export { ComponentOne };

// Component Two
const ComponentTwo = () => {
	const componentOneRef = useRef(null);
	// No need to create a separate variable for ComponentOne, use it directly

	return (
		<div>
			{/* Ensure componentOneRef.current is not null before calling hello */}
			<button
				onClick={() =>
					componentOneRef.current && componentOneRef.current.hello()
				}>
				Hello
			</button>
		</div>
	);
};

export { ComponentTwo };

const getRandomClass = () => {
	const randomClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
	return randomClasses[Math.floor(Math.random() * randomClasses.length)];
};

const arePrerequisitesSatisfied = (course, majorRequirements, addedClasses) => {
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

const generateNewSchedule = (
	previousSchedule,
	majorRequirements,
	addedClasses
) => {
	// Ensure addedClasses is initialized as an array
	if (!Array.isArray(addedClasses)) {
		addedClasses = [];
	}
	const newSchedule = {};
	const years = Array.from({ length: 4 }, (_, i) => i + 1);
	const quarters = ['fall', 'winter', 'spring', 'summer'];
	// const allClasses = []; // New array to keep track of all classes
	years.forEach((year) => {
		newSchedule[year] = {};
		quarters.forEach((quarter) => {
			const quarterSchedule = [];
			console.log('in generate new schedule.');

			// First, add classes with null value
			Object.keys(majorRequirements.classRequirements).forEach((course) => {
				if (
					quarterSchedule.length < 2 &&
					!addedClasses.includes(course) &&
					majorRequirements.classRequirements[course][0] === null
				) {
					generateNewSchedule(
						previousSchedule,
						majorRequirements,
						addedClasses
					);
				} else {
					console.log('previousSchedule', previousSchedule);
					const existingClass = previousSchedule['schedule'][year][
						quarter
					].find((c) => c.class === course && c.locked);
					console.log('existingClass', existingClass);
					if (existingClass === undefined) {
						console.log('not locked', course);
						quarterSchedule.push({ class: course, locked: false }); // Updated to add class as a map
						addedClasses.push(course);
					} else {
						console.log('locked', course);
						quarterSchedule.push({ class: course, locked: true }); // Updated to add class as a map
						addedClasses.push(course);
					}
				}
			});

			// Then, add other classes that have satisfied prerequisites
			Object.keys(majorRequirements.classRequirements)
				.sort((a, b) => {
					const prereqsA = majorRequirements.classRequirements[a];
					const prereqsB = majorRequirements.classRequirements[b];
					return (
						(prereqsA ? prereqsA.length : 0) - (prereqsB ? prereqsB.length : 0)
					);
				})
				.forEach((course) => {
					if (
						quarterSchedule.length < 2 &&
						!addedClasses.includes(course) &&
						majorRequirements.classRequirements[course] !== null &&
						arePrerequisitesSatisfied(course, majorRequirements, addedClasses)
					) {
						const existingClass = previousSchedule['schedule'][year][
							quarter
						].find((c) => c.class === course && c.locked);
						// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
						// includes
						console.log('existingClass', existingClass);
						if (existingClass === undefined) {
							console.log('not locked', course);
							quarterSchedule.push({ class: course, locked: false }); // Updated to add class as a map
							addedClasses.push(course);
						} else {
							console.log('locked', course);
							quarterSchedule.push({ class: course, locked: true }); // Updated to add class as a map
							addedClasses.push(course);
						}
					}
				});

			// If needed, fill in the remaining slots with random classes
			while (quarterSchedule.length < 2) {
				const randomClass = getRandomClass();
				quarterSchedule.push({ class: randomClass, locked: false }); // Updated to add class as a map
				addedClasses.push(randomClass);
			}

			newSchedule[year][quarter] = quarterSchedule;
		});
	});

	return newSchedule;
};
