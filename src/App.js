import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import './App.css';
import ProfileLogin from './components/ProfileLogin';
import ProfileLoader from './components/ProfileLoader';
import AdminCLI from './components/AdminCLI';

console.log('Firestore instance:', db);
console.log('Notes collection:', collection(db, 'notes'));

function App() {
  const [notes, setNotes] = useState([]);
  const [originalNotes, setOriginalNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showProfileLoader, setShowProfileLoader] = useState(false);
  const [showAdminCLI, setShowAdminCLI] = useState(false);
  const [rootPassword, setRootPassword] = useState(''); // You should set this securely
  const [isRootUser, setIsRootUser] = useState(false);

  useEffect(() => {
    if (loggedInUser && currentProfile) {
      const q = query(collection(db, 'notes'), 
        where('user', '==', loggedInUser),
        where('profile', '==', currentProfile),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotes(notesData);
      });

      return () => unsubscribe();
    }
  }, [loggedInUser, currentProfile]);

  const addNote = async () => {
    const newNote = {
      title: 'New Note',
      content: '',
      date: new Date().toISOString(),
      user: loggedInUser,
      profile: currentProfile,
    };
    try {
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setSelectedNote({ id: docRef.id, ...newNote });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const updateNote = async (updatedNote) => {
    try {
      const noteRef = doc(db, 'notes', updatedNote.id);
      await updateDoc(noteRef, {
        ...updatedNote,
        date: new Date().toISOString()
      });
      setSelectedNote(updatedNote);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setSelectedNote(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleLogin = (username, profileName) => {
    setLoggedInUser(username);
    setCurrentProfile(profileName);
    setShowProfileLoader(false);
  };

  const handleSelectNote = (note) => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Do you want to save before closing?")) {
        updateNote(selectedNote);
      }
    }
    setSelectedNote(note);
    setUnsavedChanges(false);
  };

  const closeNote = () => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Do you want to save before closing?")) {
        updateNote(selectedNote);
      }
    }
    setSelectedNote(null);
    setUnsavedChanges(false);
  };

  const handleLoadProfile = () => {
    setShowProfileLoader(true);
  };

  const saveRootPassword = async (password) => {
    try {
      await setDoc(doc(db, 'admin', 'rootPassword'), { password });
    } catch (error) {
      console.error("Error saving root password: ", error);
    }
  };

  const toggleAdminCLI = async () => {
    if (!rootPassword) {
      const rootPasswordDoc = await getDoc(doc(db, 'admin', 'rootPassword'));
      if (rootPasswordDoc.exists()) {
        setRootPassword(rootPasswordDoc.data().password);
      } else {
        const newPassword = prompt("Create a root password:");
        if (newPassword) {
          setRootPassword(newPassword);
          await saveRootPassword(newPassword);
          setIsRootUser(true);
          setShowAdminCLI(true);
        }
      }
    } else {
      const enteredPassword = prompt("Enter root password:");
      if (enteredPassword === rootPassword) {
        setIsRootUser(true);
        setShowAdminCLI(true);
      } else {
        setIsRootUser(false);
        setShowAdminCLI(true);
      }
    }
  };

  if (!loggedInUser || !currentProfile) {
    return <ProfileLogin onLogin={handleLogin} />;
  }

  if (showProfileLoader) {
    return <ProfileLoader onProfileLoad={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Notes App</h1>
        <div>
          <span>Welcome, {loggedInUser}! (Profile: {currentProfile})</span>
          <button onClick={addNote}>Add Note</button>
          <button onClick={handleLoadProfile}>Load Profile</button>
          <button onClick={toggleAdminCLI}>Admin CLI</button>
          <button onClick={() => { setLoggedInUser(null); setCurrentProfile(null); }}>Logout</button>
        </div>
      </header>
      <main className="App-main">
        <NoteList 
          notes={notes} 
          onSelectNote={handleSelectNote} 
          selectedNote={selectedNote}
        />
        {selectedNote ? (
          <NoteEditor 
            note={selectedNote} 
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onClose={closeNote}
            setUnsavedChanges={setUnsavedChanges}
          />
        ) : (
          <div className="note-placeholder">
            <h2>Select a note or create a new one</h2>
            <p>Your notes will appear here</p>
          </div>
        )}
      </main>
      {showAdminCLI && <AdminCLI rootPassword={rootPassword} isRootUser={isRootUser} notes={notes} setNotes={setNotes} originalNotes={originalNotes} setOriginalNotes={setOriginalNotes} />}
    </div>
  );
}

export default App;
