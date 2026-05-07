import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a service role key to update the orders table from a webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { order_id, transaction_status, fraud_status } = body;

    let orderStatus = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        orderStatus = 'processing'; // Paid successfully
      }
    } else if (transaction_status === 'settlement') {
      orderStatus = 'processing'; // Paid successfully
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      orderStatus = 'cancelled';
    } else if (transaction_status === 'pending') {
      orderStatus = 'pending';
    }

    // Update order in Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', order_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ status: 'success', message: 'Webhook received' });
  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
