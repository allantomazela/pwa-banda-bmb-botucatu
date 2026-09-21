// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
// Exceção: fetch de recuperação de sessão JWT inválida (session-recovery).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { createSessionRecoveryFetch } from './session-recovery'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

let clientRef: SupabaseClient<Database> | null = null

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: createSessionRecoveryFetch({
      publishableKey: SUPABASE_PUBLISHABLE_KEY,
      signOut: async () => {
        if (!clientRef) return
        await clientRef.auth.signOut({ scope: 'local' })
      },
    }),
  },
})

clientRef = supabase
