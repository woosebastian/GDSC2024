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
	try {
		if (!currentUser) {
			console.error('User not logged in');
			// navigate('/onboarding');
			return;
		}
		console.log('Generating schedule');

		// Add logging here to check the value of currentUser.uid
		console.log('Current user UID:', currentUser.uid);

		const db = getFirestore();

		// Query for major requirements
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

		// Query for user's schedule
		const schedulesCollectionRef = collection(db, 'schedules');
		const schedulesQuery = query(
			schedulesCollectionRef,
			where('_userId', '==', currentUser.uid)
		);
		const schedulesQuerySnapshot = await getDocs(schedulesQuery);

		if (!schedulesQuerySnapshot.empty) {
			// User has an existing schedule
			console.log('User has an existing schedule');
			const scheduleDoc = schedulesQuerySnapshot.docs[0];
			const scheduleData = scheduleDoc.data();
			const existingSchedule = scheduleData.schedule;
			const newSchedule = generateNewSchedule(
				existingSchedule,
				majorRequirements,
				{}
			);
			await updateScheduleInFirebase(currentUser.uid, newSchedule);
			setUserSchedule(newSchedule); // Update userSchedule state with the new schedule
		} else {
			// User does not have an existing schedule
			// Generate a new schedule from scratch
			const newSchedule = generateNewSchedule({}, majorRequirements, {});
      console.log('updating schedule in firebase');
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

              const db = getFirestore();

              // Query for major requirements
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

              // generateNewSchedule({}, majorRequirements, {});

              const newSchedule = generateNewSchedule({}, majorRequirements, {});
              console.log('updating schedule in firebase');
              await updateScheduleInFirebase(currentUser.uid, newSchedule);
              setUserSchedule(newSchedule); // Update userSchedule state with the new schedule
						}
					} else {
						// Custom hook for managing user schedule state

						// User document does not exist, open major popup
						//** SET USER SCHEDULE */
						// navigate('/onboarding');
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
		// } 
    // else if (userSchedule === null) {
    } else {
      return <p>Loading...</p>;
			// return <p>No schedule data available.</p>;
		}
	};

	return (
    userName ? (
      <div>
        <nav className='navbar'>
          <h2 className='navbar-title'>{userName}'s Course Planner</h2>
          <div className='nav-links'>
            <div
              className='navbar-buttons'
              onClick={() =>
                generateSchedule(currentUser, navigate, setUserSchedule)
              }>
              Generate
            </div>
            <div className='navbar-buttons' onClick={signOutHandler} href='/'>
              Log Out
            </div>
          </div>
        </nav>
        <div className='planner'>{renderScheduleTable()}</div>
    </div>
    ) : (
      <div></div>
    ));
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
	const randomClasses = ['Elective'];
	return randomClasses[Math.floor(Math.random() * randomClasses.length)];
};

const arePrerequisitesSatisfied = async (
	course,
	majorRequirements,
	addedClasses
) => {
	// Get the prerequisites for the given course
	const prerequisites = majorRequirements.classRequirements[course];

	// If there are no prerequisites, return true
	if (!prerequisites) {
		return true;
	}

	// Check if all prerequisites are in the addedClasses array
	for (const prereq of prerequisites) {
		// Check if the prerequisite is an array, if not convert it to one
		const prereqArray = Array.isArray(prereq) ? prereq : [prereq];

		// Check if any of the prerequisite arrays are satisfied
		const isPrereqSatisfied = prereqArray.some((singlePrereq) =>
			addedClasses.includes(singlePrereq)
		);

		// If any of the prerequisite arrays are not satisfied, return false
		if (!isPrereqSatisfied) {
			return false;
		}
	}

	// If all prerequisites are satisfied, return true
	return true;
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
	addedClasses,
	recursionDepth = 0
) => {
	// Check if recursion depth exceeds a certain limit
	const MAX_RECURSION_DEPTH = 10; // Adjust this value as needed
	if (recursionDepth > MAX_RECURSION_DEPTH) {
		console.error('Maximum recursion depth exceeded');
		return previousSchedule; // Return the previous schedule to prevent further recursion
	}

	// Ensure addedClasses is initialized as an array
	if (!Array.isArray(addedClasses)) {
		addedClasses = [];
	}

	const newSchedule = {};
	const years = Array.from({ length: 4 }, (_, i) => i + 1);
	const quarters = ['fall', 'winter', 'spring', 'summer'];

	years.forEach((year) => {
		newSchedule[year] = {};
		quarters.forEach((quarter) => {
			const quarterSchedule = [];

			// // Add classes with null value
			// Object.keys(majorRequirements.classRequirements).forEach((course) => {
			// 	if (
			// 		quarterSchedule.length < 2 &&
			// 		!addedClasses.includes(course) &&
			// 		majorRequirements.classRequirements[course][0] === null
			// 	) {
			// 		quarterSchedule.push({ class: course, locked: false }); // Add class as a map
			// 		addedClasses.push(course);
			// 	}
			// });

			// // Add other classes that have satisfied prerequisites
			// Object.keys(majorRequirements.classRequirements).forEach((course) => {
			// 	if (
			// 		quarterSchedule.length < 2 &&
			// 		!addedClasses.includes(course) &&
			// 		majorRequirements.classRequirements[course] !== null &&
			// 		arePrerequisitesSatisfied(course, majorRequirements, addedClasses)
			// 	) {
			// 		quarterSchedule.push({ class: course, locked: false }); // Add class as a map
			// 		addedClasses.push(course);
			// 	}
			// });

      // First, add classes with null value
      Object.keys(majorRequirements.classRequirements).forEach((course) => {
        if (
          quarterSchedule.length < 2 &&
          !addedClasses.includes(course) &&
          majorRequirements.classRequirements[course][0] === null
        ) {
          console.log("previousSchedule", previousSchedule);
          const existingClass = previousSchedule[year][quarter].find((c) => c.class === course && c.locked);
          console.log("existingClass", existingClass);
          if (existingClass === undefined) {
            console.log("not locked", course);
            quarterSchedule.push({class: course, locked: false}); // Updated to add class as a map
            addedClasses.push(course);
          }
          else {
            console.log("locked", course);
            quarterSchedule.push({class: course, locked: true}); // Updated to add class as a map
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
            const existingClass = previousSchedule[year][quarter].find((c) => c.class === course && c.locked);
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
            // includes
            console.log("existingClass", existingClass);
            if (existingClass === undefined) {
              console.log("not locked", course);
              quarterSchedule.push({class: course, locked: false}); // Updated to add class as a map
              addedClasses.push(course);
            }
            else {
              console.log("locked", course);
              quarterSchedule.push({class: course, locked: true}); // Updated to add class as a map
              addedClasses.push(course);
            }
          }
        });

			// If needed, fill in the remaining slots with random classes
			while (quarterSchedule.length < 2) {
				const randomClass = getRandomClass();
				quarterSchedule.push({ class: randomClass, locked: false }); // Add class as a map
				addedClasses.push(randomClass);
			}

			newSchedule[year][quarter] = quarterSchedule;
		});
	});

	return newSchedule;
};
