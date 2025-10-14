import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

const CalendarView = ({ events, handleDateClick }) => {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="timeGridWeek"
      events={events}
      dateClick={handleDateClick}
      height="auto"
    />
  );
};

export default CalendarView;
