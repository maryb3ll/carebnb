import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import SearchBar from './components/SearchBar';
import ProviderCard from './components/ProviderCard';
import ProviderModal from './components/ProviderModal';
import BookingPanel from './components/BookingPanel';
import RequestStatus from './components/RequestStatus';
import NotificationsList from './components/NotificationsList';
import Icon from '../../components/AppIcon';
import { providersData } from '../../data/providers';
import { getProviders } from '../../api/carebnb';
import { filterProvidersByCareType, rankProviders } from './searchUtils';
import { supabase } from '../../lib/supabase';

const SPECIALIST_OPTIONS = [
  'Family medicine doctor',
  'Internal medicine doctor',
  'Pediatrician',
  'Obstetrician and Gynecologist',
  'Gynecologist',
  'Minimally invasive gynecologic surgeon',
  'Nurse Practitioner',
  'Urogynecologist',
  'Geriatrician',
  'Nurse Practitioner & Lactation Consultant',
  'Pediatric/adolescent gynecologist',
  'Physical Therapist',
  'Registered Nurse',
  'Senior Physical Therapist'
];

const PatientSearchAndBooking = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [totalProviderCount, setTotalProviderCount] = useState(null);
  const [usedNameFilter, setUsedNameFilter] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [useApi, setUseApi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 37.44, lng: -122.17 });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const filterRef = useRef(null);
  const providersScrollRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef?.current && !filterRef.current.contains(e.target)) {
        setFilterPanelOpen(false);
      }
    };
    const t = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Generate notifications from bookings
  const generateNotifications = (bookings) => {
    const notifs = [];
    const now = new Date();

    bookings.forEach((booking) => {
      const providerName = booking.provider?.name || "Provider";
      const service = booking.service.replace(/_/g, " ");
      const scheduledDate = new Date(booking.scheduled_at);
      const dateStr = scheduledDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = scheduledDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

      // Notification for confirmed appointments
      if (booking.status === "confirmed") {
        notifs.push({
          id: `confirm-${booking.id}`,
          type: "confirmation",
          title: "Appointment Confirmed",
          message: `Your appointment with ${providerName} for ${service} on ${dateStr} at ${timeStr} has been confirmed.`,
          timestamp: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
          read: false
        });

        // Reminder for upcoming appointments (within 24 hours)
        const hoursUntil = (scheduledDate - now) / (1000 * 60 * 60);
        if (hoursUntil > 0 && hoursUntil < 24) {
          notifs.push({
            id: `reminder-${booking.id}`,
            type: "reminder",
            title: "Upcoming Appointment Reminder",
            message: `You have an appointment with ${providerName} ${hoursUntil < 1 ? 'soon' : 'tomorrow'} at ${timeStr}. Please ensure someone is home to receive the provider.`,
            timestamp: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
            read: false
          });
        }
      }

      // Notification for pending appointments
      if (booking.status === "pending") {
        notifs.push({
          id: `pending-${booking.id}`,
          type: "update",
          title: "Request Status Update",
          message: `${providerName} is reviewing your request for ${service}. You'll be notified when they respond.`,
          timestamp: new Date(scheduledDate.getTime() - 12 * 60 * 60 * 1000), // 12 hours before
          read: false
        });
      }

      // Notification for declined appointments
      if (booking.status === "declined") {
        notifs.push({
          id: `declined-${booking.id}`,
          type: "update",
          title: "Request Update",
          message: `${providerName} declined your request for ${service}. Click to view alternative providers.`,
          timestamp: new Date(scheduledDate.getTime() - 6 * 60 * 60 * 1000), // 6 hours before
          read: false
        });
      }
    });

    // Sort by timestamp (most recent first) and take top 5
    return notifs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  };

  // Fetch recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const headers = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/bookings", { headers });
        const data = await res.json();

        if (res.ok && data.bookings) {
          // Get top 3 most recent bookings for requests section
          const recent = data.bookings.slice(0, 3).map(booking => ({
            id: booking.id,
            providerName: booking.provider?.name || "Provider",
            providerImage: booking.provider?.photo_url || "https://img.rocket.new/generatedImages/rocket_gen_img_1787f0ff5-1764790614873.png",
            providerImageAlt: `${booking.provider?.name || "Provider"} - ${booking.provider?.role || "Healthcare provider"}`,
            serviceType: booking.service.replace(/_/g, " "),
            requestedDate: new Date(booking.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            requestedTime: new Date(booking.scheduled_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            status: booking.status === "confirmed" ? "accepted" : booking.status
          }));
          setRecentRequests(recent);

          // Generate notifications from all bookings
          const generatedNotifications = generateNotifications(data.bookings);
          setNotifications(generatedNotifications);
        }
      } catch (error) {
        console.error('Failed to fetch recent bookings:', error);
      }
    };

    fetchRecentBookings();
  }, []);

  useEffect(() => {
    if (!useApi) return;
    setLoading(true);
    getProviders({ service: 'nursing', lat: userLocation.lat, lng: userLocation.lng })
      .then(({ list, total }) => {
        setFilteredProviders(list);
        setTotalProviderCount(total);
        setHasSearched(true);
      })
      .catch(() => setUseApi(false))
      .finally(() => setLoading(false));
  }, [useApi, userLocation.lat, userLocation.lng]);





  const getFallbackResults = (searchParams) => {
    let results = [...(providersData || [])];
    if (searchParams?.where?.trim()) {
      results = results.filter((provider) => (provider?.distance ?? 99) <= 5);
    }
    if (searchParams?.time) {
      const requestedDate = new Date(searchParams.time);
      const today = new Date();
      results = results.filter((provider) => {
        if (requestedDate?.toDateString() === today?.toDateString()) {
          return provider?.available === true;
        }
        return true;
      });
    }
    results = filterProvidersByCareType(results, searchParams?.careType);
    if (searchParams?.name?.trim()) {
      const searchName = searchParams.name.toLowerCase();
      results = results.filter((provider) =>
        provider?.name?.toLowerCase()?.includes(searchName)
      );
    }
    return results;
  };

  const handleSearch = async (searchParams) => {
    setLoading(true);
    let results = [];
    try {
      if (useApi) {
        const service = 'nursing';
        const when = searchParams?.time || null;
        const { list } = await getProviders({ service, lat: userLocation.lat, lng: userLocation.lng, when, limit: 50 });
        results = filterProvidersByCareType(list || [], searchParams?.careType);
        if (searchParams?.name?.trim()) {
          const q = searchParams.name.toLowerCase();
          results = results.filter((p) => p.name?.toLowerCase().includes(q));
        }
      } else {
        results = getFallbackResults(searchParams);
      }
    } catch {
      setUseApi(false);
      results = getFallbackResults(searchParams);
    } finally {
      setLoading(false);
    }
    const ranked = rankProviders(results, searchParams);
    navigate('/patient-search-and-booking/results', {
      state: { providers: ranked, searchParams, userLocation, _fromSearch: true }
    });
  };

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider);
  };

  const handleCloseModal = () => {
    setSelectedProvider(null);
  };

  const handleBookAppointment = (data) => {
    setBookingData(data); // Store the selected date, time, and provider
    setSelectedProvider(null);
    setShowBookingPanel(true);
  };

  const handleIntakeSubmit = async (intakeData) => {
    // Close modal (care_request was created and updated by the intake API)
    setShowBookingPanel(false);

    // Refresh bookings after a short delay to allow the backend to create the pending booking
    setTimeout(async () => {
      try {
        const headers = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/bookings", { headers });
        const data = await res.json();

        if (res.ok && data.bookings) {
          const recent = data.bookings.slice(0, 3).map(booking => ({
            id: booking.id,
            providerName: booking.provider?.name || "Provider",
            providerImage: booking.provider?.photo_url || "https://img.rocket.new/generatedImages/rocket_gen_img_1787f0ff5-1764790614873.png",
            providerImageAlt: `${booking.provider?.name || "Provider"} - ${booking.provider?.role || "Healthcare provider"}`,
            serviceType: booking.service.replace(/_/g, " "),
            requestedDate: new Date(booking.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            requestedTime: new Date(booking.scheduled_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            status: booking.status === "confirmed" ? "accepted" : booking.status
          }));
          setRecentRequests(recent);

          // Refresh notifications
          const generatedNotifications = generateNotifications(data.bookings);
          setNotifications(generatedNotifications);
        }
      } catch (error) {
        console.error('Failed to refresh bookings:', error);
      }
    }, 2000); // 2 second delay to allow backend processing
  };

  const handleViewAlternatives = (requestId) => {
    console.log('View alternatives for request:', requestId);
  };

  const matchesSpecialist = (provider, specialistLabel) => {
    if (!specialistLabel) return true;
    const s = specialistLabel.toLowerCase();
    const specialty = (provider?.specialty || '').toLowerCase();
    const credentials = Array.isArray(provider?.credentials) ? provider.credentials : [];
    const credsStr = credentials.join(' ').toLowerCase();
    return specialty.includes(s) || credsStr.includes(s) || s.includes(specialty);
  };

  const displayProviders = selectedSpecialist
    ? (filteredProviders || []).filter((p) => matchesSpecialist(p, selectedSpecialist))
    : (filteredProviders || []);
  const displayCount = hasSearched
    ? (selectedSpecialist || usedNameFilter || totalProviderCount == null ? (displayProviders?.length ?? 0) : totalProviderCount)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="main-content-pt w-full min-w-0">
        <SearchBar onSearch={handleSearch} />

        <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="w-full min-w-0 max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-6 relative" ref={filterRef}>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                {loading ? 'Loading…' : hasSearched ? `${displayCount} Provider${displayCount !== 1 ? 's' : ''} found` : 'Providers near you'}
              </h2>
              <div className="flex items-center gap-2">
                {((hasSearched ? displayProviders : providersData)?.length ?? 0) > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const el = providersScrollRef.current;
                        if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                      }}
                      className="w-9 h-9 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-foreground hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      aria-label="Scroll providers left"
                    >
                      <Icon name="ChevronLeft" size={18} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = providersScrollRef.current;
                        if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                      }}
                      className="w-9 h-9 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-foreground hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      aria-label="Scroll providers right"
                    >
                      <Icon name="ChevronRight" size={18} strokeWidth={2} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  id="patient-filter-by-specialist-btn"
                  aria-expanded={filterPanelOpen}
                  aria-haspopup="listbox"
                  onClick={() => setFilterPanelOpen((o) => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm md:text-base transition-colors duration-250 ${filterPanelOpen ? 'bg-stone-100 text-primary' : 'text-foreground hover:text-primary'}`}
                >
                  <Icon name="SlidersHorizontal" size={20} strokeWidth={2} />
                  <span className="hidden sm:inline">Filters</span>
                  {selectedSpecialist && <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">1</span>}
                </button>
              </div>

              {filterPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-full max-w-sm bg-white rounded-xl shadow-lg border-2 border-primary/30 z-[200] overflow-hidden" role="listbox" aria-label="Filter by specialist">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <h3 className="font-semibold text-foreground">Filter by specialist</h3>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto py-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedSpecialist(null); setFilterPanelOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm ${!selectedSpecialist ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-stone-50'}`}
                    >
                      All specialists
                    </button>
                    {SPECIALIST_OPTIONS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => { setSelectedSpecialist(selectedSpecialist === label ? null : label); setFilterPanelOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${selectedSpecialist === label ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-stone-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              ref={providersScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 smooth-scroll"
              style={{ scrollBehavior: 'smooth' }}
            >
              {(hasSearched ? displayProviders : providersData)?.map((provider) => (
                <ProviderCard
                  key={provider?.id}
                  provider={provider}
                  onClick={handleProviderClick}
                />
              ))}
            </div>
            
            {hasSearched && displayProviders?.length === 0 &&
            <div className="text-center py-12">
                <Icon name="SearchX" size={48} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No providers found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria to find more results.</p>
              </div>
            }
          </div>
        </div>

        {showBookingPanel &&
        <BookingPanel
          bookingData={bookingData}
          onSubmit={handleIntakeSubmit}
        />
        }

        <RequestStatus
          requests={recentRequests}
          onViewAlternatives={handleViewAlternatives} />
        

        <NotificationsList notifications={notifications} />
      </main>
      {selectedProvider &&
      <ProviderModal
        provider={selectedProvider}
        onClose={handleCloseModal}
        onBook={handleBookAppointment} />

      }
    </div>);

};

export default PatientSearchAndBooking;