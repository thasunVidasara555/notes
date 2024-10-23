import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ProfileLogin({ onLogin }) {
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const [username, profileName, password] = loginInput.split('&&').map(item => item.trim());

    if (!username || !profileName || !password) {
      setError('Please enter username && profileName && password');
      return;
    }

    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, 
        where('username', '==', username),
        where('profileName', '==', profileName)
      );
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

      onLogin(username, profileName);
    } catch (error) {
      console.error("Error logging in: ", error);
      setError('An error occurred while logging in');
    }
  };

  return (
    <div className="profile-login">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
          placeholder="Enter username && profileName && password"
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ProfileLogin;
