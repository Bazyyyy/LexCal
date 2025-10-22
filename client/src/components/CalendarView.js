import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView({
  events = [],
  handleDateClick,
  handleEventClick,
  businessHoursStart = '09:00',
  businessHoursEnd = '17:00',
  isPreview = false
}) {
  const calendarRef = useRef(null);

  // Erzwinge Resize nach Render (für Preview)
  useEffect(() => {
    if (isPreview && calendarRef.current) {
      const timer = setTimeout(() => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPreview, events]);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={isPreview ? "timeGridWeek" : "timeGridWeek"} // Preview zeigt Wochenansicht mit Zeiten
      headerToolbar={{ 
        left: isPreview ? 'title' : 'prev,next today', 
        center: '', 
        right: isPreview ? '' : 'dayGridMonth,timeGridWeek,timeGridDay' 
      }}
      events={events}
      dateClick={(arg) => !isPreview && handleDateClick && handleDateClick(arg)}
      eventClick={(arg) => !isPreview && handleEventClick && handleEventClick(arg)}
      selectable={!isPreview}
      editable={false}
      height="auto"
      // Preview: nur Geschäftszeiten anzeigen, normal: ganzer Tag
      slotMinTime={isPreview ? businessHoursStart : "00:00"}
      slotMaxTime={isPreview ? businessHoursEnd : "24:00"}
      businessHours={[
        {
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: businessHoursStart,
          endTime: businessHoursEnd
        }
      ]}
      dayCellDidMount={(info) => {
        const day = info.date.getDay();
        if (day === 0 || day === 6) {
          info.el.classList.add('fc-weekend-disabled');
        }
      }}
      // Preview-spezifische Optionen
      aspectRatio={isPreview ? 1.8 : 1.35}
      dayMaxEventRows={isPreview ? 2 : 4}
      // Weitere Preview-Anpassungen
      slotDuration={isPreview ? "01:00:00" : "00:30:00"} // Preview: 1h Slots, normal: 30min
      allDaySlot={!isPreview} // Preview: keine "ganztags" Zeile
    />
  );
}
