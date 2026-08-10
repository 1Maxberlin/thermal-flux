import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Thermaflux" },
      {
        name: "description",
        content:
          "How Thermaflux handles your data: calculations and uploaded CSV files stay in your browser, with no accounts, no tracking profiles and no server-side storage.",
      },
      { property: "og:title", content: "Privacy Policy — Thermaflux" },
      {
        property: "og:description",
        content:
          "Thermaflux processes every calculation and uploaded file locally in your browser. Read the full privacy statement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "1. Summary",
    p: [
      "Thermaflux is an engineering calculation tool. It runs entirely in your web browser. We do not ask you to create an account, and we do not collect, sell or share personal information.",
    ],
  },
  {
    h: "2. Data you enter",
    p: [
      "Fluid properties, pipe geometry, temperatures and every other value you type are held in your browser's memory for the length of your visit and used only to produce the results shown on screen. They are not transmitted to us.",
    ],
  },
  {
    h: "3. Files you upload",
    p: [
      "CSV files opened in the rock & fluid dashboard are read locally using your browser's file reader. The file contents never leave your device, are not uploaded to any server, and are discarded when you close or reload the page.",
    ],
  },
  {
    h: "4. Local storage",
    p: [
      "One small preference — your light or dark theme choice — is stored in your browser's local storage so the app looks the same next time. You can clear it at any time through your browser settings.",
    ],
  },
  {
    h: "5. Hosting and logs",
    p: [
      "The application files are served by a third-party hosting provider, which may keep standard technical logs such as IP address, timestamp and requested file for security and reliability purposes. These logs are not used to build a profile of you.",
    ],
  },
  {
    h: "6. Cookies and analytics",
    p: [
      "Thermaflux sets no advertising cookies and runs no cross-site tracking or behavioural profiling.",
    ],
  },
  {
    h: "7. Your rights",
    p: [
      "Because no personal data is stored on our side, there is nothing for us to retrieve, correct or delete. Clearing your browser storage removes every trace of the app from your device.",
    ],
  },
  {
    h: "8. Changes",
    p: [
      "If this policy changes, the revised version will be published on this page. Continued use of the app after a change means you accept the updated policy.",
    ],
  },
];

function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="Thermaflux is built to be private by design: your inputs and your datasets stay on your own machine."
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
