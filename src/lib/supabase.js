import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://huualitivysvqgpupvit.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dWFsaXRpdnlzdnFncHVwdml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODkyODgsImV4cCI6MjA5NzA2NTI4OH0.F3IngtrIZy5T_lZt38PDb65dc0U38a_e_w16niZUbBM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
