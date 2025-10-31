import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default async function DefaultLayout({ children }: DefaultLayoutProps) {
  const supabase = await createClient();
  // 세션 정보가 있는지 없는지 기다림
  const { data } = await supabase.auth.getSession();
  // 세션 정보를 가져왔는데 null 이라면 비회원임
  if (data.session) redirect('/');
  return <div>{children}</div>;
}
