import { useEffect, useState } from 'react';

const Dashboard = () => {
  const role = localStorage.getItem('role'); // Rolle auslesen
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (role === 'lawyer') setMessage('Welcome, Lawyer! View your appointments.');
    else if (role === 'client') setMessage('Welcome, Client! Book your appointment.');
    else if (role === 'admin') setMessage('Welcome, Admin! Manage users and schedules.');
  }, [role]);

  return <h2>{message}</h2>;
};

export default Dashboard;
