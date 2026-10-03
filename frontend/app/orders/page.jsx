'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shop');
  }, [router]);

  return (
    <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: '#FDFBF7' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)' }}>✦</p>
      <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
        Redirecting to shop...
      </p>
    </main>
  );
}
