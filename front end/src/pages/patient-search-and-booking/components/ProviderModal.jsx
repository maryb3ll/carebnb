import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { localDateTimeToUTC } from '../../../lib/timezone';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProviderModal = ({ provider, onClose, onBook }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available slots when provider changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!provider?.id) return;

      setLoadingSlots(true);

      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      try {
        const response = await fetch(`/api/providers/${provider.id}/slots?from_date=${fromDate}&to_date=${toDate}&duration=60`);
        const data = await response.json();

        if (response.ok && data.available_slots) {
          setAvailableSlotsByDate(data.available_slots);

          // Extract dates that have availability
          const dates = Object.keys(data.available_slots)
            .filter(dateStr => data.available_slots[dateStr].length > 0)
            .map(dateStr => {
              const d = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues
              return {
                date: dateStr,
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate().toString()
              };
            });

          setAvailableDates(dates);
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [provider?.id]);

  // Get time slots for selected date
  const timeSlotsForSelectedDate = selectedDate && availableSlotsByDate[selectedDate]
    ? availableSlotsByDate[selectedDate].map(timeStr => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      })
    : [];

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    // Convert to UTC ISO timestamp
    const when = localDateTimeToUTC(selectedDate, selectedTime);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerId: provider.id,
          service: 'nursing',
          when: when,
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        // Conflict - slot no longer available
        alert(`This time slot is no longer available. Please select another time.${data.alternatives && data.alternatives.length > 0 ? '\n\nTry: ' + data.alternatives.join(', ') : ''}`);

        // Refresh available slots
        const fromDate = new Date().toISOString().split('T')[0];
        const toDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const refreshResponse = await fetch(`/api/providers/${provider.id}/slots?from_date=${fromDate}&to_date=${toDate}&duration=60`);
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setAvailableSlotsByDate(refreshData.available_slots);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      // Success - pass booking data to parent
      onBook({
        provider,
        date: selectedDate,
        time: selectedTime,
        bookingId: data.booking?.id
      });

    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
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
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-stone-100">
            <Image
              src={provider?.image}
              alt={provider?.imageAlt}
              className="w-full h-full object-contain"
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm md:text-base">
                  <div className="flex items-center gap-1.5">
                    <Icon name="Star" size={18} color="var(--color-primary)" fill="var(--color-primary)" strokeWidth={0} className="shrink-0" />
                    <span className="font-medium text-foreground">{provider?.rating}</span>
                    <span className="text-muted-foreground">({provider?.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon name="MapPin" size={16} strokeWidth={2} className="shrink-0" />
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

            <div className="mb-8 w-full">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4 text-left">
                Select Date
              </h3>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading available dates...</p>
                </div>
              ) : availableDates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No available dates in the next 14 days</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 smooth-scroll w-full min-w-0">
                  {availableDates?.map((dateObj) => (
                    <button
                      key={dateObj?.date}
                      onClick={() => setSelectedDate(dateObj?.date)}
                      type="button"
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 md:w-20 min-h-[5rem] md:min-h-[6rem] rounded-xl border-2 transition-all duration-250 py-2 ${
                        selectedDate === dateObj?.date
                          ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs text-muted-foreground leading-tight block w-full text-center">{dateObj?.day}</span>
                      <span className="text-lg md:text-xl font-semibold text-foreground leading-tight block w-full text-center mt-1">{dateObj?.dayNum}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="mb-8 w-full">
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4 text-left">
                  Select Time
                </h3>
                {timeSlotsForSelectedDate.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No available times for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeSlotsForSelectedDate?.map((time) => (
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
                )}
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