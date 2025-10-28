'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignInWithGoogle } from '@/hooks/mutations/useSignInWithGoogle';
import { useSignInWithKakao } from '@/hooks/mutations/useSignInWithKakao';
import { useSignInWithPassword } from '@/hooks/mutations/useSignInWithPassword';
import Link from 'next/link';
import { useState } from 'react';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 이메일로 로그인
  const { mutate: signInPassword, isPending: isPendingPassword } =
    useSignInWithPassword();
  const handleSignInWithEmail = () => {
    if (!email.trim()) return;
    if (!password.trim()) return;
    // 이메일을 이용해서 로그인 진행
    signInPassword({ email: email, password: password });
  };

  // 카카오 로그인
  const { mutate: signInWithKakao, isPending: isPendingKakao } =
    useSignInWithKakao();
  const handleSignInWithKakao = () => {
    signInWithKakao('kakao');
  };

  // 구글 로그인
  const { mutate: signInWithGoogle, isPending: isPendingGoogle } =
    useSignInWithGoogle();
  const handleSignInWithGoogle = () => {
    signInWithGoogle('google');
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-xl font-bold'>로그인</div>
      <div className='flex flex-col gap-2'>
        <Input
          disabled={isPendingPassword}
          value={email}
          onChange={e => setEmail(e.target.value)}
          type='email'
          className='py-6'
          placeholder='이메일을 입력해 주세요.'
        />
        <Input
          disabled={isPendingPassword}
          value={password}
          onChange={e => setPassword(e.target.value)}
          type='password'
          className='py-6'
          placeholder='비밀번호를 입력해 주세요.'
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Button
          onClick={handleSignInWithEmail}
          className='w-full cursor-pointer'
          disabled={isPendingPassword}
        >
          로그인
        </Button>
        {/* 카카오 로그인 */}
        <Button
          onClick={handleSignInWithKakao}
          className='w-full cursor-pointer bg-amber-300 hover:bg-amber-200 hover:text-white text-black'
          disabled={isPendingKakao}
        >
          카카오 계정으로 로그인
        </Button>
        {/* 구글 로그인 */}
        <Button
          onClick={handleSignInWithGoogle}
          className='w-full cursor-pointer bg-gray-600 hover:bg-gray-500 text-white'
          disabled={isPendingGoogle}
        >
          구글 계정으로 로그인
        </Button>
      </div>
      <div>
        <Link
          href={'/signup'}
          className='text-muted-foreground hover:text-gray-400 cursor-pointer'
        >
          계정이 없으시다면? 회원가입
        </Link>
      </div>
    </div>
  );
}

export default SignIn;
