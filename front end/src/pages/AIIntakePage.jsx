import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';

const AIIntakePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const careRequestId = searchParams.get('careRequestId');

  const [inputMode, setInputMode] = useState('text'); // 'text' or 'audio'
  const [textInput, setTextInput] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/wav', 'audio/webm'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(m4a|mp3|wav|webm)$/i)) {
        setError('Please upload a valid audio file (M4A, MP3, WAV, or WebM)');
        return;
      }
      setAudioFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Prepare form data
      const formData = new FormData();

      if (inputMode === 'text') {
        if (!textInput.trim()) {
          setError('Please enter your medical information');
          setLoading(false);
          return;
        }
        formData.append('text', textInput);
      } else {
        if (!audioFile) {
          setError('Please upload an audio file');
          setLoading(false);
          return;
        }
        formData.append('audio', audioFile);
      }

      if (careRequestId) {
        formData.append('careRequestId', careRequestId);
      }

      // Call API to process intake
      const response = await fetch('/api/intake/process', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process intake');
      }

      console.log('Intake processed successfully:', result);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/request-care?success=true');
      }, 2000);

    } catch (err) {
      console.error('Intake error:', err);
      setError(err.message || 'Failed to process intake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          AI-Powered Intake
        </h1>
        <p className="text-stone-600 mb-6">
          Provide your medical information via text or audio. Our AI will analyze it and generate
          a comprehensive medical summary for healthcare providers.
        </p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Intake processed successfully! Generating medical summary...
            </p>
            <p className="text-green-700 text-sm mt-1">
              Redirecting you back...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          {/* Input Mode Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Choose input method
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Text Input
              </button>
              <button
                type="button"
                onClick={() => setInputMode('audio')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === 'audio'
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Audio Upload
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {inputMode === 'text' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Describe your medical needs
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Example: I've been experiencing severe headaches for the past three days, accompanied by nausea and sensitivity to light. I also have a history of migraines. I'm looking for a consultation to discuss treatment options..."
                  rows={10}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
                <p className="text-sm text-stone-500 mt-2">
                  Include your symptoms, medical history, and what type of care you need.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Upload audio recording
                </label>
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="audio/*,.m4a"
                    onChange={handleFileChange}
                    className="hidden"
                    id="audio-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="audio-upload"
                    className="cursor-pointer"
                  >
                    {audioFile ? (
                      <div>
                        <p className="text-stone-900 font-medium mb-1">
                          {audioFile.name}
                        </p>
                        <p className="text-sm text-stone-500">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setAudioFile(null);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm mt-2 underline"
                        >
                          Choose different file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="w-12 h-12 mx-auto text-stone-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                        <p className="text-stone-700 font-medium mb-1">
                          Click to upload audio file
                        </p>
                        <p className="text-sm text-stone-500">
                          Supported formats: M4A, MP3, WAV, WebM
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-sm text-stone-500 mt-2">
                  Record yourself describing your symptoms and medical needs.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (!textInput.trim() && !audioFile)}
                className="flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Submit & Generate AI Summary'
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            How it works
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Provide your medical information via text or audio</li>
            <li>Our AI analyzes your input and extracts key medical information</li>
            <li>A comprehensive summary with relevant research is generated</li>
            <li>Healthcare providers receive the summary when reviewing your request</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AIIntakePage;
