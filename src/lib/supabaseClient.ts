
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
// 실제 환경에서는 환경 변수를 사용하는 것이 좋습니다
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gicmtijvsqejdkxxiopc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY210aWp2c3FlamRreHhpb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjQ0MDYsImV4cCI6MjA1OTQ0MDQwNn0.eTam9yNQtHn0ltkFkADNwjIlPEFSDAj-IsHP_9VeXec';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
