import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import StatCard from './components/StatCard';
import VisitCard from './components/VisitCard';
import RequestCard from './components/RequestCard';
import MiniCalendar from './components/MiniCalendar';
import CompletedVisitCard from './components/CompletedVisitCard';
import AvailabilityEditor from './components/AvailabilityEditor';

const ProviderDashboardAndManagement = () => {
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [providerId, setProviderId] = useState(null);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [todaysVisits, setTodaysVisits] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      try {
        const headers = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        }
        const response = await fetch('/api/me', { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.providerId) {
            setProviderId(data.providerId);
          } else {
            // Fallback: fetch first provider for demo/testing purposes
            console.log('No logged-in provider, using demo provider for testing');
            const providersResponse = await fetch('/api/providers/match?service=nursing&lat=37.77&lng=-122.42&radius=50&limit=1');
            if (providersResponse.ok) {
              const providersData = await providersResponse.json();
              if (providersData.providers && providersData.providers.length > 0) {
                setProviderId(providersData.providers[0].id);
                console.log('Using demo provider ID:', providersData.providers[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching provider ID:', error);
      }
    };

    fetchProviderId();
  }, []);

  // Fetch upcoming bookings count from database
  const fetchUpcomingBookings = async () => {
    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch('/api/bookings?for=provider', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('All bookings for provider:', data.bookings);
        // Count only confirmed bookings (pending requests are shown in "Pending Requests" section)
        const upcoming = (data.bookings || []).filter(b =>
          b.status === 'confirmed'
        );
        console.log('Confirmed bookings:', upcoming);
        setUpcomingBookingsCount(upcoming.length);
        console.log('Upcoming bookings count (confirmed only):', upcoming.length);
      }
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    }
  };

  // Fetch upcoming bookings on mount and when provider changes
  useEffect(() => {
    fetchUpcomingBookings();
  }, [providerId]);

  // Fetch today's visits from database
  const fetchTodaysVisits = async () => {
    if (!providerId) return;

    try {
      setLoadingVisits(true);
      const today = new Date().toISOString().split('T')[0];
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`/api/bookings?for=provider&date=${today}`, { headers });
      if (response.ok) {
        const data = await response.json();

        const visits = (data.bookings || [])
          .filter(b => b.status === 'confirmed')
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .map(b => ({
            id: b.id,
            patientName: b.patient_name, // Now comes from API with fallback
            service: (b.service || '').replace(/_/g, ' '),
            time: new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            distance: "Location available",
            address: b.address_notes || "Address provided in booking"
          }));

        setTodaysVisits(visits);
      }
    } catch (error) {
      console.error('Error fetching today\'s visits:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchTodaysVisits();

    // Auto-refresh every 30 seconds to catch cancellations
    const interval = setInterval(fetchTodaysVisits, 30000);

    // Refresh when window regains focus
    const handleFocus = () => fetchTodaysVisits();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [providerId]);

  // Fetch booked dates for calendar
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!providerId) return;

      try {
        setLoadingCalendar(true);
        const headers = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        }

        const response = await fetch('/api/bookings?for=provider', { headers });
        if (response.ok) {
          const data = await response.json();

          // Extract unique dates from confirmed/pending bookings
          const uniqueDates = [...new Set(
            (data.bookings || [])
              .filter(b => b.status === 'confirmed' || b.status === 'pending')
              .map(b => new Date(b.scheduled_at).toISOString().split('T')[0])
          )];

          // Add T12:00:00 to avoid timezone shifting
          const dates = uniqueDates.map(dateStr => ({ date: new Date(dateStr + 'T12:00:00') }));
          setBookedSlots(dates);
        }
      } catch (error) {
        console.error('Error fetching booked dates:', error);
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchBookedDates();
  }, [providerId]);

  // Fetch blocked dates from provider availability
  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (!providerId) return;

      try {
        const response = await fetch(`/api/providers/${providerId}/availability`);
        if (response.ok) {
          const data = await response.json();

          // Extract blocked dates from one_time entries
          // Add T12:00:00 to avoid timezone shifting
          const blocked = (data.one_time || [])
            .filter(entry => entry.availability_type === 'one_time_blocked')
            .map(entry => ({ date: new Date(entry.specific_date + 'T12:00:00') }));

          setBlockedSlots(blocked);
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };

    fetchBlockedDates();
  }, [providerId]);

  // Fetch real care_requests from the database
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoadingRequests(true);
        // Use provider's location (default to Palo Alto)
        const response = await fetch('/api/requests/match?service=nursing&lat=37.44&lng=-122.17&radius=50&limit=20');

        if (response.ok) {
          const data = await response.json();

          // Transform API data to match component structure
          const transformedRequests = (data.requests || []).map(req => ({
            id: req.id,
            patientName: "Patient", // We don't have patient name from API
            patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_175ea645a-1763293958593.png",
            patientImageAlt: "Patient requesting care",
            service: req.service,
            requestedTime: new Date(req.requestedStart).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }),
            requestedStart: req.requestedStart, // Keep raw ISO timestamp for API calls
            location: "Location available upon acceptance",
            hasAudioIntake: !!req.pdfUrl || !!req.audioUrl || !!req.transcript,
            pdfUrl: req.pdfUrl,
            audioUrl: req.audioUrl,
            transcript: req.transcript || req.description || "No description provided",
            intakeType: req.intakeType,
            description: req.description,
            referralSuggestions: []
          }));

          setPendingRequests(transformedRequests);
        }
      } catch (error) {
        console.error('Error fetching care requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, []);

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

  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false);

  const handleViewDetails = (visit) => {
    console.log('Viewing details for:', visit);
  };

  const handleAcceptRequest = async (requestId) => {
    console.log('Accepting request:', requestId);

    // Find the request details
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    if (!providerId) {
      alert('Provider ID not available. Please refresh the page.');
      return;
    }

    try {
      // Get authorization headers
      const headers = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      // Find existing pending booking for this care request
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('care_request_id', requestId)
        .eq('provider_id', providerId)
        .eq('status', 'pending')
        .limit(1);

      let bookingId = existingBookings?.[0]?.id;

      // If no existing booking, create one
      if (!bookingId) {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            providerId: providerId,
            careRequestId: requestId,
            service: request.service,
            when: request.requestedStart,
            skipAvailabilityCheck: true, // Provider is explicitly accepting
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to create booking:', error);
          alert('Failed to accept request. Please try again.');
          return;
        }

        const data = await response.json();
        bookingId = data.booking?.id;
        console.log('Booking created:', bookingId);
      }

      // Update booking to confirmed status
      if (bookingId) {
        const confirmResponse = await fetch(`/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'confirmed',
          }),
        });

        if (confirmResponse.ok) {
          console.log('Booking confirmed');
        } else {
          console.error('Failed to confirm booking');
        }
      }

      // Remove from pending requests
      setPendingRequests((prev) => prev?.filter((req) => req?.id !== requestId));

      // Refresh upcoming bookings count from database
      await fetchUpcomingBookings();

      // Refresh today's visits if the accepted booking is for today
      const bookingDate = new Date(request.requestedStart).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (bookingDate === today) {
        console.log('Accepted booking is for today - refreshing Today\'s Visits');
        await fetchTodaysVisits();
      }

    } catch (error) {
      console.error('Error accepting request:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId, reason) => {
    console.log('=== DECLINING REQUEST ===');
    console.log('Request ID (care_request_id):', requestId);
    console.log('Decline reason:', reason);

    // Find the request details
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) {
      console.error('Request not found in pendingRequests:', requestId);
      return;
    }
    console.log('Found request:', request);

    if (!providerId) {
      alert('Provider ID not available. Please refresh the page.');
      return;
    }

    try {
      // Get authorization headers
      const headers = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      // Find existing pending booking for this care request
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('care_request_id', requestId)
        .eq('provider_id', providerId)
        .eq('status', 'pending')
        .limit(1);

      let bookingId = existingBookings?.[0]?.id;

      // If no existing booking, create one
      if (!bookingId) {
        const createResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            providerId: providerId,
            careRequestId: requestId,
            service: request.service,
            when: request.requestedStart,
            skipAvailabilityCheck: true, // Provider is explicitly declining
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          console.error('Failed to create booking for decline:', error);
          alert('Failed to decline request. Please try again.');
          return;
        } else {
          const data = await createResponse.json();
          bookingId = data.booking?.id;
        }
      }

      // Update booking to declined status with reason
      if (!bookingId) {
        console.error('No booking ID available for decline');
        alert('Failed to decline request. Please try again.');
        return;
      }

      console.log('Sending PATCH to decline booking:', bookingId);
      const declineResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'declined',
          decline_reason: reason,
        }),
      });
      console.log('Decline PATCH response status:', declineResponse.status);

      if (!declineResponse.ok) {
        const error = await declineResponse.json();
        console.error('Failed to decline booking:', error);
        alert('Failed to decline request. Please try again.');
        return;
      }

      console.log('Successfully declined booking with reason:', reason);

      // Also update the care_request status directly to ensure it's set to "closed"
      // (using 'closed' instead of 'declined' because the DB constraint only allows: open, matched, closed)
      // This handles edge cases where the backend update might fail
      console.log('Updating care_request status to closed for request:', requestId);
      const { data: updatedCareRequest, error: careRequestError } = await supabase
        .from('care_requests')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('id, status');

      if (careRequestError) {
        console.error('Failed to update care_request status:', careRequestError);
        // Don't return - we still want to remove from UI even if this fails
      } else {
        console.log('✓ Successfully updated care_request to declined:', updatedCareRequest);
      }

      // Double-check: if care_request is still 'open', try again
      const { data: verifyRequest } = await supabase
        .from('care_requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (verifyRequest?.status === 'open') {
        console.warn('⚠️ Care request still open after decline, forcing update...');
        await supabase
          .from('care_requests')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('id', requestId);
      }

      // Remove from pending requests only after successful decline
      setPendingRequests((prev) => prev?.filter((req) => req?.id !== requestId));

      // Also re-fetch pending requests to ensure it's cleared from the server
      console.log('Re-fetching pending requests to verify decline...');
      setTimeout(async () => {
        try {
          const response = await fetch('/api/requests/match?service=nursing&lat=37.44&lng=-122.17&radius=50&limit=20');
          if (response.ok) {
            const data = await response.json();
            const transformedRequests = (data.requests || []).map(req => ({
              id: req.id,
              patientName: "Patient",
              patientImage: "https://img.rocket.new/generatedImages/rocket_gen_img_175ea645a-1763293958593.png",
              patientImageAlt: "Patient requesting care",
              service: req.service,
              requestedTime: new Date(req.requestedStart).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }),
              requestedStart: req.requestedStart,
              location: "Location available upon acceptance",
              hasAudioIntake: !!req.pdfUrl || !!req.audioUrl || !!req.transcript,
              pdfUrl: req.pdfUrl,
              audioUrl: req.audioUrl,
              transcript: req.transcript || req.description || "No description provided",
              intakeType: req.intakeType,
              description: req.description,
              referralSuggestions: []
            }));
            setPendingRequests(transformedRequests);
            console.log('Pending requests refreshed. Count:', transformedRequests.length);
          }
        } catch (error) {
          console.error('Error refreshing pending requests:', error);
        }
      }, 1000); // Wait 1 second for database to update

    } catch (error) {
      console.error('Error declining request:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEditAvailability = () => {
    setShowAvailabilityEditor(true);
  };

  const handleAvailabilityEditorClose = () => {
    setShowAvailabilityEditor(false);

    // Refresh calendar data after changes
    const fetchBookedDates = async () => {
      if (!providerId) return;

      try {
        const headers = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        }

        const response = await fetch('/api/bookings?for=provider', { headers });
        if (response.ok) {
          const data = await response.json();
          const uniqueDates = [...new Set(
            (data.bookings || [])
              .filter(b => b.status === 'confirmed' || b.status === 'pending')
              .map(b => new Date(b.scheduled_at).toISOString().split('T')[0])
          )];
          const dates = uniqueDates.map(dateStr => ({ date: new Date(dateStr + 'T12:00:00') }));
          setBookedSlots(dates);
        }
      } catch (error) {
        console.error('Error refreshing booked dates:', error);
      }
    };

    const fetchBlockedDates = async () => {
      if (!providerId) return;

      try {
        const response = await fetch(`/api/providers/${providerId}/availability`);
        if (response.ok) {
          const data = await response.json();
          const blocked = (data.one_time || [])
            .filter(entry => entry.availability_type === 'one_time_blocked')
            .map(entry => ({ date: new Date(entry.specific_date + 'T12:00:00') }));
          setBlockedSlots(blocked);
        }
      } catch (error) {
        console.error('Error refreshing blocked dates:', error);
      }
    };

    fetchBookedDates();
    fetchBlockedDates();
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
                  count={upcomingBookingsCount}
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
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">
                Pending Requests
              </h2>
              <div className="space-y-4">
                {pendingRequests?.length > 0 ?
                pendingRequests?.map((request) =>
                <RequestCard
                  key={request?.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest} />

                ) :

                <div className="bg-card rounded-2xl p-8 md:p-12 text-center shadow-organic">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground">No pending requests at the moment</p>
                  </div>
                }
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
                  blockedSlots={blockedSlots}
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

      {/* Availability Editor Modal */}
      {showAvailabilityEditor && (
        <AvailabilityEditor
          providerId={providerId}
          onClose={handleAvailabilityEditorClose}
        />
      )}
    </>);

};

export default ProviderDashboardAndManagement;