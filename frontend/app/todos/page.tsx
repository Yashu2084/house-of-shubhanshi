import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function TodosPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select();

  return (
    <main style={{ padding: '140px 24px 80px', maxWidth: '640px', margin: '0 auto', minHeight: '80vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', color: '#3B1D14', marginBottom: '16px' }}>Supabase Todos Test</h1>
      
      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <strong>Notice:</strong> {error.message}
          <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#7F1D1D' }}>
            Ensure a table named <code>todos</code> exists in your Supabase project (<code>https://dvmcvivoxdkuzvjprqhz.supabase.co</code>) with public SELECT permission.
          </div>
        </div>
      )}

      {todos && todos.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No todos found. Add items to the `todos` table in your Supabase dashboard.</p>
      )}

      <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: '#333' }}>
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.name || todo.title || JSON.stringify(todo)}</li>
        ))}
      </ul>
    </main>
  );
}
