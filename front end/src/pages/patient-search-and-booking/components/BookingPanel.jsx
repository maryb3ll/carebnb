import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const BookingPanel = ({ onSubmit, pendingBooking, onClose, bookingError, bookingSuccess }) => {
  const [intakeMethod, setIntakeMethod] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const runPipeline = async (body, isJson = true) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/intake/analyze`, {
        method: 'POST',
        ...(isJson
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          : { body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || `Request failed (${res.status})`;
        setError(res.status === 403 ? `${msg} Check that the pipeline is reachable and not behind auth.` : msg);
        return;
      }
      setResult(data);
      if (data.status === 'completed' && onSubmit) {
        onSubmit({
          type: data.transcript ? 'audio' : 'text',
          intakeResult: data,
          keywords: data.keywords,
          transcript: data.transcript,
          sessionId: data.sessionId,
        });
      }
    } catch (e) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput?.trim()) return;
    runPipeline({ text: textInput.trim() }, true);
  };

  const handleAudioSubmit = () => {
    if (!audioFile) return;
    const formData = new FormData();
    formData.append('audio', audioFile);
    const ext = (audioFile.name || '').split('.').pop()?.toLowerCase();
    if (ext) formData.append('format', ext);
    runPipeline(formData, false);
  };

  const handleAudioUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) setAudioFile(file);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => setIsRecording(false), 3000);
    }
  };

  const downloadPdf = () => {
    if (!result?.summaryPdfBase64) return;
    const blob = new Blob([Uint8Array.from(atob(result.summaryPdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intake-summary-${result.sessionId || 'report'}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-3xl shadow-organic-md p-6 md:p-8 lg:p-10">
          {onClose && (
            <div className="flex justify-end mb-4">
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-muted-foreground" aria-label="Close">
                <Icon name="X" size={20} strokeWidth={2} />
              </button>
            </div>
          )}
          {bookingSuccess && (
            <div className="flex items-center gap-4 p-4 mb-6 rounded-2xl bg-[#38A169] text-white border-2 border-[#2F855A]">
              <Icon name="CheckCircle" size={28} color="white" strokeWidth={2} className="flex-shrink-0" />
              <div>
                <p className="font-semibold text-lg">Request sent</p>
                <p className="text-white/90 text-sm">The provider will review your intake and confirm the appointment.</p>
              </div>
            </div>
          )}
          {result?.status === 'completed' && !bookingSuccess && (
            <div className="flex items-center gap-4 p-4 mb-6 rounded-2xl bg-[#38A169] text-white border-2 border-[#2F855A]">
              <Icon name="CheckCircle" size={28} color="white" strokeWidth={2} className="flex-shrink-0" />
              <div>
                <p className="font-semibold text-lg">Intake completed</p>
                <p className="text-white/90 text-sm">Waiting for provider to review</p>
              </div>
            </div>
          )}
          {bookingError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {bookingError}
            </div>
          )}
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
                disabled={!textInput?.trim() || loading}
                iconName="Send"
                iconPosition="right"
                fullWidth
              >
                {loading ? 'Analyzing…' : 'Submit Intake'}
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
                <>
                  <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                    <Icon name="CheckCircle" size={20} color="var(--color-success)" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      Audio file uploaded: {audioFile?.name}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    onClick={handleAudioSubmit}
                    disabled={loading}
                    iconName="Send"
                    iconPosition="right"
                    fullWidth
                  >
                    {loading ? 'Analyzing…' : 'Submit Intake'}
                  </Button>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {bookingSuccess && onClose && (
            <Button variant="default" onClick={onClose} className="mt-4">
              Done
            </Button>
          )}

          {result && result.status === 'completed' && (
            <div className="mt-6 p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                AI intake result
              </h3>
              {result.keywords?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Keywords</p>
                  <p className="text-sm text-foreground">
                    {result.keywords.join(', ')}
                  </p>
                </div>
              )}
              {result.transcript && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Transcript</p>
                  <p className="text-sm text-foreground line-clamp-3">{result.transcript}</p>
                </div>
              )}
              {result.summaryPdfBase64 && (
                <Button
                  variant="outline"
                  onClick={downloadPdf}
                  iconName="FileDown"
                  iconPosition="left"
                >
                  Download summary PDF
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPanel;