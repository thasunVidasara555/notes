import React, { useState, useEffect } from 'react';

function NoteEditor({ note, onUpdateNote, onDeleteNote }) {
  const [editedNote, setEditedNote] = useState(note);

  useEffect(() => {
    setEditedNote(note);
  }, [note]);

  const handleTitleChange = (e) => {
    setEditedNote({ ...editedNote, title: e.target.value });
  };

  const handleContentChange = (e) => {
    setEditedNote({ ...editedNote, content: e.target.value });
  };

  const handleSave = () => {
    onUpdateNote(editedNote);
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
      <div>
        <button onClick={handleSave}>Save</button>
        <button onClick={() => onDeleteNote(note.id)}>Delete Note</button>
      </div>
    </div>
  );
}

export default NoteEditor;
