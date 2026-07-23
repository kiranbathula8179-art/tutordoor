export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "",
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? "",
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
} as const;
