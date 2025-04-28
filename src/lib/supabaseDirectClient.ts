import { createClient } from '@supabase/supabase-js';

// 환경변수에서 가져오는 방식
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseDirect = createClient(supabaseUrl, supabaseAnonKey);
