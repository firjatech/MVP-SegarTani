import { NextResponse } from 'next/server';
const midtransClient = require('midtrans-client');

// Initialize Snap API instance
const snap = new midtransClient.Snap({
    isProduction : false,
    serverKey : process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxxx', // Gunakan key dummy untuk sandbox
    clientKey : process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxxx'
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, gross_amount, customer_details, item_details } = body;

    if (!order_id || !gross_amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount)
      },
      customer_details: customer_details,
      item_details: item_details
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({ 
      token: transaction.token, 
      redirect_url: transaction.redirect_url 
    });

  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 500 });
  }
}
