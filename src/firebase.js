// firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

export { app, auth };
