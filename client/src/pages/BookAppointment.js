import { useState } from 'react';
import CalendarView from '../components/CalendarView';

const BookAppointment = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = async (arg) => {
    setSelectedDate(arg.dateStr);
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('userId'); // optional: speichern beim Login
    const lawyerId = 'ID_DES_ANWALTS'; // später dynamisch auswählen

    const res = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        lawyerId,
        clientId,
        date: arg.dateStr
      })
    });

    const data = await res.json();
    if (res.ok) alert('Appointment booked!');
    else alert(data.error);
  };

  const dummyEvents = [
    { title: 'Available Slot', start: '2025-10-16T10:00:00' },
    { title: 'Available Slot', start: '2025-10-17T14:00:00' },
  ];

  return (
    <div>
      <h2>Book an Appointment</h2>
      <CalendarView events={dummyEvents} handleDateClick={handleDateClick} />
    </div>
  );
};

export default BookAppointment;
