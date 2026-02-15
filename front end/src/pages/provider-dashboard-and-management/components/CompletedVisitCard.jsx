import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CompletedVisitCard = ({ visit }) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSaveNotes = () => {
    console.log('Notes saved:', notes);
    setShowNotesModal(false);
    setNotes('');
  };

  const handleRequestFollowUp = () => {
    console.log('Follow-up requested for:', followUpDate);
    setShowFollowUpModal(false);
    setFollowUpDate('');
  };

  const handleSendInstructions = () => {
    console.log('Instructions sent:', instructions);
    setShowInstructionsModal(false);
    setInstructions('');
  };

  return (
    <>
      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-organic">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={visit?.patientImage} 
                alt={visit?.patientImageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{visit?.patientName}</h3>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Icon name="Stethoscope" size={16} color="var(--color-muted-foreground)" />
                  <span>{visit?.service}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Calendar" size={16} color="var(--color-muted-foreground)" />
                  <span>{visit?.completedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10">
              <Icon name="CheckCircle" size={16} color="var(--color-success)" />
              <span className="text-sm font-medium text-success">Completed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm"
              iconName="FileText"
              iconPosition="left"
              onClick={() => setShowNotesModal(true)}
              className="flex-1"
            >
              Add Notes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              iconName="Calendar"
              iconPosition="left"
              onClick={() => setShowFollowUpModal(true)}
              className="flex-1"
            >
              Request Follow-up
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              iconName="Send"
              iconPosition="left"
              onClick={() => setShowInstructionsModal(true)}
              className="flex-1"
            >
              Send Instructions
            </Button>
          </div>
        </div>
      </div>
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-organic-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">Add Visit Notes</h3>
              <button 
                onClick={() => setShowNotesModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Clinical Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e?.target?.value)}
                placeholder="Enter visit notes, observations, and recommendations..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowNotesModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleSaveNotes}
                disabled={!notes?.trim()}
                className="flex-1"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-md w-full shadow-organic-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">Request Follow-up</h3>
              <button 
                onClick={() => setShowFollowUpModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <Input
              type="datetime-local"
              label="Preferred Follow-up Date & Time"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e?.target?.value)}
              required
              className="mb-6"
            />

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowFollowUpModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleRequestFollowUp}
                disabled={!followUpDate}
                className="flex-1"
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-organic-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">Send Care Instructions</h3>
              <button 
                onClick={() => setShowInstructionsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-base"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Post-Visit Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e?.target?.value)}
                placeholder="Enter care instructions, medication reminders, or follow-up actions..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleSendInstructions}
                disabled={!instructions?.trim()}
                className="flex-1"
              >
                Send Instructions
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompletedVisitCard;