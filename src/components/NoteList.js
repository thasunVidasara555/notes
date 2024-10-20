import React from 'react';

function NoteList({ notes, onSelectNote, selectedNote }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  return (
    <div className="note-list">
      {notes.map(note => (
        <div 
          key={note.id} 
          className={`note-item ${selectedNote && note.id === selectedNote.id ? 'selected' : ''}`}
          onClick={() => onSelectNote(note)}
        >
          <h3>{note.title || 'Untitled Note'}</h3>
          <p>{formatDate(note.date)}</p>
        </div>
      ))}
    </div>
  );
}

export default NoteList;
