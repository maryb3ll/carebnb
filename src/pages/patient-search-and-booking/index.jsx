import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import SearchBar from './components/SearchBar';
import ProviderCard from './components/ProviderCard';
import ProviderModal from './components/ProviderModal';
import BookingPanel from './components/BookingPanel';
import RequestStatus from './components/RequestStatus';
import NotificationsList from './components/NotificationsList';
import Icon from '../../components/AppIcon';
import { providersData } from '../../data/providers';

const PatientSearchAndBooking = () => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

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


  const handleSearch = (searchParams) => {
    console.log('Search params:', searchParams);

    // Filter providers based on search criteria
    let results = [...providersData];

    // Filter by location (where) - simple distance-based filtering
    if (searchParams?.where?.trim()) {
      // In a real app, this would use geolocation API
      // For now, we'll filter by distance if location is provided
      results = results?.filter((provider) => provider?.distance <= 5);
    }

    // Filter by time (check if provider is available)
    if (searchParams?.time) {
      const requestedDate = new Date(searchParams.time);
      const today = new Date();

      // Filter based on availability
      results = results?.filter((provider) => {
        if (requestedDate?.toDateString() === today?.toDateString()) {
          return provider?.available === true;
        }
        return true; // Future dates might have availability
      });
    }

    // Filter by care type (match against specialty)
    if (searchParams?.careType) {
      const careTypeMap = {
        'common': ['Nurse', 'Primary Care', 'Registered Nurse'],
        'clinical': ['IV Therapy', 'Nurse Practitioner', 'Licensed Practical Nurse'],
        'post-hospital': ['Nurse Practitioner', 'Registered Nurse', 'Primary Care'],
        'support': ['Physical Therapist', 'Lactation Consultant', 'Palliative Care']
      };

      const keywords = careTypeMap?.[searchParams?.careType] || [];
      results = results?.filter((provider) =>
      keywords?.some((keyword) =>
      provider?.specialty?.toLowerCase()?.includes(keyword?.toLowerCase())
      )
      );
    }

    // Filter by provider name
    if (searchParams?.name?.trim()) {
      const searchName = searchParams?.name?.toLowerCase();
      results = results?.filter((provider) =>
      provider?.name?.toLowerCase()?.includes(searchName)
      );
    }

    setFilteredProviders(results);
    setHasSearched(true);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <SearchBar onSearch={handleSearch} />

        <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                {hasSearched ? `${filteredProviders?.length} Provider${filteredProviders?.length !== 1 ? 's' : ''} found` : 'Providers near you'}
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 text-sm md:text-base text-foreground hover:text-primary transition-colors duration-250">
                <Icon name="SlidersHorizontal" size={20} strokeWidth={2} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 smooth-scroll">
              {(hasSearched ? filteredProviders : providersData)?.map((provider) =>
              <ProviderCard
                key={provider?.id}
                provider={provider}
                onClick={handleProviderClick} />

              )}
            </div>
            
            {hasSearched && filteredProviders?.length === 0 &&
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