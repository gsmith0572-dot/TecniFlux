// Script to create Stripe products and prices for TecniFlux
import Stripe from 'stripe';

const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(stripeSecretKey);

async function setupStripePrices() {
  console.log('🔧 Setting up Stripe products and prices...\n');

  try {
    // Create Premium product
    const premiumProduct = await stripe.products.create({
      name: 'TecniFlux Premium',
      description: '30 búsquedas mensuales de diagramas automotrices',
    });
    console.log('✅ Created Premium product:', premiumProduct.id);

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 599, // $5.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Premium price:', premiumPrice.id);
    console.log(`   Add to PLAN_CONFIG: premium: { limit: 30, priceId: '${premiumPrice.id}' }\n`);

    // Create Plus product
    const plusProduct = await stripe.products.create({
      name: 'TecniFlux Plus',
      description: 'Búsquedas ilimitadas de diagramas automotrices',
    });
    console.log('✅ Created Plus product:', plusProduct.id);

    const plusPrice = await stripe.prices.create({
      product: plusProduct.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Plus price:', plusPrice.id);
    console.log(`   Add to PLAN_CONFIG: plus: { limit: -1, priceId: '${plusPrice.id}' }\n`);

    // Create Pro product
    const proProduct = await stripe.products.create({
      name: 'TecniFlux Pro',
      description: 'Búsquedas ilimitadas + 3 usuarios por cuenta',
    });
    console.log('✅ Created Pro product:', proProduct.id);

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1999, // $19.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Created Pro price:', proPrice.id);
    console.log(`   Add to PLAN_CONFIG: pro: { limit: -1, priceId: '${proPrice.id}' }\n`);

    console.log('\n🎉 All products and prices created successfully!');
    console.log('\n📝 Update your server/routes.ts PLAN_CONFIG with the following:');
    console.log(`
const PLAN_CONFIG = {
  free: { limit: 3, priceId: null },
  premium: { limit: 30, priceId: '${premiumPrice.id}' },
  plus: { limit: -1, priceId: '${plusPrice.id}' },
  pro: { limit: -1, priceId: '${proPrice.id}' },
};
    `);

  } catch (error: any) {
    console.error('❌ Error setting up Stripe prices:', error.message);
    process.exit(1);
  }
}

setupStripePrices();
