// https://www.youtube.com/watch?v=b9eMGE7QtTk

import { useEffect } from 'react';
import { auth } from './firebase'; // Import the auth instance
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import directly from 'firebase/auth'
import './App.css';

const App = () => {
	useEffect(() => {}, []);

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider(); // Correct the import statement

		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			console.log('User signed in with Google:', user);
		} catch (error) {
			console.error('Error signing in with Google:', error.message);
		}
	};

	return (
		<div className='app'>
			<h1 className='title'>Course Planner</h1>

			<div className='logIn signInButton' onClick={signInWithGoogle}>
				{/* https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Creating_hyperlinks */}
				{/* <button className="signInButton"> */}
				Sign in with Google
				{/* </button> */}
			</div>
		</div>
	);
};

export default App;
