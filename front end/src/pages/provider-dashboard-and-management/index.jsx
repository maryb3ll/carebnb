import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import StatCard from './components/StatCard';
import VisitCard from './components/VisitCard';
import RequestCard from './components/RequestCard';
import MiniCalendar from './components/MiniCalendar';
import CompletedVisitCard from './components/CompletedVisitCard';
import { getProviderBookings, updateBooking } from '../../api/carebnb';
import { supabase } from '../../lib/supabase';

const ProviderDashboardAndManagement = () => {
  const [todaysVisits] = useState([
  {
    id: 1,
    patientName: "Sarah Johnson",
    patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1fb6cf439-1763299224286.png",
    patientImageAlt: "Professional woman with brown hair wearing white blouse smiling warmly at camera in bright indoor setting",
    service: "Post-surgery check",
    time: "10:00 AM",
    distance: "2.3 miles away",
    address: "456 Oak Street, Apt 3B"
  },
  {
    id: 2,
    patientName: "Michael Chen",
    patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_18f4046e3-1763296247462.png",
    patientImageAlt: "Asian man with short black hair wearing navy blue shirt with friendly expression in natural lighting",
    service: "Blood draw",
    time: "2:30 PM",
    distance: "4.1 miles away",
    address: "789 Pine Avenue"
  },
  {
    id: 3,
    patientName: "Emily Rodriguez",
    patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_11719be22-1763294717708.png",
    patientImageAlt: "Hispanic woman with long dark hair wearing casual gray sweater with warm smile in outdoor setting",
    service: "Medication management",
    time: "4:00 PM",
    distance: "1.8 miles away",
    address: "321 Maple Drive"
  }]
  );

  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);
  const [providerNotLinked, setProviderNotLinked] = useState(false);

  const formatRequestedTime = (scheduledAt) => {
    if (!scheduledAt) return '—';
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) return scheduledAt;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const fetchPendingRequests = useCallback(async () => {
    if (!supabase) {
      setPendingRequestsLoading(false);
      return;
    }
    setPendingRequestsLoading(true);
    setProviderNotLinked(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { bookings: list, providerLinked } = await getProviderBookings(session?.access_token ?? null);
      setProviderNotLinked(providerLinked === false);
      const pending = (list || [])
        .filter((b) => b.status === 'pending')
        .map((b) => {
          const hasTranscript = Boolean(b.intake_transcript && String(b.intake_transcript).trim());
          const hasKeywords = Array.isArray(b.intake_keywords) && b.intake_keywords.length > 0;
          const hasIntake = hasTranscript || hasKeywords;
          return {
            id: b.id,
            patientName: b.patientName || b.patient_name || 'Patient',
            patientImage: null,
            patientImageAlt: '',
            service: b.service || '—',
            requestedTime: formatRequestedTime(b.scheduled_at),
            location: b.patient_phone || 'Address to be confirmed',
            hasAudioIntake: hasIntake,
            hasTranscript,
            transcript: (b.intake_transcript && String(b.intake_transcript).trim()) || null,
            keywords: hasKeywords ? b.intake_keywords : [],
            referralSuggestions: [],
          };
        }));
      setPendingRequests(pending);
    } catch {
      setPendingRequests([]);
    } finally {
      setPendingRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (!supabase) return;
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchPendingRequests(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchPendingRequests, supabase]);

  const [completedVisits] = useState([
  {
    id: 1,
    patientName: "Robert Anderson",
    patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_18900111e-1766772615459.png",
    patientImageAlt: "Senior man with gray hair and beard wearing plaid shirt with gentle smile in home environment",
    service: "Vital signs monitoring",
    completedDate: "Feb 14, 2026 at 9:00 AM"
  },
  {
    id: 2,
    patientName: "Maria Garcia",
    patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_124d3a6d9-1763301454658.png",
    patientImageAlt: "Hispanic woman with long dark wavy hair wearing casual pink top with bright smile in natural daylight",
    service: "Injection administration",
    completedDate: "Feb 13, 2026 at 2:00 PM"
  }]
  );

  const [bookedSlots] = useState([
  { date: new Date(2026, 1, 14) },
  { date: new Date(2026, 1, 15) },
  { date: new Date(2026, 1, 16) },
  { date: new Date(2026, 1, 18) },
  { date: new Date(2026, 1, 20) },
  { date: new Date(2026, 1, 21) },
  { date: new Date(2026, 1, 23) }]
  );

  const handleViewDetails = (visit) => {
    console.log('Viewing details for:', visit);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      await updateBooking(requestId, { status: 'confirmed' }, session?.access_token);
      setPendingRequests((prev) => prev?.filter((req) => req?.id !== requestId) ?? []);
    } catch {
      // keep request in list on error
    }
  };

  const handleDeclineRequest = async (requestId, reason) => {
    try {
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      await updateBooking(requestId, { status: 'cancelled', decline_reason: reason || undefined }, session?.access_token);
      setPendingRequests((prev) => prev?.filter((req) => req?.id !== requestId) ?? []);
    } catch {
      // keep request in list on error
    }
  };

  const handleEditAvailability = () => {
    console.log('Opening availability editor');
  };

  return (
    <>
      <Helmet>
        <title>Provider Dashboard - CareBnb</title>
        <meta name="description" content="Manage your healthcare appointments, review patient requests, and coordinate in-home medical visits through your provider dashboard." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="main-content-pt w-full min-w-0">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-8 lg:py-12">
            
            {/* Dashboard Stats */}
            <div className="mb-8 md:mb-12">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-6 md:mb-8">
                Provider Dashboard
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard
                  icon="Calendar"
                  label="Today's Visits"
                  count={todaysVisits?.length}
                  color="var(--color-primary)" />
                
                <StatCard
                  icon="Clock"
                  label="Pending Requests"
                  count={pendingRequests?.length}
                  color="var(--color-warning)" />
                
                <StatCard
                  icon="CheckCircle"
                  label="Upcoming Bookings"
                  count={7}
                  color="var(--color-success)" />
                
              </div>
            </div>

            {/* Today's Visits */}
            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">
                Today's Visits
              </h2>
              <div className="space-y-4">
                {todaysVisits?.map((visit) =>
                <VisitCard
                  key={visit?.id}
                  visit={visit}
                  onViewDetails={handleViewDetails} />

                )}
              </div>
            </section>

            {/* Pending Requests */}
            <section className="mb-8 md:mb-12">
              <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  Pending Requests
                </h2>
                <button
                  type="button"
                  onClick={() => fetchPendingRequests()}
                  disabled={pendingRequestsLoading}
                  className="px-4 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-foreground hover:bg-stone-50 disabled:opacity-50"
                >
                  {pendingRequestsLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              <div className="space-y-4">
                {providerNotLinked && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-6 text-amber-800">
                    <p className="font-medium">Your provider account isn’t linked.</p>
                    <p className="text-sm mt-1">In Supabase, run the script that links your login (Tasnim@gmail.com) to the provider “Tasnim Beg MD”. See <code className="bg-amber-100/80 px-1 rounded">supabase/seed_provider_tasnim_beg.sql</code>.
                    </p>
                  </div>
                )}
                {pendingRequestsLoading ? (
                  <div className="bg-card rounded-2xl p-8 md:p-12 text-center shadow-organic">
                    <p className="text-muted-foreground">Loading requests…</p>
                  </div>
                ) : pendingRequests?.length > 0 ? (
                pendingRequests?.map((request) =>
                <RequestCard
                  key={request?.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest} />

                ) : (

                <div className="bg-card rounded-2xl p-8 md:p-12 text-center shadow-organic">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground">No pending requests at the moment</p>
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
              {/* Calendar */}
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">
                  Schedule Overview
                </h2>
                <MiniCalendar
                  bookedSlots={bookedSlots}
                  onEditAvailability={handleEditAvailability} />
                
              </div>

              {/* Completed Visits */}
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">
                  Recent Completed Visits
                </h2>
                <div className="space-y-4">
                  {completedVisits?.map((visit) =>
                  <CompletedVisitCard key={visit?.id} visit={visit} />
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>);

};

export default ProviderDashboardAndManagement;