// Planner.jsx
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
	const { currentUser } = useAuth();
	useEffect(() => {
		const fetchUserData = async () => {
			if (currentUser) {
				const db = getFirestore();
				const usersCollectionRef = collection(db, 'users');
				const q = query(
					usersCollectionRef,
					where('_userId', '==', currentUser.uid)
				);
				try {
					const querySnapshot = await getDocs(q);
					if (!querySnapshot.empty) {
						const userData = querySnapshot.docs[0].data();
						setUserName(userData.name);
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

	return (
		<>
			<nav className='navbar'>
				<h2>{userName}'s Course Planner</h2>
				<div className='nav-links'>
					<a href='google.com'>Generate</a>
					<a href='lol.com'>Log Out</a>
				</div>
			</nav>
			<div></div>
		</>
	);
};

export default Planner;
