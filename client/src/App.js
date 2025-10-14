import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LawyerList from './pages/LawyerList';
import BookAppointment from './pages/BookAppointment';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lawyers" element={<LawyerList />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/" element={<Login />} /> {/* Default Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
