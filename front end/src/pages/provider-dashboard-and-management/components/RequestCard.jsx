import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const RequestCard = ({ request, onAccept, onDecline }) => {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const declineReasons = [
    { value: 'schedule_conflict', label: 'Schedule conflict' },
    { value: 'outside_area', label: 'Outside service area' },
    { value: 'not_qualified', label: 'Not qualified for this service' },
    { value: 'capacity_full', label: 'At capacity' },
    { value: 'other', label: 'Other reason' }
  ];

  const handleDeclineSubmit = () => {
    if (declineReason) {
      onDecline(request?.id, declineReason);
      setShowDeclineModal(false);
      setDeclineReason('');
    }
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

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
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                iconName={isPlayingAudio ? "Pause" : "Play"}
                iconPosition="left"
                onClick={handlePlayAudio}
              >
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                iconName="FileText"
                iconPosition="left"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? 'Hide' : 'View'} Transcript
              </Button>
            </div>
          )}

          {showTranscript && request?.transcript && (
            <div className="bg-muted rounded-xl p-4 text-sm text-foreground">
              <p className="font-medium mb-2">Patient Intake Transcript:</p>
              <p className="text-muted-foreground leading-relaxed">{request?.transcript}</p>
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
                disabled={!declineReason}
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