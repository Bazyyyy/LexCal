import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView({
  events = [],
  handleDateClick,
  handleEventClick,
  businessHoursStart = '09:00',
  businessHoursEnd = '17:00'
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
      events={events}
      dateClick={(arg) => handleDateClick && handleDateClick(arg)}
      eventClick={(arg) => handleEventClick && handleEventClick(arg)}
      selectable={true}
      editable={false}
      height="auto"
      slotMinTime="00:00"
      slotMaxTime="24:00"
      businessHours={[
        {
          daysOfWeek: [1, 2, 3, 4, 5], // Mo-FR
          startTime: businessHoursStart,
          endTime: businessHoursEnd
        }
      ]}
      // add weekend styling class to day cells (used for grey-out)
      dayCellDidMount={(info) => {
        const day = info.date.getDay();
        if (day === 0 || day === 6) {
          info.el.classList.add('fc-weekend-disabled');
        }
      }}
    />
  );
}
