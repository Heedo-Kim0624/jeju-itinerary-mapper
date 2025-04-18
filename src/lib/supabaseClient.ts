import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
// 실제 환경에서는 환경 변수를 사용하는 것이 좋습니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
