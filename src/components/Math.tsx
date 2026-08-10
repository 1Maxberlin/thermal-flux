import katex from "katex";
import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

/** Render an inline LaTeX expression as real mathematical typography. */
export function M({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: false }),
    [tex],
  );
  return <span className="align-middle" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Render a centred, display-mode LaTeX equation inside a soft card. */
export function Equation({ tex, caption }: { tex: string; caption?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: true }),
    [tex],
  );
  return (
    <figure className="my-4 overflow-x-auto rounded-xl border border-border bg-accent/40 px-4 py-4 text-center">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? (
        <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

/** A short "why this matters in the field" note attached to a calculation. */
export function FieldNote({ title = "What this means in the field", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-flame/35 bg-flame/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Lightbulb className="size-4 text-flame" />
        {title}
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
