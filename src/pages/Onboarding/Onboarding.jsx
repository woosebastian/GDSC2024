import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../firebase';

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

import './Onboarding.css';

const Onboarding = () => {
  const [major, setMajor] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const {currentUser} = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const db = getFirestore();
          const usersCollectionRef = collection(db, 'users');
          const usersQuery = query(usersCollectionRef, where('_userId', '==', currentUser.uid));
          const usersQuerySnapshot = await getDocs(usersQuery);

          if (!usersQuerySnapshot.empty) {
            const userData = usersQuerySnapshot.docs[0].data();
            setUserName(userData.name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error.message);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleMajorSubmit = async () => {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);

      // Create or update user document with name, major, and email
      await setDoc(userRef, {
        _userId: currentUser.uid,
        name: userName,
        major: major,
        email: currentUser.email,
      });

      navigate('/planner');
    } catch (error) {
      console.error('Error creating user document:', error.message);
    }
  };

  return (
    <div className="onboarding-wrapper">
      <div className='major-popup'>
        <div className='prompt'>What's your major?</div>
        <input
          className="major-input"
          type='text'
          value={major}
          onChange={(e) => setMajor(e.target.value)}
        />
        <div className='submit-onboarding' onClick={handleMajorSubmit}>Submit</div>
      </div>
    </div>
  );
};

export default Onboarding;
