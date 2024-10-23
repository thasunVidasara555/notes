import React, { useState, useEffect } from 'react';

function NoteEditor({ note, onUpdateNote, onDeleteNote, onClose, setUnsavedChanges }) {
  const [editedNote, setEditedNote] = useState(note);

  useEffect(() => {
    setEditedNote(note);
  }, [note]);

  const handleTitleChange = (e) => {
    setEditedNote({ ...editedNote, title: e.target.value });
    setUnsavedChanges(true);
  };

  const handleContentChange = (e) => {
    setEditedNote({ ...editedNote, content: e.target.value });
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    onUpdateNote(editedNote);
    setUnsavedChanges(false);
  };

  return (
    <div className="note-editor">
      <input
        type="text"
        value={editedNote.title}
        onChange={handleTitleChange}
        placeholder="Note Title"
      />
      <textarea
        value={editedNote.content}
        onChange={handleContentChange}
        placeholder="Note Content"
      />
      <div className="button-group">
        <button onClick={handleSave}>Save</button>
        <button onClick={() => onDeleteNote(note.id)}>Delete</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default NoteEditor;
