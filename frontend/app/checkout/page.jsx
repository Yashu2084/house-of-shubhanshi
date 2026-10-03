'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Seamlessly redirect to Your Selection / Request List
    router.replace('/cart');
  }, [router]);

  return (
    <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>✦</p>
      <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Redirecting to your curated selection...
      </p>
    </main>
  );
}
