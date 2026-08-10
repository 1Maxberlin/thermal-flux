import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Thermaflux" },
      {
        name: "description",
        content:
          "The terms covering use of the Thermaflux engineering calculators, including the engineering-judgement disclaimer and limitation of liability.",
      },
      { property: "og:title", content: "Terms of Service — Thermaflux" },
      {
        property: "og:description",
        content:
          "Acceptable use, accuracy expectations and liability terms for the Thermaflux flow and thermal analysis tools.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "1. Acceptance",
    p: [
      "By opening and using Thermaflux you agree to these terms. If you do not accept them, please stop using the application.",
    ],
  },
  {
    h: "2. What the service is",
    p: [
      "Thermaflux provides interactive calculators for single-phase pipe hydraulics, steady conduction and transient cooling, plus an exploratory dashboard for rock and fluid datasets. It is an aid to engineering work, not a substitute for it.",
    ],
  },
  {
    h: "3. Engineering judgement and accuracy",
    p: [
      "The correlations implemented here are standard published relationships used within their stated assumptions: incompressible single-phase flow in a straight circular conduit, one-dimensional steady conduction through a homogeneous wall, and lumped-capacitance cooling with a uniform internal temperature.",
      "Results must be checked by a competent engineer against the real system before being used for design, procurement, operation or safety decisions. You remain responsible for validating every number you act on.",
    ],
  },
  {
    h: "4. Acceptable use",
    p: [
      "Do not attempt to disrupt the service, reverse the hosting infrastructure, or use the application in a way that breaks applicable law. Do not upload data you are not entitled to process.",
    ],
  },
  {
    h: "5. Your data",
    p: [
      "Calculations and uploaded files are processed in your browser. You are responsible for retaining your own copies of anything you export.",
    ],
  },
  {
    h: "6. Availability",
    p: [
      "The application is provided on an as-available basis. Features may change, and access may be interrupted for maintenance or for reasons outside our control.",
    ],
  },
  {
    h: "7. Disclaimer and limitation of liability",
    p: [
      "The service is provided \u201cas is\u201d, without warranties of any kind, express or implied, including fitness for a particular purpose. To the fullest extent permitted by law, no liability is accepted for any loss, damage, downtime, cost or lost profit arising from use of, or reliance on, the results produced by this application.",
    ],
  },
  {
    h: "8. Intellectual property",
    p: [
      "The application interface, brand and source code belong to their author. The physical relationships it implements are, of course, public scientific knowledge.",
    ],
  },
  {
    h: "9. Changes to these terms",
    p: [
      "Updated terms will be published on this page and take effect immediately on publication.",
    ],
  },
];

function TermsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="Plain-language terms for using the Thermaflux calculators — including the one that matters most: verify results before you build anything with them."
      />
      <article className="panel animate-rise space-y-6 p-6 sm:p-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl font-extrabold">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para} className="mt-2 text-[0.97rem] leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </section>
        ))}
      </article>
    </AppShell>
  );
}
