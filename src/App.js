import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import './App.css';
import ProfileLogin from './components/ProfileLogin';

console.log('Firestore instance:', db);
console.log('Notes collection:', collection(db, 'notes'));

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

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
  };

  if (!loggedInUser || !currentProfile) {
    return <ProfileLogin onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Notes App</h1>
        <div>
          <span>Welcome, {loggedInUser}!</span>
          <button onClick={addNote}>Add Note</button>
          <button onClick={() => setLoggedInUser(null)}>Logout</button>
        </div>
      </header>
      <main className="App-main">
        <NoteList 
          notes={notes} 
          onSelectNote={setSelectedNote} 
          selectedNote={selectedNote}
        />
        {selectedNote && (
          <NoteEditor 
            note={selectedNote} 
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        )}
      </main>
    </div>
  );
}

export default App;
