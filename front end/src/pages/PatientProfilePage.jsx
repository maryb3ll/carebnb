import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { supabase } from '../lib/supabase';

const PROFILE_STORAGE_KEY = 'carebnb_patient_profile';

const defaultProfile = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const FIELD_ICONS = {
  fullName: 'User',
  email: 'Mail',
  phone: 'Phone',
  address: 'MapPin',
  dateOfBirth: 'Calendar',
  emergencyContactName: 'UserPlus',
  emergencyContactPhone: 'Phone',
};

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        let email = parsed.email || '';
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) email = session.user.email;
          if (session?.user?.user_metadata?.full_name) {
            parsed.fullName = parsed.fullName || session.user.user_metadata.full_name;
          }
        }
        setProfile({ ...defaultProfile, ...parsed, email });
      } catch {
        setProfile(defaultProfile);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toStore = { ...profile };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) toStore.email = session.user.email;
      }
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(toStore));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile.fullName || profile.email || 'P').charAt(0).toUpperCase();

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto main-content-pt px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-200 animate-pulse" />
            <p className="text-sm text-stone-500">Loading profile…</p>
          </div>
        </div>
      </>
    );
  }

  const field = (label, value, fieldKey, placeholder = '') => {
    if (editing) {
      const isEmail = fieldKey === 'email';
      return (
        <div key={fieldKey} className="mb-5 last:mb-0">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">{label}</label>
          <input
            type={fieldKey === 'dateOfBirth' ? 'date' : fieldKey === 'phone' || fieldKey === 'emergencyContactPhone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            readOnly={isEmail}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
          />
          {isEmail && <p className="text-xs text-stone-500 mt-1.5">Email is from your account.</p>}
        </div>
      );
    }
    const iconName = FIELD_ICONS[fieldKey] || 'Circle';
    return (
      <div key={fieldKey} className="flex items-start gap-4 py-4 border-b border-stone-100 last:border-0 last:pb-0 first:pt-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
          <Icon name={iconName} size={16} className="text-stone-500" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{label}</p>
          <p className="mt-0.5 text-stone-900 font-medium">{value || 'Not provided'}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-stone-50/50">
        <div className="max-w-2xl mx-auto main-content-pt px-4 w-full min-w-0 py-6 md:py-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-stone-300 bg-white text-stone-800 font-semibold text-base shadow-sm hover:bg-stone-50 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-8 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} strokeWidth={2} />
            Back
          </button>

          {/* Profile header */}
          <div className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-primary/5 via-white to-stone-50/80 px-6 py-8 md:py-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-semibold text-primary">
                    {initial}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold text-stone-900">
                    {profile.fullName || 'My profile'}
                  </h1>
                  {profile.email && (
                    <p className="text-sm text-stone-500 mt-0.5">{profile.email}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
                      >
                        <Icon name="Pencil" size={16} strokeWidth={2} />
                        Edit profile
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                        >
                          {saving ? 'Saving…' : 'Save changes'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal information */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="User" size={16} className="text-primary" strokeWidth={2} />
              </div>
              <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">
                Personal information
              </h2>
            </div>
            <div className="p-5 md:p-6">
              {editing ? (
                <>
                  {field('Full name', profile.fullName, 'fullName', 'Your full name')}
                  {field('Email', profile.email, 'email')}
                  {field('Phone', profile.phone, 'phone', 'Phone number')}
                  {field('Address', profile.address, 'address', 'Street, city, state, ZIP')}
                  {field('Date of birth', profile.dateOfBirth, 'dateOfBirth')}
                </>
              ) : (
                <div>
                  {field('Full name', profile.fullName, 'fullName')}
                  {field('Email', profile.email, 'email')}
                  {field('Phone', profile.phone, 'phone')}
                  {field('Address', profile.address, 'address')}
                  {field('Date of birth', profile.dateOfBirth, 'dateOfBirth')}
                </div>
              )}
            </div>
          </div>

          {/* Emergency contact */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Icon name="Phone" size={16} className="text-amber-700" strokeWidth={2} />
              </div>
              <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">
                Emergency contact
              </h2>
            </div>
            <div className="p-5 md:p-6">
              {editing ? (
                <>
                  {field('Contact name', profile.emergencyContactName, 'emergencyContactName', 'Name')}
                  {field('Contact phone', profile.emergencyContactPhone, 'emergencyContactPhone', 'Phone number')}
                </>
              ) : (
                <div>
                  {field('Contact name', profile.emergencyContactName, 'emergencyContactName')}
                  {field('Contact phone', profile.emergencyContactPhone, 'emergencyContactPhone')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
