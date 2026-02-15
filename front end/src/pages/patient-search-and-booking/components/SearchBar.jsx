import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import Icon from '../../../components/AppIcon';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 6; h <= 22; h++) {
    slots.push({ value: `${String(h).padStart(2, '0')}:00`, label: h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM` });
    slots.push({ value: `${String(h).padStart(2, '0')}:30`, label: h === 12 ? '12:30 PM' : h < 12 ? `${h}:30 AM` : `${h - 12}:30 PM` });
  }
  return slots;
})();

const PHOTON_API = 'https://photon.komoot.io/api';
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';

async function fetchLocationSuggestions(query) {
  if (!query || query.trim().length < 3) return [];
  const url = new URL(PHOTON_API);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || []).map((f) => {
    const props = f.properties || {};
    const name = props.name || '';
    const street = props.street || '';
    const housenumber = props.housenumber || '';
    const city = props.city || props.locality || '';
    const country = props.country || '';
    const display = [street, housenumber, name, city, country].filter(Boolean).join(', ');
    return {
      display,
      lat: f.geometry?.coordinates?.[1],
      lon: f.geometry?.coordinates?.[0],
      raw: props
    };
  });
}

async function reverseGeocode(lat, lon) {
  const url = new URL(PHOTON_REVERSE);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('lang', 'en');
  const res = await fetch(url);
  const data = await res.json();
  const f = data.features?.[0];
  const props = f?.properties || {};
  const name = props.name || '';
  const street = props.street || '';
  const housenumber = props.housenumber || '';
  const city = props.city || props.locality || '';
  const country = props.country || '';
  const display = [street, housenumber, name, city, country].filter(Boolean).join(', ');
  return display || `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
}

const SearchBar = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    where: '',
    date: '',
    time: '',
    careType: '',
    name: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  const [locationLoading, setLocationLoading] = useState(false);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const careTypeRef = useRef(null);
  const locationRef = useRef(null);
  const locationDebounceRef = useRef(null);
  const locationSuggestionRefs = useRef([]);
  const careTypeHoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (!searchParams?.date) return;
    const d = new Date(searchParams.date + 'T12:00:00');
    if (!isNaN(d.getTime())) setCalendarMonth(d);
  }, [searchParams?.date]);

  useEffect(() => {
    if (selectedLocationIndex >= 0 && locationSuggestionRefs.current[selectedLocationIndex]) {
      locationSuggestionRefs.current[selectedLocationIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedLocationIndex]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateRef?.current && !dateRef.current.contains(e.target)) setCalendarOpen(false);
      if (timeRef?.current && !timeRef.current.contains(e.target)) setTimePickerOpen(false);
      if (careTypeRef?.current && !careTypeRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setHoveredCategory(null);
      }
      if (locationRef?.current && !locationRef.current.contains(e.target)) setLocationSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const careTypeCategories = [
  {
    value: 'medical-visits',
    label: 'Medical Visits',
    services: [
    { value: 'cold-flu', label: 'Cold/Flu Care' },
    { value: 'fever-check', label: 'Fever Check' },
    { value: 'infection-monitoring', label: 'Infection Monitoring' },
    { value: 'medication-help', label: 'Medication Help' },
    { value: 'general-nurse', label: 'General Nurse Visit' }]

  },
  {
    value: 'clinical-procedures',
    label: 'Clinical Procedures',
    services: [
    { value: 'blood-draw', label: 'Blood Draw' },
    { value: 'iv-therapy', label: 'IV Therapy' },
    { value: 'injection', label: 'Injection Administration' },
    { value: 'chemo', label: 'Chemo Administration' },
    { value: 'wound-care', label: 'Wound Care' }]

  },
  {
    value: 'post-hospital',
    label: 'Post-Hospital Care',
    services: [
    { value: 'post-surgery', label: 'Post-Surgery Check' },
    { value: 'chronic-condition', label: 'Chronic Condition Monitoring' },
    { value: 'medication-management', label: 'Medication Management' },
    { value: 'vital-signs', label: 'Vital Signs Monitoring' }]

  },
  {
    value: 'support-care',
    label: 'Support Care',
    services: [
    { value: 'physical-therapy', label: 'Physical Therapy' },
    { value: 'lactation', label: 'Lactation Consultant' },
    { value: 'elder-support', label: 'Elder Support' },
    { value: 'palliative', label: 'Palliative Care' }]

  }];


  const getSelectedLabel = () => {
    if (!searchParams?.careType) return 'Select care type';

    for (const category of careTypeCategories) {
      const service = category?.services?.find((s) => s?.value === searchParams?.careType);
      if (service) return service?.label;
    }
    return searchParams?.careType;
  };

  const handleInputChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationInput = (value) => {
    handleInputChange('where', value);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (!value || value.trim().length < 3) {
      setLocationSuggestions([]);
      setLocationSuggestionsOpen(false);
      setSelectedLocationIndex(-1);
      return;
    }
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const items = await fetchLocationSuggestions(value);
        setLocationSuggestions(items);
        setSelectedLocationIndex(-1);
        setLocationSuggestionsOpen(items.length > 0);
      } catch {
        setLocationSuggestions([]);
        setLocationSuggestionsOpen(false);
      }
    }, 250);
  };

  const selectLocationSuggestion = (item) => {
    if (!item) return;
    handleInputChange('where', item.display);
    setLocationSuggestions([]);
    setLocationSuggestionsOpen(false);
    setSelectedLocationIndex(-1);
  };

  const handleLocationKeyDown = (e) => {
    if (!locationSuggestionsOpen || locationSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(selectedLocationIndex + 1, locationSuggestions.length - 1);
      setSelectedLocationIndex(next);
      locationSuggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(selectedLocationIndex - 1, -1);
      setSelectedLocationIndex(next);
      if (next >= 0) locationSuggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && selectedLocationIndex >= 0 && locationSuggestions[selectedLocationIndex]) {
      e.preventDefault();
      selectLocationSuggestion(locationSuggestions[selectedLocationIndex]);
    } else if (e.key === 'Escape') {
      setLocationSuggestionsOpen(false);
      setSelectedLocationIndex(-1);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const display = await reverseGeocode(lat, lon);
          handleInputChange('where', display);
        } catch {
          handleInputChange('where', `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
        setLocationSuggestionsOpen(false);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleServiceSelect = (serviceValue) => {
    handleInputChange('careType', serviceValue);
    setIsDropdownOpen(false);
    setHoveredCategory(null);
  };

  const getCalendarDays = () => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const padStart = start.getDay();
    const padEnd = 6 - end.getDay();
    return [
      ...Array.from({ length: padStart }, () => null),
      ...days,
      ...Array.from({ length: padEnd }, () => null)
    ];
  };

  const handleSelectDate = (d) => {
    if (!d) return;
    const past = isBefore(d, startOfDay(new Date()));
    if (past) return;
    handleInputChange('date', format(d, 'yyyy-MM-dd'));
    setCalendarOpen(false);
  };

  const handleSelectTime = (value) => {
    handleInputChange('time', value);
    setTimePickerOpen(false);
  };

  const formatTimeDisplay = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':');
    const hour = parseInt(h, 10);
    const am = hour < 12;
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m || '00'} ${am ? 'AM' : 'PM'}`;
  };

  const handleSearch = () => {
    const combined = searchParams?.date && searchParams?.time
      ? `${searchParams.date}T${searchParams.time}`
      : searchParams?.date
        ? `${searchParams.date}T00:00:00`
        : searchParams?.time
          ? `${new Date().toISOString().slice(0, 10)}T${searchParams.time}`
          : searchParams?.time || '';
    onSearch({ ...searchParams, time: combined });
  };

  return (
    <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="w-full min-w-0 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-full shadow-organic-md px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 sm:gap-4 lg:gap-0 lg:divide-x divide-stone-200">
            {/* Location */}
            <div className="group flex-1 min-w-0 flex flex-col gap-1.5 px-3 md:px-5 lg:pb-0.5 relative" ref={locationRef}>
              <label className="block font-semibold text-sm text-stone-900 shrink-0 leading-tight">
                Location <span className="text-primary">*</span>
              </label>
              <div className="flex items-center gap-2 min-h-[2.25rem]">
                <div className="flex-1 min-w-0 relative">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Start typing an address..."
                    value={searchParams?.where}
                    onChange={(e) => handleLocationInput(e?.target?.value ?? '')}
                    onKeyDown={handleLocationKeyDown}
                    onFocus={() => locationSuggestions.length > 0 && setLocationSuggestionsOpen(true)}
                    aria-autocomplete="list"
                    aria-expanded={locationSuggestionsOpen}
                    className="w-full min-w-0 text-base md:text-lg text-stone-900 placeholder:text-stone-400 bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight"
                  />
                  {locationSuggestionsOpen && locationSuggestions.length > 0 && (
                    <ul
                      className="absolute left-0 top-full mt-2 min-w-[100%] w-max max-w-[min(90vw,36rem)] bg-white rounded-xl shadow-lg border border-stone-200 z-[100] max-h-[320px] overflow-y-auto py-2 list-none"
                      role="listbox"
                    >
                      {locationSuggestions.map((item, i) => (
                        <li
                          key={`${item.display}-${i}`}
                          ref={(el) => { locationSuggestionRefs.current[i] = el; }}
                          role="option"
                          aria-selected={i === selectedLocationIndex}
                          className={`px-4 py-3 text-base cursor-pointer break-words whitespace-normal ${i === selectedLocationIndex ? 'bg-primary/10 text-primary' : 'text-stone-900 hover:bg-stone-50'}`}
                          onClick={() => selectLocationSuggestion(item)}
                        >
                          {item.display}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  title="Use current location"
                  disabled={locationLoading}
                  onClick={handleMyLocation}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-white text-[10px] font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {locationLoading ? (
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon name="MapPin" size={14} className="shrink-0" />
                  )}
                  <span className="hidden sm:inline">My location</span>
                </button>
              </div>
            </div>

            {/* Date - styled calendar picker only */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-3 md:px-5 lg:pb-0.5 relative" ref={dateRef}>
              <label className="block font-semibold text-sm text-stone-900 shrink-0 leading-tight">
                Date
              </label>
              <button
                type="button"
                onClick={() => setCalendarOpen((o) => !o)}
                className={`group w-full min-h-[1.75rem] text-left text-sm md:text-base bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight flex items-center justify-between gap-2 ${searchParams?.date ? 'text-stone-900' : 'text-stone-400'}`}>
                <span>{searchParams?.date ? format(new Date(searchParams.date + 'T12:00:00'), 'MMM d, yyyy') : 'Pick date'}</span>
                <Icon name="Calendar" size={18} className="shrink-0 text-stone-500 transition-all duration-200 group-hover:text-primary group-hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]" />
              </button>
              {calendarOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-200 z-50 p-4 min-w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600">
                      <Icon name="ChevronLeft" size={18} />
                    </button>
                    <span className="font-semibold text-sm text-stone-900">
                      {format(calendarMonth, 'MMMM yyyy')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600">
                      <Icon name="ChevronRight" size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-stone-500 py-1">
                        {day}
                      </div>
                    ))}
                    {getCalendarDays().map((d, i) => {
                      if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
                      const selected = searchParams?.date && isSameDay(d, new Date(searchParams.date + 'T12:00:00'));
                      const past = isBefore(d, startOfDay(new Date()));
                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          onClick={() => handleSelectDate(d)}
                          disabled={past}
                          className={`
                            aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                            ${past ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'hover:bg-stone-100'}
                            ${!past && isToday(d) && !selected ? 'bg-stone-100 font-semibold text-stone-900' : ''}
                            ${selected ? 'bg-primary text-white font-semibold' : ''}
                            ${!past && !selected ? 'text-stone-900' : ''}
                          `}>
                          {format(d, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Time - styled time-slot picker only */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-3 md:px-5 lg:pb-0.5 relative" ref={timeRef}>
              <label className="block font-semibold text-sm text-stone-900 shrink-0 leading-tight">
                Time
              </label>
              <button
                type="button"
                onClick={() => setTimePickerOpen((o) => !o)}
                className={`group w-full min-h-[1.75rem] text-left text-sm md:text-base bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight flex items-center justify-between gap-2 ${searchParams?.time ? 'text-stone-900' : 'text-stone-400'}`}>
                <span>{searchParams?.time ? formatTimeDisplay(searchParams.time) : 'Pick time'}</span>
                <Icon name="Clock" size={18} className="shrink-0 text-stone-500 transition-all duration-200 group-hover:text-primary group-hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]" />
              </button>
              {timePickerOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-200 z-50 p-3 max-h-[280px] overflow-y-auto min-w-[140px]">
                  <div className="grid grid-cols-2 gap-0.5">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => handleSelectTime(slot.value)}
                        className={`px-3 py-2 text-left text-sm rounded-lg transition-colors hover:bg-stone-100 ${
                          searchParams?.time === slot.value ? 'bg-primary text-white hover:bg-primary/90' : 'text-stone-900'
                        }`}>
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Type of Care - Hierarchical Dropdown */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-3 md:px-5 lg:pb-0.5 relative" ref={careTypeRef}>
              <label className="block font-semibold text-sm text-stone-900 shrink-0 leading-tight">
                Type of Care
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full min-h-[1.75rem] text-left text-sm md:text-base text-stone-900 bg-transparent border-none outline-none focus:ring-0 cursor-pointer flex items-center justify-between p-0 leading-tight">

                <span className={!searchParams?.careType ? 'text-stone-400' : ''}>
                  {getSelectedLabel()}
                </span>
                <Icon name="ChevronDown" size={16} className={`shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu - stop mousedown so click-outside doesn't close before selection */}
              {isDropdownOpen &&
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[250px]" onMouseDown={(e) => e.stopPropagation()}>
                  {careTypeCategories?.map((category) =>
                <div
                  key={category?.value}
                  className="relative"
                  onMouseEnter={() => {
                    if (careTypeHoverTimeoutRef.current) clearTimeout(careTypeHoverTimeoutRef.current);
                    careTypeHoverTimeoutRef.current = null;
                    setHoveredCategory(category?.value);
                  }}
                  onMouseLeave={() => {
                    careTypeHoverTimeoutRef.current = setTimeout(() => setHoveredCategory(null), 120);
                  }}>

                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                        <span className="font-medium text-sm">{category?.label}</span>
                        <Icon name="ChevronRight" size={16} />
                      </div>

                      {/* Sub-menu - overlap slightly (-ml-1) so mouse can move from row to submenu without leaving and closing */}
                      {hoveredCategory === category?.value &&
                  <div
                    className="absolute left-full top-0 -ml-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[220px] z-10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      if (careTypeHoverTimeoutRef.current) clearTimeout(careTypeHoverTimeoutRef.current);
                      careTypeHoverTimeoutRef.current = null;
                    }}
                  >
                          {category?.services?.map((service) =>
                    <div
                      key={service?.value}
                      onClick={() => handleServiceSelect(service?.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="px-4 py-2.5 hover:bg-primary hover:text-white cursor-pointer text-sm first:rounded-t-lg last:rounded-b-lg">

                              {service?.label}
                            </div>
                    )}
                        </div>
                  }
                    </div>
                )}
                </div>
              }
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-3 md:px-5 lg:pb-0.5">
              <label className="block font-semibold text-sm text-stone-900 shrink-0 leading-tight">
                Name
              </label>
              <input
                type="text"
                placeholder="Provider name (optional)"
                value={searchParams?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                className="w-full min-h-[1.75rem] text-sm md:text-base text-stone-900 placeholder:text-stone-400 bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight" />
            </div>

            {/* Search Button */}
            <div className="flex flex-col justify-end pt-2 lg:pt-0 lg:justify-center px-3 md:px-5 lg:pl-5">
              <button
                onClick={handleSearch}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-250 shadow-organic hover:shadow-organic-md"
                aria-label="Search for providers">
                <Icon name="Search" size={20} strokeWidth={2} />
                <span className="font-medium text-sm md:text-base">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default SearchBar;