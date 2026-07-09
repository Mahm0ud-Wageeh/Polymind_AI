import { api } from '@/lib/api'

export interface PlanLimits {
  messages_per_month?: number
  tokens_per_month?: number
  seats?: number
  projects?: number
}

export interface Plan {
  name: string
  price: number
  interval: string
  stripe_price_id: string | null
  limits: PlanLimits
  features: string[]
}

export interface BillingUsage {
  period_start: string
  messages: number
  tokens: number
  tokens_input: number
  tokens_output: number
  cost: number
  limits: PlanLimits
  usage_ratio: {
    messages: number | null
    tokens: number | null
  }
}

export interface BillingInvoice {
  id: string
  number: string
  amount: string | number
  currency: string
  status: string
  issued_at: string | null
  paid_at: string | null
}

export interface BillingOverview {
  plan: string
  plan_details: Plan
  subscription: unknown | null
  usage: BillingUsage
  invoices: BillingInvoice[]
  billing_enabled: boolean
}

/**
 * Billing service backed by the Polymind API. Checkout/portal return a Stripe
 * URL the browser should redirect to.
 */
export const billingService = {
  overview: () => api.get<BillingOverview>('/billing'),
  plans: () => api.get<{ plans: Record<string, Plan> }>('/billing/plans'),
  checkout: (plan: string) => api.post<{ url: string }>('/billing/checkout', { plan }),
  portal: () => api.post<{ url: string }>('/billing/portal'),
}
