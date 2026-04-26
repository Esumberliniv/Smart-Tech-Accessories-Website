import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

function buildUserShape(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    role: profile?.role || 'customer',
    phone: profile?.phone || '',
    memberSince: new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

function getNamesFromMetadata(authUser) {
  const meta = authUser.user_metadata || {};
  const fullName = meta.full_name || meta.name || '';
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  const firstName =
    meta.first_name ||
    meta.firstName ||
    meta.given_name ||
    parts[0] ||
    '';

  const lastName =
    meta.last_name ||
    meta.lastName ||
    meta.family_name ||
    (parts.length > 1 ? parts.slice(1).join(' ') : '') ||
    '';

  return { firstName, lastName };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser(authUser) {
    const { firstName: metaFirst, lastName: metaLast } = getNamesFromMetadata(authUser);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile) {
      const { data: created } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            first_name: metaFirst,
            last_name: metaLast,
            role: 'customer',
            status: 'active',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();
      setUser(buildUserShape(authUser, created));
      setLoading(false);
      return;
    }

    // Heal names that were saved as empty but are available in user_metadata
    const needsHeal = (!profile.first_name && metaFirst) || (!profile.last_name && metaLast);
    if (needsHeal) {
      const patch = {};
      if (!profile.first_name && metaFirst) patch.first_name = metaFirst;
      if (!profile.last_name  && metaLast)  patch.last_name  = metaLast;
      await supabase.from('profiles').update(patch).eq('id', authUser.id);
      setUser(buildUserShape(authUser, { ...profile, ...patch }));
      setLoading(false);
      return;
    }

    setUser(buildUserShape(authUser, profile));
    setLoading(false);
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async function loginWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async function register({ firstName, lastName, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // stored in auth.users user_metadata — loadUser backfill reads these
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('email_rate_limit') || msg.includes('over_email_send_rate_limit')) {
        return { success: false, error: 'Too many sign-up attempts. Please wait a few minutes and try again.' };
      }
      return { success: false, error: error.message };
    }
    // session is null when email confirmation is required.
    // Profile row is created by loadUser's backfill once the user has an active session,
    // avoiding the RLS violation that occurs when inserting without a session.
    return { success: true, needsConfirmation: !data.session };
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function updateUser(updates) {
    if (!user) return { success: false };
    const profileUpdates = {};
    if ('firstName' in updates) profileUpdates.first_name = updates.firstName;
    if ('lastName' in updates) profileUpdates.last_name = updates.lastName;
    if ('phone' in updates) profileUpdates.phone = updates.phone;
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
    if (!error) setUser(prev => ({ ...prev, ...updates }));
    return { success: !error, error: error?.message };
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGitHub, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

