"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Provider = {
  id: string;
  name: string;
  role: string;
  services: string[];
  specialties: string[];
  rating: number;
  visit_count: number;
  price: number;
  next_available: string | null;
  photo_url: string | null;
};

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/providers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProvider(data);
        }
      })
      .catch(() => setError("Failed to load provider"))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-stone-600">No provider specified.</p>
        <Link href="/" className="text-red-500 font-medium hover:underline mt-2 inline-block">Find care</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-xl mx-auto p-4 text-stone-500">Loading…</div>;
  }

  if (error || !provider) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-stone-600">{error || "Provider not found."}</p>
        <Link href="/" className="text-red-500 font-medium hover:underline mt-2 inline-block">Find care</Link>
      </div>
    );
  }

  const nextAvailable = provider.next_available
    ? new Date(provider.next_available).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
    : "—";

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block">← Back to search</Link>
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-stone-100">
          <img
            src={provider.photo_url || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-stone-900">{provider.name}</h1>
          <p className="text-stone-600">{provider.role}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-amber-600 font-medium">★ {provider.rating}</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-600">{provider.visit_count} visits</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-stone-900">${Number(provider.price).toFixed(2)}/visit</p>
          <p className="mt-1 text-sm text-stone-600">Next available: {nextAvailable}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {(provider.specialties || []).map((s) => (
              <span key={s} className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-sm">
                {s}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(provider.services || []).map((s) => (
              <span key={s} className="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700 text-sm capitalize">
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <Link
            href={`/intake?providerId=${provider.id}&service=${encodeURIComponent(provider.services?.[0] || "nursing")}`}
            className="mt-6 block w-full text-center py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
          >
            Book this provider
          </Link>
        </div>
      </div>
    </div>
  );
}
