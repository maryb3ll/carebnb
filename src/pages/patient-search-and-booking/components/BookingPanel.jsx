import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BookingPanel = ({ onSubmit }) => {
  const [intakeMethod, setIntakeMethod] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  const handleTextSubmit = () => {
    if (textInput?.trim()) {
      onSubmit({ type: 'text', content: textInput });
      setTextInput('');
    }
  };

  const handleAudioUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setAudioFile(file);
      onSubmit({ type: 'audio', file: file });
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        onSubmit({ type: 'audio', content: 'Recorded audio message' });
      }, 3000);
    }
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-3xl shadow-organic-md p-6 md:p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-xl">
              <Icon name="Sparkles" size={24} color="var(--color-primary)" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                AI-Powered Intake
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Tell us about your medical needs
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIntakeMethod('text')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm md:text-base font-medium transition-all duration-250 ${
                intakeMethod === 'text' ?'border-primary bg-primary/5 text-primary' :'border-border text-foreground hover:border-primary/50'
              }`}
            >
              <Icon name="MessageSquare" size={18} className="inline mr-2" />
              Text Input
            </button>
            <button
              onClick={() => setIntakeMethod('audio')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm md:text-base font-medium transition-all duration-250 ${
                intakeMethod === 'audio' ?'border-primary bg-primary/5 text-primary' :'border-border text-foreground hover:border-primary/50'
              }`}
            >
              <Icon name="Mic" size={18} className="inline mr-2" />
              Audio Input
            </button>
          </div>

          {intakeMethod === 'text' ? (
            <div>
              <Input
                type="text"
                label="Describe your symptoms or medical needs"
                placeholder="Example: I need help with post-surgery wound care and medication management..."
                value={textInput}
                onChange={(e) => setTextInput(e?.target?.value)}
                description="Be as detailed as possible to help us match you with the right provider"
                className="mb-4"
              />
              <Button
                variant="default"
                onClick={handleTextSubmit}
                disabled={!textInput?.trim()}
                iconName="Send"
                iconPosition="right"
                fullWidth
              >
                Submit Intake
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-2xl">
                {isRecording ? (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-error/10 rounded-full animate-pulse">
                      <Icon name="Mic" size={32} color="var(--color-error)" strokeWidth={2} />
                    </div>
                    <p className="text-base md:text-lg font-medium text-foreground mb-2">
                      Recording...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Speak clearly about your medical needs
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                      <Icon name="Mic" size={32} color="var(--color-primary)" strokeWidth={2} />
                    </div>
                    <p className="text-base md:text-lg font-medium text-foreground mb-2">
                      Record your message
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click below to start recording
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  onClick={toggleRecording}
                  iconName={isRecording ? 'Square' : 'Mic'}
                  iconPosition="left"
                  fullWidth
                  className="sm:flex-1"
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <label className="sm:flex-1">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    iconName="Upload"
                    iconPosition="left"
                    fullWidth
                    asChild
                  >
                    Upload Audio
                  </Button>
                </label>
              </div>

              {audioFile && (
                <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                  <Icon name="CheckCircle" size={20} color="var(--color-success)" strokeWidth={2} />
                  <span className="text-sm text-foreground">
                    Audio file uploaded: {audioFile?.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPanel;