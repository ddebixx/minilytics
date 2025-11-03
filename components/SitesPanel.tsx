'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Site = {
  id: string;
  created_at: string;
  domain: string;
  site_id: string;
};

export default function SitesPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setError('Please log in to manage your sites.');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/sites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load sites');
        if (mounted) setSites(json.sites || []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load sites');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    try {
      setCreating(true);
      setError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create site');
      setSites((prev) => [json.site, ...prev]);
      setDomain('');
    } catch (e: any) {
      setError(e.message || 'Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Your Sites</h2>

      <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {creating ? 'Adding…' : 'Add Domain'}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-gray-600 dark:border-gray-700 dark:text-gray-400">
      No sites yet. Add your domain above to get your site ID and integration instructions.
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const scriptSnippet = `<script defer src="${origin}/tracker.js" data-site-id="${site.site_id}"></script>`;
  const npmSnippet = `npm i @minilytics/tracker  # (placeholder package)

import { init } from '@minilytics/tracker';
init({ endpoint: '${origin}/api/track', siteId: '${site.site_id}' });`;

  return (
    <div className="rounded-lg border p-4 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{site.domain}</h3>
          <p className="text-sm text-gray-500">Site ID: <code>{site.site_id}</code></p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 font-medium">Copy-paste script</h4>
          <CodeBlock code={scriptSnippet} language="html" label="index.html" />
        </div>
        <div>
          <h4 className="mb-2 font-medium">NPM (placeholder)</h4>
          <CodeBlock code={npmSnippet} language="ts" label="app.ts" />
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, language, label }: { code: string; language: string; label: string }) {
  return (
    <div className="rounded-md bg-gray-900 p-4 text-sm text-gray-200">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <pre className="overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
