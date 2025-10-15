import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createStripePaymentIntent({ amount, currency = 'eur', metadata = {} }) {
  return stripe.paymentIntents.create({ amount, currency, metadata });
}

export async function initiateMobileMoney({ amount, currency = 'xof', phone }) {
  return { status: 'initiated', provider: 'mobile_money', amount, currency, phone };
}
