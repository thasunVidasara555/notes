import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function ProfileLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [profileName, setProfileName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [canCreateProfile, setCanCreateProfile] = useState(false);

  useEffect(() => {
    checkProfileCreationLimit();
  }, []);

  const checkProfileCreationLimit = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('createdAt', '>=', today));
    const querySnapshot = await getDocs(q);
    setCanCreateProfile(querySnapshot.size < 2);
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    setStep(2);
  };

  const handleProfileNameSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Profile name cannot be empty');
      return;
    }

    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('profileName', '==', profileName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      if (canCreateProfile) {
        setIsNewProfile(true);
        setStep(3);
      } else {
        setError('Daily profile creation limit reached');
      }
    } else {
      setIsNewProfile(false);
      setStep(3);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password cannot be empty');
      return;
    }

    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('profileName', '==', profileName));
    const querySnapshot = await getDocs(q);

    if (isNewProfile) {
      await addDoc(profilesRef, {
        username,
        profileName,
        password,
        createdAt: serverTimestamp()
      });
      onLogin(username, profileName);
    } else {
      const profile = querySnapshot.docs[0].data();
      if (profile.password === password) {
        onLogin(username, profileName);
      } else {
        setError('Incorrect password');
      }
    }
  };

  if (step === 1) {
    return (
      <div className="profile-login">
        <h2>Enter Username</h2>
        <form onSubmit={handleUsernameSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <button type="submit">Next</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="profile-login">
        <h2>Enter Profile Name</h2>
        <form onSubmit={handleProfileNameSubmit}>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter profile name"
          />
          <button type="submit">Next</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="profile-login">
      <h2>{isNewProfile ? 'Create Profile' : 'Enter Password'}</h2>
      <form onSubmit={handlePasswordSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isNewProfile ? 'Create password' : 'Enter password'}
        />
        <button type="submit">{isNewProfile ? 'Create Profile' : 'Login'}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ProfileLogin;
