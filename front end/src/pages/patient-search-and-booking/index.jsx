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
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [totalProviderCount, setTotalProviderCount] = useState(null);
  const [usedNameFilter, setUsedNameFilter] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [useApi, setUseApi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 37.44, lng: -122.17 });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
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

  const mockRequests = [
  {
    id: 1,
    providerName: "Dr. Sarah Mitchell",
    providerImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1787f0ff5-1764790614873.png",
    providerImageAlt: "Professional female nurse with warm smile wearing navy blue scrubs and stethoscope in modern medical facility",
    serviceType: "Post-surgery wound care",
    requestedDate: "Feb 15, 2026",
    requestedTime: "3:00 PM",
    status: "accepted"
  },
  {
    id: 2,
    providerName: "Michael Chen",
    providerImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1b1c04106-1763296347849.png",
    providerImageAlt: "Asian male nurse in white medical coat with professional demeanor standing in hospital corridor with medical equipment visible",
    serviceType: "IV therapy administration",
    requestedDate: "Feb 16, 2026",
    requestedTime: "10:00 AM",
    status: "pending"
  },
  {
    id: 3,
    providerName: "James Thompson",
    providerImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1adc98132-1763295638675.png",
    providerImageAlt: "African American male physical therapist in black athletic wear demonstrating exercise technique with professional equipment in modern therapy room",
    serviceType: "Physical therapy session",
    requestedDate: "Feb 14, 2026",
    requestedTime: "2:00 PM",
    status: "declined"
  }];


  const mockNotifications = [
  {
    id: 1,
    type: "confirmation",
    title: "Appointment Confirmed",
    message: "Your appointment with Dr. Sarah Mitchell for post-surgery wound care on Feb 15, 2026 at 3:00 PM has been confirmed.",
    timestamp: new Date(Date.now() - 1800000),
    read: false
  },
  {
    id: 2,
    type: "reminder",
    title: "Upcoming Appointment Reminder",
    message: "You have an appointment with Dr. Sarah Mitchell tomorrow at 3:00 PM. Please ensure someone is home to receive the provider.",
    timestamp: new Date(Date.now() - 3600000),
    read: false
  },
  {
    id: 3,
    type: "update",
    title: "Request Status Update",
    message: "Michael Chen is reviewing your request for IV therapy administration. You'll be notified once they respond.",
    timestamp: new Date(Date.now() - 7200000),
    read: true
  },
  {
    id: 4,
    type: "update",
    title: "Alternative Providers Available",
    message: "James Thompson declined your request, but we've found 3 similar providers in your area who are available.",
    timestamp: new Date(Date.now() - 10800000),
    read: true
  }];


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

  const handleBookAppointment = (bookingData) => {
    console.log('Booking data:', bookingData);
    setSelectedProvider(null);
    setShowBookingPanel(true);
  };

  const handleIntakeSubmit = (intakeData) => {
    console.log('Intake data:', intakeData);
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
        <BookingPanel onSubmit={handleIntakeSubmit} />
        }

        <RequestStatus
          requests={mockRequests}
          onViewAlternatives={handleViewAlternatives} />
        

        <NotificationsList notifications={mockNotifications} />
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