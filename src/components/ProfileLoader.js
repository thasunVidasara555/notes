import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ProfileLoader({ onProfileLoad }) {
  const [profileName, setProfileName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!profileName.trim() || !password.trim()) {
      setError('Profile name and password cannot be empty');
      return;
    }

    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Profile not found');
        return;
      }

      const profile = querySnapshot.docs[0].data();
      if (profile.password !== password) {
        setError('Incorrect password');
        return;
      }

      onProfileLoad(profile.username, profileName);
    } catch (error) {
      console.error("Error loading profile: ", error);
      setError('An error occurred while loading the profile');
    }
  };

  return (
    <div className="profile-loader">
      <h2>Load Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="Enter profile name"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button type="submit">Load Profile</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ProfileLoader;
