import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateNote() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createNote = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/notes', { title });
      navigate(`/note/${res.data._id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 px-4">
      <div className="backdrop-blur-md bg-white/20 border border-white/30 shadow-lg p-8 rounded-xl w-full max-w-md transition-all duration-300 hover:shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-6 drop-shadow-sm">
          📝 Create Your Note
        </h1>

        <input
          type="text"
          placeholder="Give your note a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-white/70 border border-white/40 text-gray-800 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 mb-5 placeholder-gray-500 font-medium"
        />

        <button
          onClick={createNote}
          disabled={!title.trim() || loading}
          className={`w-full py-3 font-semibold rounded-lg text-lg tracking-wide transition duration-300 ${
            !title.trim() || loading
              ? 'bg-blue-200 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white shadow-md hover:shadow-xl'
          }`}
        >
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </div>
    </div>
  );
}

export default CreateNote;
