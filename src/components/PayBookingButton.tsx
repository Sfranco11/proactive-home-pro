import { useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createBookingCheckoutSession } from "@/lib/payments.functions";

interface PayBookingButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  disabled?: boolean;
}

const FINANCING_THRESHOLD = 1000;

export function PayBookingButton({ bookingId, amount, currency = "USD", disabled }: PayBookingButtonProps) {
  const [open, setOpen] = useState(false);
  const financingAvailable = amount >= FINANCING_THRESHOLD;

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/bookings/${bookingId}?paid=1`;
    const result = await createBookingCheckoutSession({
      data: { bookingId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount due</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              <span className="text-sm font-normal text-muted-foreground">{currency}</span>
            </p>
          </div>
          <CreditCard className="h-6 w-6 text-primary" />
        </div>

        {financingAvailable && (
          <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <span className="font-medium text-foreground">Pay over time available</span> — split this into
              4 interest-free payments with Klarna, Afterpay, or Affirm at checkout.
            </span>
          </div>
        )}

        <Button className="w-full" size="lg" disabled={disabled} onClick={() => setOpen(true)}>
          Pay now
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Apple Pay, Google Pay & cards{financingAvailable ? " · Klarna · Afterpay · Affirm" : ""}
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 sm:p-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>Complete payment</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            {open && (
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
