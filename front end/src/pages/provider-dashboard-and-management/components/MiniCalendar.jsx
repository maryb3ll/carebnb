import React, { useState } from 'react';

import Button from '../../../components/ui/Button';

const MiniCalendar = ({ bookedSlots, onEditAvailability }) => {
  const [currentDate] = useState(new Date(2026, 1, 14));
  
  const getDaysInMonth = (date) => {
    const year = date?.getFullYear();
    const month = date?.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay?.getDate();
    const startingDayOfWeek = firstDay?.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isBooked = (day) => {
    return bookedSlots?.some(slot => {
      const slotDate = new Date(slot.date);
      return slotDate?.getDate() === day && 
             slotDate?.getMonth() === currentDate?.getMonth() &&
             slotDate?.getFullYear() === currentDate?.getFullYear();
    });
  };

  const isToday = (day) => {
    const today = new Date(2026, 1, 14);
    return day === today?.getDate() && 
           currentDate?.getMonth() === today?.getMonth() &&
           currentDate?.getFullYear() === today?.getFullYear();
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-organic">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">{monthName}</h3>
        <Button 
          variant="outline" 
          size="sm"
          iconName="Edit"
          iconPosition="left"
          onClick={onEditAvailability}
        >
          Edit Availability
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays?.map(day => (
          <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: startingDayOfWeek })?.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth })?.map((_, index) => {
          const day = index + 1;
          const booked = isBooked(day);
          const today = isToday(day);
          
          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm md:text-base
                transition-base cursor-pointer
                ${today ? 'bg-primary text-primary-foreground font-semibold' : ''}
                ${booked && !today ? 'bg-accent/10 text-accent font-medium' : ''}
                ${!booked && !today ? 'hover:bg-muted text-foreground' : ''}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-primary" />
          <span className="text-xs md:text-sm text-muted-foreground">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-accent/10 border border-accent" />
          <span className="text-xs md:text-sm text-muted-foreground">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded border border-border" />
          <span className="text-xs md:text-sm text-muted-foreground">Available</span>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;