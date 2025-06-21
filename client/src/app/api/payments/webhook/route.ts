import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // const supabase = createSupabaseServerClient() // TODO: Implement server client

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const userId = paymentIntent.metadata.user_id
    const paymentType = paymentIntent.metadata.type

    // Update payment log
    await supabase
      .from('payment_logs')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id)

    // Handle different payment types
    switch (paymentType) {
      case 'nft_purchase':
        await processNFTPurchase(paymentIntent, supabase)
        break

      case 'challenge_entry':
        await processChallengeEntry(paymentIntent, supabase)
        break

      case 'subscription':
        await processSubscriptionPayment(paymentIntent, supabase)
        break

      default:
        console.log(`Unknown payment type: ${paymentType}`)
    }

    console.log(`Payment succeeded: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    // Update payment log
    await supabase
      .from('payment_logs')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id)

    console.log(`Payment failed: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function processNFTPurchase(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const { nft_id, shares, user_id } = paymentIntent.metadata

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        type: 'purchase',
        user_id: user_id,
        nft_id: nft_id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        payment_intent_id: paymentIntent.id,
        status: 'completed',
        metadata: {
          shares: parseInt(shares),
          payment_method: 'stripe'
        }
      })

    // Update NFT ownership (this would typically trigger smart contract interaction)
    // For now, we'll update the database
    await supabase
      .from('nft_ownership')
      .insert({
        user_id: user_id,
        nft_id: nft_id,
        shares: parseInt(shares),
        purchase_price: paymentIntent.amount / 100,
        purchase_date: new Date().toISOString(),
      })

    console.log(`NFT purchase processed: ${nft_id} for user ${user_id}`)
  } catch (error) {
    console.error('Error processing NFT purchase:', error)
  }
}

async function processChallengeEntry(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const { challenge_id, user_id } = paymentIntent.metadata

    // Add user to challenge participants
    await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challenge_id,
        user_id: user_id,
        entry_fee_paid: paymentIntent.amount / 100,
        payment_intent_id: paymentIntent.id,
      })

    // Update challenge participant count
    await supabase.rpc('increment_challenge_participants', {
      challenge_id: challenge_id
    })

    console.log(`Challenge entry processed: ${challenge_id} for user ${user_id}`)
  } catch (error) {
    console.error('Error processing challenge entry:', error)
  }
}

async function processSubscriptionPayment(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const { user_id, subscription_id } = paymentIntent.metadata

    // Update user subscription status
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user_id,
        subscription_id: subscription_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString(),
      })

    console.log(`Subscription payment processed: ${subscription_id} for user ${user_id}`)
  } catch (error) {
    console.error('Error processing subscription payment:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  // Handle subscription creation
  console.log(`Subscription created: ${subscription.id}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  // Handle subscription updates
  console.log(`Subscription updated: ${subscription.id}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  // Handle subscription cancellation
  console.log(`Subscription deleted: ${subscription.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  // Handle successful invoice payment
  console.log(`Invoice payment succeeded: ${invoice.id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  // Handle failed invoice payment
  console.log(`Invoice payment failed: ${invoice.id}`)
}
