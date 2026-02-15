import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const RequestCard = ({ request, onAccept, onDecline }) => {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioElement] = useState(new Audio());

  const declineReasons = [
    { value: 'schedule_conflict', label: 'Schedule conflict' },
    { value: 'outside_area', label: 'Outside service area' },
    { value: 'not_qualified', label: 'Not qualified for this service' },
    { value: 'capacity_full', label: 'At capacity' },
    { value: 'other', label: 'Other reason' }
  ];

  const handleDeclineSubmit = () => {
    if (declineReason) {
      // Use custom reason if "other" is selected, otherwise use the formatted label
      let finalReason;
      if (declineReason === 'other') {
        finalReason = customReason;
      } else {
        const selectedOption = declineReasons.find(r => r.value === declineReason);
        finalReason = selectedOption?.label || declineReason;
      }
      onDecline(request?.id, finalReason);
      setShowDeclineModal(false);
      setDeclineReason('');
      setCustomReason('');
    }
  };

  const handlePlayAudio = () => {
    if (!request?.audioUrl) {
      return; // No audio to play
    }

    if (isPlayingAudio) {
      // Stop audio
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlayingAudio(false);
    } else {
      // Play audio
      audioElement.src = request.audioUrl;
      audioElement.play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          alert('Failed to play audio');
        });

      // Listen for audio end
      audioElement.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      audioElement.pause();
      audioElement.src = '';
    };
  }, []);

  return (
    <>
      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-organic hover:shadow-organic-md transition-base">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={request?.patientImage} 
                alt={request?.patientImageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{request?.patientName}</h3>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon name="Stethoscope" size={16} color="var(--color-muted-foreground)" />
                  <span>{request?.service}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Calendar" size={16} color="var(--color-muted-foreground)" />
                  <span>{request?.requestedTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon name="MapPin" size={16} color="var(--color-muted-foreground)" />
                <span>{request?.location}</span>
              </div>
            </div>
          </div>

          {request?.hasAudioIntake && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName={isPlayingAudio ? "Pause" : "Play"}
                  iconPosition="left"
                  onClick={handlePlayAudio}
                  disabled={!request?.audioUrl}
                >
                  {isPlayingAudio ? 'Playing...' : 'Play Audio'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="FileText"
                  iconPosition="left"
                  onClick={() => setShowTranscript(true)}
                >
                  View Transcript
                </Button>
                {request?.pdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Download"
                    iconPosition="left"
                    onClick={() => window.open(request.pdfUrl, '_blank')}
                  >
                    Download PDFs
                  </Button>
                )}
              </div>
              {!request?.audioUrl && (
                <p className="text-xs text-muted-foreground">No audio available</p>
              )}
            </div>
          )}


          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2">
            <Button 
              variant="default" 
              size="default"
              iconName="Check"
              iconPosition="left"
              onClick={() => onAccept(request?.id)}
              className="flex-1"
            >
              Accept Request
            </Button>
            <Button 
              variant="outline" 
              size="default"
              iconName="X"
              iconPosition="left"
              onClick={() => setShowDeclineModal(true)}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-organic-xl">
            <div className="flex items-center justify-between p-6 border-b border-muted">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                {request?.intakeType === 'audio' ? 'Audio Transcript' : 'Patient Message'}
              </h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {request?.transcript || 'No transcript available'}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-muted">
              <Button
                variant="default"
                onClick={() => setShowTranscript(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-md w-full shadow-organic-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">Decline Request</h3>
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <Select
              label="Reason for declining"
              options={declineReasons}
              value={declineReason}
              onChange={setDeclineReason}
              placeholder="Select a reason"
              required
              className="mb-6"
            />

            {declineReason === 'other' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Please specify the reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your reason for declining..."
                  className="w-full px-4 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors resize-none flex items-center"
                  style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}
                  rows={3}
                  required
                />
              </div>
            )}

            {request?.referralSuggestions && request?.referralSuggestions?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Suggested Referrals:</p>
                <div className="space-y-2">
                  {request?.referralSuggestions?.map((referral, index) => (
                    <div key={index} className="bg-muted rounded-xl p-3 text-sm">
                      <p className="font-medium text-foreground">{referral?.name}</p>
                      <p className="text-muted-foreground">{referral?.specialty}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeclineModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={!declineReason || (declineReason === 'other' && !customReason.trim())}
                className="flex-1"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestCard;