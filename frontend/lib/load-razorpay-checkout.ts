const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Waits until `window.Razorpay` is ready after checkout.js loads.
 */
function waitForRazorpay(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Razorpay SDK timed out."));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

/**
 * Ensures Razorpay checkout.js is on the page and `window.Razorpay` is available.
 * The publishable key is passed when opening checkout — not when loading this script.
 */
export async function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Razorpay can only load in the browser.");
  }
  if (window.Razorpay) return;

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
  if (existing) {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay SDK.")), { once: true });
    });
    await waitForRazorpay();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK."));
    document.body.appendChild(script);
  });

  await waitForRazorpay();
}
