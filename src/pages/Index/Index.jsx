// Index.jsx
import React, {useEffect} from 'react';
import {
	// doc,
	// setDoc,
	// updateDoc,
	getFirestore,
	collection,
	query,
	where,
	// getDoc,
	getDocs,
} from 'firebase/firestore';
import {useNavigate} from 'react-router-dom'; // Import the useNavigate hook
import {useAuth, auth} from '../../firebase';
import {GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import './Index.css';

const Index = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Initialize the useNavigate hook

  useEffect(() => {}, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in with Google:', user);

      // Redirect to /planner on successful sign-in

      const db = getFirestore();

      const usersCollectionRef = collection(db, 'users');
      const usersQuery = query(
        usersCollectionRef,
        // where('_userId', '==', currentUser.uid)
        where('_userId', '==', user.uid)
      );
      // try {
      console.log('currentUser', currentUser);
      const usersQuerySnapshot = await getDocs(usersQuery);

      if (usersQuerySnapshot.empty) {
      // if (!currentUser) {
        navigate('/onboarding');
      } else {
        navigate('/planner');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  return (
    <div className='app'>
      <h1 className='title'>Course Planner</h1>
      <div className='logIn signInButton' onClick={signInWithGoogle}>
        Sign in with Google
      </div>
    </div>
  );
};

export default Index;
