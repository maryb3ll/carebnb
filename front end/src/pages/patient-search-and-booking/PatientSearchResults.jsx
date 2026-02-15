import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProviderCard from './components/ProviderCard';
import ProviderModal from './components/ProviderModal';
import BookingPanel from './components/BookingPanel';
import Icon from '../../components/AppIcon';
import { createBooking } from '../../api/carebnb';
import { supabase } from '../../lib/supabase';

const CARE_TYPE_LABELS = {
  'cold-flu': 'Cold/Flu Care',
  'fever-check': 'Fever Check',
  'infection-monitoring': 'Infection Monitoring',
  'medication-help': 'Medication Help',
  'general-nurse': 'General Nurse Visit',
  'blood-draw': 'Blood Draw',
  'iv-therapy': 'IV Therapy',
  'injection': 'Injection Administration',
  'chemo': 'Chemo Administration',
  'wound-care': 'Wound Care',
  'post-surgery': 'Post-Surgery Check',
  'chronic-condition': 'Chronic Condition Monitoring',
  'medication-management': 'Medication Management',
  'vital-signs': 'Vital Signs Monitoring',
  'physical-therapy': 'Physical Therapy',
  'lactation': 'Lactation Consultant',
  'elder-support': 'Elder Support',
  'palliative': 'Palliative Care'
};

function formatSearchDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const PatientSearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { providers = [], searchParams = {}, userLocation } = state;

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  function buildWhen(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return `${dateStr}T12:00:00`;
    let h = parseInt(match[1], 10);
    const m = match[2];
    if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return `${dateStr}T${String(h).padStart(2, '0')}:${m}:00`;
  }

  if (!location.state || state.providers === undefined) {
    navigate('/patient-search-and-booking', { replace: true });
    return null;
  }

  const handleProviderClick = (provider) => setSelectedProvider(provider);
  const handleCloseModal = () => setSelectedProvider(null);
  const handleBookAppointment = (bookingData) => {
    const { provider, date, time } = bookingData || {};
    if (!provider?.id || !date || !time) return;
    const when = buildWhen(date, time);
    if (!when) return;
    setPendingBooking({ providerId: provider.id, service: 'nursing', when });
    setSelectedProvider(null);
    setBookingError(null);
    setBookingSuccess(false);
    setShowBookingPanel(true);
  };
  const handleIntakeSubmit = async (intakeData) => {
    if (!pendingBooking) return;
    setBookingError(null);
    try {
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const keywords = intakeData?.keywords;
      await createBooking(
        {
          providerId: pendingBooking.providerId,
          service: pendingBooking.service,
          when: pendingBooking.when,
          intake_keywords: Array.isArray(keywords) ? keywords : (keywords != null ? [String(keywords)] : undefined),
          intake_transcript: intakeData?.transcript != null ? String(intakeData.transcript) : undefined,
          intake_session_id: intakeData?.sessionId != null ? String(intakeData.sessionId) : undefined,
        },
        session?.access_token
      );
      setBookingSuccess(true);
      setPendingBooking(null);
      setShowBookingPanel(false);
    } catch (err) {
      setBookingError(err?.message || 'Failed to submit booking');
    }
  };

  const careTypeLabel = searchParams?.careType ? (CARE_TYPE_LABELS[searchParams.careType] || searchParams.careType.replace(/-/g, ' ')) : null;
  const dateLabel = searchParams?.date ? formatSearchDate(searchParams.date) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="main-content-pt w-full min-w-0">
        <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="w-full min-w-0 max-w-[1440px] mx-auto">
            <button
              type="button"
              onClick={() => navigate('/patient-search-and-booking')}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <Icon name="ArrowLeft" size={18} strokeWidth={2} />
              Back to search
            </button>

            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                Care matches for you
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-xl">
                Sorted by relevance to your needs — care type, distance, and availability.
              </p>

              <div className="mt-6 rounded-2xl border border-stone-200 bg-white/60 backdrop-blur-sm px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
                {(searchParams?.where || dateLabel || careTypeLabel) ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="text-sm text-muted-foreground">Your search</span>
                      {searchParams?.where && (
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <Icon name="MapPin" size={14} className="text-muted-foreground shrink-0" />
                          <span className="font-medium">{searchParams.where}</span>
                        </span>
                      )}
                      {dateLabel && (
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <Icon name="Calendar" size={14} className="text-muted-foreground shrink-0" />
                          <span className="font-medium">{dateLabel}</span>
                        </span>
                      )}
                      {careTypeLabel && (
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <Icon name="Stethoscope" size={14} className="text-muted-foreground shrink-0" />
                          <span className="font-medium">{careTypeLabel}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-3 pt-3 border-t border-stone-100 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{providers.length}</span>
                      {' '}provider{providers.length !== 1 ? 's' : ''} matching your criteria — shown best match first
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{providers.length}</span>
                    {' '}provider{providers.length !== 1 ? 's' : ''} found — shown best match first
                  </p>
                )}
              </div>
            </header>

            {providers.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="SearchX" size={48} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No providers found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search criteria.</p>
                <button
                  type="button"
                  onClick={() => navigate('/patient-search-and-booking')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
                >
                  <Icon name="ArrowLeft" size={18} />
                  Back to search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {providers.map((provider, index) => (
                  <div key={provider?.id || index} className="relative min-w-0">
                    {index < 3 && (
                      <span
                        className="absolute -top-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                    )}
                    <ProviderCard
                      provider={provider}
                      onClick={handleProviderClick}
                      fluid
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showBookingPanel && (
          <BookingPanel
            pendingBooking={pendingBooking}
            onSubmit={handleIntakeSubmit}
            onClose={() => { setShowBookingPanel(false); setPendingBooking(null); setBookingError(null); }}
            bookingError={bookingError}
            bookingSuccess={bookingSuccess}
          />
        )}
      </main>

      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          onClose={handleCloseModal}
          onBook={handleBookAppointment}
        />
      )}
    </div>
  );
};

export default PatientSearchResults;
