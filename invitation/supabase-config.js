// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://wgbgysivohhmdbwgmmkg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYmd5c2l2b2hobWRid2dtbWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Nzg4MjAsImV4cCI6MjA4MDE1NDgyMH0.nre08vOjjLhoQM_wNALIRSmOGxBNp3872dJxUvIFS70'
};

// Initialize Supabase client (will be used by admin and card pages)
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
