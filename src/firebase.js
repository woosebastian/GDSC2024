// firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
	getAuth,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
	signOut,
} from 'firebase/auth';
import { useState, useEffect } from 'react'; // Import useState and useEffect

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyCCBp5JArN_P8gU6_AO8iR5up8mZin2-6c',
	authDomain: 'year-planner-a2b3a.firebaseapp.com',
	projectId: 'year-planner-a2b3a',
	storageBucket: 'year-planner-a2b3a.appspot.com',
	messagingSenderId: '1016902981337',
	appId: '1:1016902981337:web:60222b85ab7ac3e45550c8',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const useAuth = () => {
	const [currentUser, setCurrentUser] = useState(null);

	useEffect(() => {
		// Set up an observer to listen for changes in authentication state
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
		});

		// Cleanup the observer when the component unmounts
		return () => unsubscribe();
	}, []);

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		try {
			await signInWithPopup(auth, provider);
		} catch (error) {
			console.error('Error signing in with Google:', error.message);
		}
	};

	const signOutUser = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error('Error signing out:', error.message);
		}
	};

	return {
		currentUser,
		signInWithGoogle,
		signOutUser,
	};
};

export { app, auth, useAuth };
