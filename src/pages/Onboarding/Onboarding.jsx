import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';

import {
	doc,
	setDoc,
	getFirestore,
	collection,
	query,
	where,
	getDoc,
	getDocs,
} from 'firebase/firestore';

import './Onboarding.css';

const Onboarding = () => {
	const [major, setMajor] = useState('');
	const [userName, setUserName] = useState('');
	const [name, setName] = useState(''); // State to store user's name
	const navigate = useNavigate();
	const [setUserSchedule] = useState([]);
	const { currentUser } = useAuth();

	useEffect(() => {
		const fetchUserData = async () => {
			if (currentUser) {
				try {
					const db = getFirestore();
					const usersCollectionRef = collection(db, 'users');
					const userDoc = doc(usersCollectionRef, currentUser.uid);
					const userDocSnapshot = await getDoc(userDoc);

					if (userDocSnapshot.exists()) {
						const userData = userDocSnapshot.data();
						setUserName(userData.name);
					}
				} catch (error) {
					console.error('Error fetching user data:', error.message);
				}
			}
		};

		fetchUserData();
	}, [currentUser]);

	const generateUserSchedule = async () => {
		try {
			if (!currentUser) {
				console.error('User not logged in');
				navigate('/onboarding');
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

			// Check if the user already has a schedule document
			const schedulesCollectionRef = collection(db, 'schedules');
			const schedulesQuery = query(
				schedulesCollectionRef,
				where('_userId', '==', currentUser.uid)
			);

			const schedulesQuerySnapshot = await getDocs(schedulesQuery);

			if (schedulesQuerySnapshot.empty) {
				console.log('User does not have a schedule document yet');
				return;
			}

			const scheduleData = schedulesQuerySnapshot.docs[0].data();
			const currentSchedule = Array.isArray(scheduleData.schedule)
				? scheduleData.schedule
				: [];

			let newSchedule;
			if (!schedulesQuerySnapshot.empty) {
				// User already has a schedule document, generate a new schedule based on existing data
				const addedClasses = currentSchedule.flatMap((season) =>
					season.flatMap((course) => course)
				);
				newSchedule = generateNewSchedule(
					scheduleData,
					majorRequirements,
					addedClasses
				);
			} else {
				// User doesn't have a schedule document, generate a new schedule from scratch
				newSchedule = generateNewSchedule(scheduleData, majorRequirements, []);
			}

			// Update the schedule in the Firebase database
			await updateScheduleInFirebase(currentUser.uid, newSchedule);

			// Update userSchedule state with the new schedule
			setUserSchedule(newSchedule);
		} catch (error) {
			console.error('Error generating schedule:', error.message);
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
		const newSchedule = {};
		const years = Array.from({ length: 4 }, (_, i) => i + 1);
		const quarters = ['fall', 'winter', 'spring', 'summer'];
		// const allClasses = []; // New array to keep track of all classes

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

			// Generate the schedule based on major requirements
			await generateUserSchedule();

			navigate('/planner');
		} catch (error) {
			console.error(
				'Error creating user document or generating schedule:',
				error.message
			);
		}
	};

	const handleSubmitAndGenerateSchedule = async () => {
		await handleMajorSubmit();
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
				<div
					className='submit-onboarding'
					onClick={handleSubmitAndGenerateSchedule}>
					Submit
				</div>
			</div>
		</div>
	);
};

export default Onboarding;
