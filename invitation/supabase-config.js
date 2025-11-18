// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://wmbucfrspxxrbmafygvx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnVjZnJzcHh4cmJtYWZ5Z3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjE5MzMsImV4cCI6MjA3ODczNzkzM30.NcmT9seEx5B1jiLaEwyiPPtiRU8PWyhRBD0p0-Klxwo'
};

// Initialize Supabase client (will be used by admin and card pages)
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
