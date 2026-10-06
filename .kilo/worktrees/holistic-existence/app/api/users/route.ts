import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, username, password, role, name } = body as Partial<User>;
    if (!id || !username || !password || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase.from('users').insert({
      id, username, password, role, name
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
