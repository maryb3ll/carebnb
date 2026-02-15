import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProviderModal = ({ provider, onClose, onBook }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const availableDates = [
    { date: '2026-02-15', day: 'Sat', dayNum: '15' },
    { date: '2026-02-16', day: 'Sun', dayNum: '16' },
    { date: '2026-02-17', day: 'Mon', dayNum: '17' },
    { date: '2026-02-18', day: 'Tue', dayNum: '18' },
    { date: '2026-02-19', day: 'Wed', dayNum: '19' },
    { date: '2026-02-20', day: 'Thu', dayNum: '20' },
    { date: '2026-02-21', day: 'Fri', dayNum: '21' }
  ];

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      onBook({ provider, date: selectedDate, time: selectedTime });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-organic-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-organic transition-all duration-250"
          aria-label="Close modal"
        >
          <Icon name="X" size={20} strokeWidth={2} />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            <Image
              src={provider?.image}
              alt={provider?.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                  {provider?.name}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-3">
                  {provider?.specialty}
                </p>
                <div className="flex items-center gap-4 text-sm md:text-base">
                  <div className="flex items-center gap-1">
                    <Icon name="Star" size={18} color="var(--color-primary)" fill="var(--color-primary)" strokeWidth={0} />
                    <span className="font-medium text-foreground">{provider?.rating}</span>
                    <span className="text-muted-foreground">({provider?.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="MapPin" size={16} strokeWidth={2} />
                    <span>{provider?.distance} miles away</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                Credentials & Experience
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {provider?.credentials?.map((credential, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {credential}
                  </span>
                ))}
              </div>
              <p className="text-sm md:text-base text-foreground leading-relaxed">
                {provider?.bio}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">
                Select Date
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 smooth-scroll">
                {availableDates?.map((dateObj) => (
                  <button
                    key={dateObj?.date}
                    onClick={() => setSelectedDate(dateObj?.date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 md:w-20 h-20 md:h-24 rounded-xl border-2 transition-all duration-250 ${
                      selectedDate === dateObj?.date
                        ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground mb-1">{dateObj?.day}</span>
                    <span className="text-lg md:text-xl font-semibold text-foreground">{dateObj?.dayNum}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">
                  Select Time
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timeSlots?.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm md:text-base font-medium transition-all duration-250 ${
                        selectedTime === time
                          ? 'border-primary bg-primary/5 text-primary' :'border-border text-foreground hover:border-primary/50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                fullWidth
                className="sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime}
                fullWidth
                className="sm:flex-1"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderModal;