import { getAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import SitesPanel from "@/components/SitesPanel";

export const dynamic = "force-dynamic";

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    return user.id;
  } catch (e) {
    console.error('Auth check failed:', e);
    return null;
  }
}

export default async function SitesPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect('/');
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sites</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your websites and get integration code
        </p>
      </div>
      
      <SitesPanel />
    </div>
  );
}
