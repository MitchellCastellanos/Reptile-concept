-- Allow checkout orders to sit in a pending state while Stripe collects payment.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'pending_payment';
