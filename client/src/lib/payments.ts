import { loadStripe, Stripe } from '@stripe/stripe-js'

// Initialize Stripe
let stripePromise: Promise<Stripe | null>
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
}

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<PaymentIntent> {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create payment intent')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    throw new Error(`Payment intent creation failed: ${error.message}`)
  }
}

/**
 * Confirm a payment with Stripe
 */
export async function confirmPayment(
  clientSecret: string,
  paymentMethodId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Stripe not initialized')
    }

    const result = await stripe.confirmPayment({
      clientSecret,
      confirmParams: paymentMethodId ? {
        payment_method: paymentMethodId
      } : undefined,
    })

    if (result.error) {
      return {
        success: false,
        error: result.error.message
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Process NFT purchase with fiat payment
 */
export async function processNFTPurchase(
  nftId: string,
  shares: number,
  pricePerShare: number,
  paymentMethodId: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const totalAmount = shares * pricePerShare

    // Create payment intent
    const paymentIntent = await createPaymentIntent(totalAmount, 'usd', {
      type: 'nft_purchase',
      nft_id: nftId,
      shares: shares.toString(),
      price_per_share: pricePerShare.toString()
    })

    // Confirm payment
    const paymentResult = await confirmPayment(paymentIntent.client_secret, paymentMethodId)

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error
      }
    }

    // Process the NFT transfer on backend
    const response = await fetch('/api/nft/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        shares,
        paymentIntentId: paymentIntent.id,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to process NFT purchase')
    }

    const result = await response.json()

    return {
      success: true,
      transactionId: result.transactionId
    }
  } catch (error: any) {
    console.error('Error processing NFT purchase:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Process challenge entry fee payment
 */
export async function processChallengePayment(
  challengeId: string,
  entryFee: number,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const paymentIntent = await createPaymentIntent(entryFee, 'usd', {
      type: 'challenge_entry',
      challenge_id: challengeId
    })

    const paymentResult = await confirmPayment(paymentIntent.client_secret, paymentMethodId)

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error
      }
    }

    // Join challenge on backend
    const response = await fetch('/api/challenges/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeId,
        paymentIntentId: paymentIntent.id,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to join challenge')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error processing challenge payment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create subscription for premium features
 */
export async function createSubscription(
  planId: string,
  paymentMethodId: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        paymentMethodId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create subscription')
    }

    const result = await response.json()

    return {
      success: true,
      subscriptionId: result.subscriptionId
    }
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch('/api/payments/plans')
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription plans')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error)
    return []
  }
}

/**
 * Save payment method for future use
 */
export async function savePaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/payments/save-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save payment method')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error saving payment method:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get saved payment methods
 */
export async function getSavedPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch('/api/payments/methods')
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment methods')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error fetching payment methods:', error)
    return []
  }
}

/**
 * Process refund
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const response = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to process refund')
    }

    const result = await response.json()

    return {
      success: true,
      refundId: result.refundId
    }
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get payment history
 */
export async function getPaymentHistory(
  limit: number = 10,
  startingAfter?: string
): Promise<PaymentIntent[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    if (startingAfter) {
      params.append('starting_after', startingAfter)
    }

    const response = await fetch(`/api/payments/history?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment history')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    return []
  }
}

/**
 * Calculate platform fees
 */
export function calculatePlatformFee(amount: number, feePercentage: number = 2.5): {
  platformFee: number
  netAmount: number
  totalAmount: number
} {
  const platformFee = amount * (feePercentage / 100)
  const netAmount = amount - platformFee
  
  return {
    platformFee,
    netAmount,
    totalAmount: amount
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number, minAmount: number = 0.50): {
  isValid: boolean
  error?: string
} {
  if (amount < minAmount) {
    return {
      isValid: false,
      error: `Minimum payment amount is ${formatCurrency(minAmount)}`
    }
  }

  if (amount > 999999.99) {
    return {
      isValid: false,
      error: 'Maximum payment amount exceeded'
    }
  }

  return { isValid: true }
}

export { getStripe }
