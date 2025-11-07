import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qyjwaadlrkrxpnpkjlvn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5andhYWRscmtyeHBucGtqbHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjMxODgsImV4cCI6MjA3NzQ5OTE4OH0.xAFYsRUt_qG-djMKLcQxPqSL8LwtavrYmoiysIaLg8c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
