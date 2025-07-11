import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateNote from './pages/CreateNote';
import NoteEditor from './pages/NoteEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateNote />} />
        <Route path="/note/:id" element={<NoteEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;