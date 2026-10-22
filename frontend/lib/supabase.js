import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dvmcvivoxdkuzvjprqhz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_bOaTCfPfD9Ur2CYwP_K4CQ_rKeWR-Mb';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
