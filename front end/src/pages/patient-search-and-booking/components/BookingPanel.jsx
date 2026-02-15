import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabase';

const BookingPanel = ({ onSubmit }) => {
  const [intakeMethod, setIntakeMethod] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const handleTextSubmit = async () => {
    if (!textInput?.trim()) return;

    setProcessing(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append('text', textInput);
      // Don't send careRequestId - let the API create it

      const response = await fetch('/api/intake/process', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process intake');
      }

      onSubmit({
        type: 'text',
        content: textInput,
        pdfUrl: result.pdfUrl,
        sessionId: result.sessionId
      });
      setTextInput('');
    } catch (err) {
      console.error('Intake error:', err);
      setError(err.message || 'Failed to process intake');
    } finally {
      setProcessing(false);
    }
  };

  const handleAudioUpload = async (e) => {
    console.log('handleAudioUpload called', e);
    const file = e?.target?.files?.[0];
    console.log('Selected file:', file);
    if (!file) {
      console.log('No file selected');
      return;
    }

    setAudioFile(file);
    setProcessing(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append('audio', file);
      // Don't send careRequestId - let the API create it

      const response = await fetch('/api/intake/process', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process audio');
      }

      onSubmit({
        type: 'audio',
        file: file,
        pdfUrl: result.pdfUrl,
        sessionId: result.sessionId
      });
    } catch (err) {
      console.error('Audio upload error:', err);
      setError(err.message || 'Failed to process audio');
    } finally {
      setProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          // Process the recorded audio
          setProcessing(true);
          setError('');

          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const formData = new FormData();
            formData.append('audio', audioFile);
            // Don't send careRequestId - let the API create it

            const response = await fetch('/api/intake/process', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || 'Failed to process recording');
            }

            onSubmit({
              type: 'audio',
              file: audioFile,
              pdfUrl: result.pdfUrl,
              sessionId: result.sessionId
            });
            setAudioFile(audioFile);
          } catch (err) {
            console.error('Recording processing error:', err);
            setError(err.message || 'Failed to process recording');
          } finally {
            setProcessing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone access error:', err);
        setError('Failed to access microphone. Please grant permission.');
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-organic-xl overflow-hidden">
        <button
          onClick={() => onSubmit && onSubmit({ type: 'cancel' })}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-organic transition-all duration-250"
          aria-label="Close modal"
        >
          <Icon name="X" size={20} strokeWidth={2} />
        </button>

        <div className="overflow-y-auto max-h-[90vh] p-6 md:p-8 lg:p-10">
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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {processing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-blue-800 text-sm">Processing your intake with AI...</p>
              </div>
            </div>
          )}

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
                disabled={!textInput?.trim() || processing}
                iconName={processing ? null : "Send"}
                iconPosition="right"
                fullWidth
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Submit Intake'
                )}
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
                  disabled={processing}
                  iconName={isRecording ? 'Square' : 'Mic'}
                  iconPosition="left"
                  fullWidth
                  className="sm:flex-1"
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <div className="sm:flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.m4a,.mp3,.wav,.webm"
                    onChange={handleAudioUpload}
                    disabled={processing}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current && !processing) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={processing}
                    className={`
                      flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
                      border-2 border-border text-foreground font-medium text-sm md:text-base
                      transition-all duration-250
                      ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 cursor-pointer'}
                    `}
                  >
                    <Icon name="Upload" size={18} />
                    Upload Audio
                  </button>
                </div>
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