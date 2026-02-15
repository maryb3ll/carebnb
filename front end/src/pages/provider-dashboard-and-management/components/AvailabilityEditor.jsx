import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { normalizeTime } from '../../../lib/timezone';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const AvailabilityEditor = ({ providerId, onClose }) => {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'blocks'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Days of the week
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Time options (hourly from 6 AM to 11 PM)
  const timeOptions = [];
  for (let hour = 6; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    timeOptions.push({
      value: `${hourStr}:00`,
      label: `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    });
  }

  // Weekly schedule state (day_of_week -> {start, end} or null if unavailable)
  const [weeklySchedule, setWeeklySchedule] = useState({
    0: null, // Sunday
    1: { start: '09:00', end: '17:00' }, // Monday default
    2: { start: '09:00', end: '17:00' }, // Tuesday default
    3: { start: '09:00', end: '17:00' }, // Wednesday default
    4: { start: '09:00', end: '17:00' }, // Thursday default
    5: { start: '09:00', end: '17:00' }, // Friday default
    6: null, // Saturday
  });

  const [recurringIds, setRecurringIds] = useState({}); // Track IDs for updating

  // One-time blocks state
  const [blocks, setBlocks] = useState([]);
  const [newBlock, setNewBlock] = useState({
    date: '',
    start: '09:00',
    end: '17:00',
    notes: ''
  });

  // Fetch existing availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!providerId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/providers/${providerId}/availability`);

        if (response.ok) {
          const data = await response.json();

          // Process recurring schedule
          const schedule = { ...weeklySchedule };
          const ids = {};

          (data.recurring || []).forEach(entry => {
            // Normalize database times to HH:MM format
            schedule[entry.day_of_week] = {
              start: normalizeTime(entry.start_time),
              end: normalizeTime(entry.end_time)
            };
            ids[entry.day_of_week] = entry.id;
          });

          setWeeklySchedule(schedule);
          setRecurringIds(ids);

          // Process one-time blocks
          const blocksData = (data.one_time || [])
            .filter(entry => entry.availability_type === 'one_time_blocked')
            .map(entry => ({
              id: entry.id,
              date: entry.specific_date,
              start: normalizeTime(entry.start_time),
              end: normalizeTime(entry.end_time),
              notes: entry.notes || ''
            }));

          setBlocks(blocksData);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [providerId]);

  // Toggle day availability
  const toggleDay = (dayValue) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayValue]: prev[dayValue] ? null : { start: '09:00', end: '17:00' }
    }));
  };

  // Update time for a day
  const updateDayTime = (dayValue, field, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value
      }
    }));
  };

  // Save weekly schedule
  const saveWeeklySchedule = async () => {
    try {
      setSaving(true);
      const headers = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      // Delete existing recurring entries
      for (const id of Object.values(recurringIds)) {
        await fetch(`/api/providers/${providerId}/availability?entryId=${id}`, {
          method: 'DELETE',
          headers
        });
      }

      // Create new entries for enabled days
      const newIds = {};
      for (const day of daysOfWeek) {
        const schedule = weeklySchedule[day.value];
        if (schedule) {
          const response = await fetch(`/api/providers/${providerId}/availability`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              availability_type: 'recurring',
              day_of_week: day.value,
              start_time: schedule.start,
              end_time: schedule.end
            })
          });

          if (response.ok) {
            const data = await response.json();
            newIds[day.value] = data.availability.id;
          }
        }
      }

      setRecurringIds(newIds);
      // Success - UI will show the updated schedule
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add new block
  const addBlock = async () => {
    if (!newBlock.date || !newBlock.start || !newBlock.end) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      const headers = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`/api/providers/${providerId}/availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          availability_type: 'one_time_blocked',
          specific_date: newBlock.date,
          start_time: newBlock.start,
          end_time: newBlock.end,
          is_available: false,
          notes: newBlock.notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBlocks(prev => [...prev, {
          id: data.availability.id,
          date: newBlock.date,
          start: newBlock.start,
          end: newBlock.end,
          notes: newBlock.notes
        }]);

        // Reset form
        setNewBlock({ date: '', start: '09:00', end: '17:00', notes: '' });
        // Success - block will appear in the list below
      } else {
        throw new Error('Failed to add block');
      }
    } catch (error) {
      console.error('Error adding block:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete a block
  const deleteBlock = async (blockId) => {
    if (!confirm('Are you sure you want to delete this time block?')) {
      return;
    }

    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`/api/providers/${providerId}/availability?entryId=${blockId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        // Success - block removed from list
      } else {
        throw new Error('Failed to delete block');
      }
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl p-8">
          <p className="text-foreground">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-muted p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Manage Availability</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
          >
            <Icon name="X" size={20} color="var(--color-foreground)" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-muted px-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-3 font-medium transition-base ${
              activeTab === 'schedule'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-3 font-medium transition-base ${
              activeTab === 'blocks'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Block Time
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Set your regular working hours for each day of the week. Patients can only book appointments during these times.
              </p>

              {daysOfWeek.map(day => (
                <div key={day.value} className="flex items-center gap-4">
                  <label className="flex items-center gap-3 min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={!!weeklySchedule[day.value]}
                      onChange={() => toggleDay(day.value)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="font-medium text-foreground">{day.label}</span>
                  </label>

                  {weeklySchedule[day.value] && (
                    <div className="flex items-center gap-3 flex-1">
                      <select
                        value={weeklySchedule[day.value].start}
                        onChange={(e) => updateDayTime(day.value, 'start', e.target.value)}
                        className="px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      <span className="text-muted-foreground">to</span>

                      <select
                        value={weeklySchedule[day.value].end}
                        onChange={(e) => updateDayTime(day.value, 'end', e.target.value)}
                        className="px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4">
                <Button
                  variant="default"
                  onClick={saveWeeklySchedule}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Weekly Schedule'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Block specific dates and times when you're unavailable (e.g., vacation, personal appointments).
              </p>

              {/* Add New Block Form */}
              <div className="bg-muted rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-foreground">Add Time Block</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newBlock.date}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Time Range
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={newBlock.start}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, start: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      <span className="text-muted-foreground">-</span>

                      <select
                        value={newBlock.end}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, end: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBlock.notes}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Vacation, Personal appointment"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <Button
                  variant="default"
                  onClick={addBlock}
                  disabled={saving || !newBlock.date}
                  className="w-full"
                >
                  {saving ? 'Adding...' : 'Add Time Block'}
                </Button>
              </div>

              {/* Current Blocks */}
              {blocks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Current Time Blocks</h3>
                  <div className="space-y-2">
                    {blocks
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(block => (
                        <div key={block.id} className="flex items-center justify-between bg-muted rounded-xl p-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {new Date(block.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {block.start} - {block.end}
                              {block.notes && ` • ${block.notes}`}
                            </p>
                          </div>

                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="w-8 h-8 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center transition-base"
                            title="Delete block"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {blocks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No time blocks set. Add one above to block specific dates and times.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityEditor;
