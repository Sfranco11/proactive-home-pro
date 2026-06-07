import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { CheckCircle2, CalendarCheck, ShieldAlert, Users, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png.asset.json";
import logoMark from "@/assets/logo-mark.png.asset.json";


export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }
  if (session) {
    return <Navigate to={profile?.role === "realtor" ? "/realtor" : "/home"} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav (marketing) */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="container-wide flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2.5 text-primary-foreground">
            <img
              src={logoMark.url}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain [filter:brightness(0)_invert(1)]"
            />
            <span className="font-display text-lg font-semibold tracking-tight">
              HomeOwner <span className="text-gold">Pro</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Link to="/auth">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="container-wide relative z-10 pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Gifted by your realtor
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Own your home with confidence.
            </h1>


            <p className="mt-5 max-w-xl text-base text-primary-foreground/85 md:text-lg">
              Seasonal maintenance reminders, a complete systems reference, and one tap to your
              realtor's vetted pros when something breaks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                <Link to="/auth" search={{ mode: "realtor" } as any}>I'm a realtor</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      </section>

      {/* Features */}
      <section className="container-wide py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Everything a new homeowner needs</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            From your first spring gutter cleaning to a midnight burst pipe — you're covered.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: CalendarCheck, t: "Seasonal calendar", d: "Spring, summer, fall, winter — what to do and when." },
            { i: BookOpen, t: "Systems reference", d: "Shutoffs, lifespans, warning signs — at your fingertips." },
            { i: ShieldAlert, t: "Something Broke", d: "Triage the issue, get DIY steps, or call a vetted pro." },
            { i: Users, t: "Trusted pros", d: "Your realtor's preferred partners — one tap to call." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card-gradient p-6 shadow-soft">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.i className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For realtors */}
      <section className="bg-secondary/60">
        <div className="container-wide grid gap-12 py-20 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">For realtors</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Stay top-of-mind. Earn referral fees.
            </h2>
            <p className="mt-4 text-muted-foreground">
              White-label the app under your brand. Upload your preferred service partners. Every
              "Something Broke" tap routes through you — and we track every referral.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Generate unique referral codes per client",
                "Manage your trusted partner directory",
                "Track referrals and fees in one dashboard",
                "Stay connected for the next sale",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> {x}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8">
              <Link to="/auth" search={{ mode: "realtor" } as any}>Set up your realtor account</Link>
            </Button>
          </div>
          <div className="rounded-3xl bg-hero p-1 shadow-glow">
            <div className="rounded-[22px] bg-card p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-xs text-muted-foreground">This quarter</div>
                  <div className="font-display text-2xl font-semibold">$2,450</div>
                  <div className="text-xs text-success">+18 referrals</div>
                </div>
                <div className="rounded-xl bg-gold/15 px-3 py-1.5 text-xs font-medium text-gold-foreground">Top partner: HVAC</div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { n: "Coastal Plumbing Co.", c: "Plumbing", v: "$650 · 5 referrals" },
                  { n: "Summit HVAC", c: "HVAC", v: "$900 · 6 referrals" },
                  { n: "Bright Sparks Electric", c: "Electrical", v: "$300 · 3 referrals" },
                ].map((p) => (
                  <div key={p.n} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                    <div>
                      <div className="text-sm font-medium">{p.n}</div>
                      <div className="text-xs text-muted-foreground">{p.c}</div>
                    </div>
                    <div className="text-xs font-medium">{p.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <img src={logo.url} alt="HomeOwner Pro" width={120} height={32} loading="lazy" className="h-7 w-auto object-contain" />
          <span>© {new Date().getFullYear()} HomeOwner Pro · White-labeled for your realtor</span>
        </div>
      </footer>

    </div>
  );
}
