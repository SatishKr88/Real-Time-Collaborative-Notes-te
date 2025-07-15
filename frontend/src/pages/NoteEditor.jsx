import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import TextareaAutosize from 'react-textarea-autosize';

const socket = io('https://real-time-collaborative-notes-te.onrender.com', { autoConnect: false });

function NoteEditor() {
  const { id } = useParams();
  const [note, setNote] = useState({ title: '', content: '', updatedAt: '' });
  const [activeUsers, setActiveUsers] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [userNotification, setUserNotification] = useState('');
  const saveTimeout = useRef(null);
  const isMounted = useRef(true);
  const notificationTimeout = useRef(null);

  useEffect(() => {
    isMounted.current = true;

    async function fetchNote() {
      try {
        const res = await axios.get(`https://real-time-collaborative-notes-te.onrender.com/notes/${id}`);
        if (isMounted.current) setNote(res.data);
      } catch (err) {
        console.error('Failed to fetch note:', err);
      }
    }

    fetchNote();
    socket.connect();
    socket.emit('join_note', { noteId: id });

    socket.on('note_update', (content) => {
      setNote((prev) => ({ ...prev, content }));
    });

    socket.on('active_users', setActiveUsers);

    socket.on('user_joined', (username) => {
      showTemporaryNotification(` ${username || 'A user'} joined the note`);
    });

    socket.on('user_left', (username) => {
      showTemporaryNotification(` ${username || 'A user'} left the note`);
    });

    return () => {
      isMounted.current = false;
      socket.emit('leave_note', { noteId: id });
      socket.off('note_update');
      socket.off('active_users');
      socket.off('user_joined');
      socket.off('user_left');
      socket.disconnect();
    };
  }, [id]);

  const debouncedSave = useCallback(
    (content) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);

      saveTimeout.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await axios.put(`https://real-time-collaborative-notes-te.onrender.com/notes/${id}`, { content });
          if (isMounted.current) {
            setNote((prev) => ({
              ...prev,
              updatedAt: new Date().toISOString(),
            }));
            setIsSaving(false);
          }
        } catch (err) {
          console.error('Failed to save note:', err);
        }
      }, 1000);
    },
    [id]
  );

  const handleChange = (e) => {
    const content = e.target.value;
    setNote((prev) => ({ ...prev, content }));
    socket.emit('note_update', content);
    debouncedSave(content);
  };

  const showTemporaryNotification = (message) => {
    setUserNotification(message);
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);

    notificationTimeout.current = setTimeout(() => {
      setUserNotification('');
    }, 3000); 
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 px-4">
      <div className="backdrop-blur-md bg-white/20 border border-white/30 shadow-lg p-6 md:p-8 rounded-xl w-full max-w-5xl transition-all duration-300 hover:shadow-xl text-white">

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white drop-shadow-sm mb-2 text-center sm:text-left">
            📝 {note.title}
          </h2>
          <div className="text-sm flex flex-col sm:flex-row justify-between items-center text-white/90">
            <span>🕒 Updated: {note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Not saved yet'}</span>
            <span>👥 {activeUsers} active {activeUsers > 1 ? 'users' : 'user'}</span>
          </div>
        </div>

        <div className="bg-white/10 text-sm text-white/90 rounded-md px-4 py-2 mb-4 border border-white/20">
          {isSaving ? (
            <span className="text-blue-200 font-medium animate-pulse">💾 Saving...</span>
          ) : (
            <span className="text-green-200 font-medium">✅ All changes saved</span>
          )}
        </div>

        {userNotification && (
          <div className="mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-md shadow text-center transition-opacity duration-300">
            {userNotification}
          </div>
        )}

        <TextareaAutosize
          value={note.content}
          onChange={handleChange}
          minRows={14}
          placeholder="Start writing your note..."
          aria-label="Note content"
          className="w-full bg-white/80 text-gray-800 p-4 border border-white/40 rounded-lg shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-300 text-base resize-none transition-all placeholder-gray-600 font-medium"
        />
      </div>
    </div>
  );
}

export default NoteEditor;
