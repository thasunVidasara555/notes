import React, { useState } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

function AdminCLI({ rootPassword, isRootUser, notes, setNotes, originalNotes, setOriginalNotes }) {
  const [command, setCommand] = useState('');
  const [outputHistory, setOutputHistory] = useState([]);

  const addOutput = (newOutput) => {
    setOutputHistory(prevHistory => [...prevHistory, newOutput]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    const [cmd, ...args] = command.split(' ');

    if (cmd === 'help') {
      addOutput(`Available commands:
        help - Show this help message
        clear - Clear the CLI output
        list profiles - List all profiles
        list notes - List all notes
        delete profile [profileName] - Delete a profile
        delete note [noteId] - Delete a note
        edit profile [profileName] [field] [value] - Edit a profile
        edit note [noteId] [field] [value] - Edit a note
        archive profile [profileName] - Archive a profile
        archive note [noteId] - Archive a note
        root profile [profileName] - Mark a profile as root-only
        root note [noteId] - Mark a note as root-only
        revert profile [profileName] - Revert a profile to its original state
        revert note [noteId] - Revert a note to its original state
        exit - Exit admin mode`);
    } else if (cmd === 'clear') {
      setOutputHistory([]);
    } else if (cmd === 'list' && args[0] === 'profiles') {
      await listProfiles();
    } else if (cmd === 'list' && args[0] === 'notes') {
      await listNotes();
    } else if (cmd === 'delete' && args[0] === 'profile' && args[1]) {
      await deleteProfile(args[1]);
    } else if (cmd === 'delete' && args[0] === 'note' && args[1]) {
      await deleteNote(args[1]);
    } else if (cmd === 'edit' && args[0] === 'profile' && args[1] && args[2] && args[3]) {
      await editProfile(args[1], args[2], args[3]);
    } else if (cmd === 'edit' && args[0] === 'note' && args[1] && args[2] && args[3]) {
      await editNote(args[1], args[2], args[3]);
    } else if (cmd === 'archive' && args[0] === 'profile' && args[1]) {
      await archiveProfile(args[1]);
    } else if (cmd === 'archive' && args[0] === 'note' && args[1]) {
      await archiveNote(args[1]);
    } else if (cmd === 'root' && args[0] === 'profile' && args[1]) {
      await rootProfile(args[1]);
    } else if (cmd === 'root' && args[0] === 'note' && args[1]) {
      await rootNote(args[1]);
    } else if (cmd === 'revert' && args[0] === 'profile' && args[1]) {
      await revertProfile(args[1]);
    } else if (cmd === 'revert' && args[0] === 'note' && args[1]) {
      await revertNote(args[1]);
    } else if (cmd === 'exit') {
      addOutput('Exiting admin mode...');
      // Implement exit logic here
    } else {
      addOutput('Unknown command. Type "help" for available commands.');
    }

    setCommand('');
  };

  const listProfiles = async () => {
    try {
      const profilesRef = collection(db, 'profiles');
      const querySnapshot = await getDocs(profilesRef);
      const profiles = querySnapshot.docs
        .map(doc => doc.data())
        .filter(profile => isRootUser || !profile.isRootOnly)
        .map(profile => profile.profileName);
      addOutput(`Profiles: ${profiles.join(', ')}`);
    } catch (error) {
      addOutput(`Error listing profiles: ${error.message}`);
    }
  };

  const listNotes = () => {
    const noteList = notes.map(note => `${note.id}: ${note.title}`);
    addOutput(`Notes:\n${noteList.join('\n')}`);
  };

  const deleteProfile = async (profileName) => {
    if (!isRootUser) {
      addOutput('Only root users can delete profiles.');
      return;
    }
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addOutput(`Profile ${profileName} not found.`);
        return;
      }

      await deleteDoc(querySnapshot.docs[0].ref);
      addOutput(`Profile ${profileName} deleted successfully.`);
    } catch (error) {
      addOutput(`Error deleting profile: ${error.message}`);
    }
  };

  const deleteNote = async (noteId) => {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      addOutput(`Note with ID ${noteId} not found.`);
      return;
    }

    const note = notes[noteIndex];
    if (note.isRootOnly && !isRootUser) {
      addOutput('Only root users can delete root-only notes.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes(notes.filter(note => note.id !== noteId));
      addOutput(`Note ${noteId} deleted successfully.`);
    } catch (error) {
      addOutput(`Error deleting note: ${error.message}`);
    }
  };

  const editProfile = async (profileName, field, value) => {
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addOutput(`Profile ${profileName} not found.`);
        return;
      }

      const profileDoc = querySnapshot.docs[0];
      const profile = profileDoc.data();

      if (profile.isRootOnly && !isRootUser) {
        addOutput('Only root users can edit root-only profiles.');
        return;
      }

      await updateDoc(profileDoc.ref, { [field]: value });
      addOutput(`Profile ${profileName} updated successfully.`);
    } catch (error) {
      addOutput(`Error updating profile: ${error.message}`);
    }
  };

  const editNote = async (noteId, field, value) => {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      addOutput(`Note with ID ${noteId} not found.`);
      return;
    }

    const note = notes[noteIndex];
    if (note.isRootOnly && !isRootUser) {
      addOutput('Only root users can edit root-only notes.');
      return;
    }

    try {
      await updateDoc(doc(db, 'notes', noteId), { [field]: value });
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = { ...note, [field]: value };
      setNotes(updatedNotes);
      addOutput(`Note ${noteId} updated successfully.`);
    } catch (error) {
      addOutput(`Error updating note: ${error.message}`);
    }
  };

  const archiveProfile = async (profileName) => {
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addOutput(`Profile ${profileName} not found.`);
        return;
      }

      const profileDoc = querySnapshot.docs[0];
      const profile = profileDoc.data();

      if (profile.isRootOnly && !isRootUser) {
        addOutput('Only root users can archive root-only profiles.');
        return;
      }

      await updateDoc(profileDoc.ref, { isArchived: true });
      addOutput(`Profile ${profileName} archived successfully.`);
    } catch (error) {
      addOutput(`Error archiving profile: ${error.message}`);
    }
  };

  const archiveNote = async (noteId) => {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      addOutput(`Note with ID ${noteId} not found.`);
      return;
    }

    const note = notes[noteIndex];
    if (note.isRootOnly && !isRootUser) {
      addOutput('Only root users can archive root-only notes.');
      return;
    }

    try {
      await updateDoc(doc(db, 'notes', noteId), { isArchived: true });
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = { ...note, isArchived: true };
      setNotes(updatedNotes);
      addOutput(`Note ${noteId} archived successfully.`);
    } catch (error) {
      addOutput(`Error archiving note: ${error.message}`);
    }
  };

  const rootProfile = async (profileName) => {
    if (!isRootUser) {
      addOutput('Only root users can mark profiles as root-only.');
      return;
    }

    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addOutput(`Profile ${profileName} not found.`);
        return;
      }

      const profileDoc = querySnapshot.docs[0];
      await updateDoc(profileDoc.ref, { isRootOnly: true });
      addOutput(`Profile ${profileName} marked as root-only successfully.`);
    } catch (error) {
      addOutput(`Error marking profile as root-only: ${error.message}`);
    }
  };

  const rootNote = async (noteId) => {
    if (!isRootUser) {
      addOutput('Only root users can mark notes as root-only.');
      return;
    }

    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      addOutput(`Note with ID ${noteId} not found.`);
      return;
    }

    try {
      await updateDoc(doc(db, 'notes', noteId), { isRootOnly: true });
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = { ...notes[noteIndex], isRootOnly: true };
      setNotes(updatedNotes);
      addOutput(`Note ${noteId} marked as root-only successfully.`);
    } catch (error) {
      addOutput(`Error marking note as root-only: ${error.message}`);
    }
  };

  const revertProfile = async (profileName) => {
    if (!isRootUser) {
      addOutput('Only root users can revert profiles.');
      return;
    }

    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('profileName', '==', profileName));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addOutput(`Profile ${profileName} not found.`);
        return;
      }

      const profileDoc = querySnapshot.docs[0];
      const originalProfile = originalNotes.find(p => p.profileName === profileName);

      if (!originalProfile) {
        addOutput(`Original profile ${profileName} not found.`);
        return;
      }

      await updateDoc(profileDoc.ref, originalProfile);
      addOutput(`Profile ${profileName} reverted to its original state successfully.`);
    } catch (error) {
      addOutput(`Error reverting profile: ${error.message}`);
    }
  };

  const revertNote = async (noteId) => {
    if (!isRootUser) {
      addOutput('Only root users can revert notes.');
      return;
    }

    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      addOutput(`Note with ID ${noteId} not found.`);
      return;
    }

    const originalNote = originalNotes.find(note => note.id === noteId);
    if (!originalNote) {
      addOutput(`Original note with ID ${noteId} not found.`);
      return;
    }

    try {
      await updateDoc(doc(db, 'notes', noteId), originalNote);
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = originalNote;
      setNotes(updatedNotes);
      addOutput(`Note ${noteId} reverted to its original state successfully.`);
    } catch (error) {
      addOutput(`Error reverting note: ${error.message}`);
    }
  };

  return (
    <div className="admin-cli">
      <h2>Admin CLI {isRootUser ? '(Root)' : '(Non-Root)'}</h2>
      <div className="cli-output">
        {outputHistory.map((output, index) => (
          <pre key={index}>{output}</pre>
        ))}
      </div>
      <form onSubmit={handleCommand}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command"
        />
        <button type="submit">Execute</button>
      </form>
    </div>
  );
}

export default AdminCLI;
