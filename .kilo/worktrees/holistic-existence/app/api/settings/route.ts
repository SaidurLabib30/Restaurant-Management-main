import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ taxRate: 0.08, currency: '৳', restaurantName: 'Restaurant' });
    }
    return NextResponse.json({
      taxRate: data.tax_rate,
      currency: data.currency,
      restaurantName: data.restaurant_name
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('settings').upsert({
      id: 'global',
      tax_rate: body.taxRate,
      currency: body.currency,
      restaurant_name: body.restaurantName
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
