import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isValidLocale } from "@/i18n/config";
import { getMetaDataDeletionRequest } from "@/lib/meta/callbacks";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
};

export const metadata: Metadata = {
  title: "Meta data deletion — KONT",
  robots: { index: false, follow: false },
};

export default async function MetaDataDeletionStatusPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { code } = await searchParams;
  const request = code ? await getMetaDataDeletionRequest(code) : null;

  return (
    <main className="mx-auto max-w-lg px-5 py-16 text-[#1d1d1f]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0071e3]">KONT</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Meta data deletion</h1>
      {request ? (
        <>
          <p className="mt-4 text-[15px] leading-relaxed text-[rgba(29,29,31,0.68)]">
            Confirmation code <code className="rounded bg-[#f2f4f8] px-1.5 py-0.5 text-[13px]">{request.confirmationCode}</code>{" "}
            is complete. Facebook and Instagram data KONT received from Meta for that user — encrypted access
            tokens, Page and Instagram account identifiers, and connection metadata — were deleted from KONT.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-[rgba(29,29,31,0.55)]">
            Posts already published to Facebook or Instagram stay on those platforms. The KONT account itself is not
            deleted by this request — email admin@kontme.com if you also want the KONT login removed.
          </p>
        </>
      ) : (
        <p className="mt-4 text-[15px] leading-relaxed text-[rgba(29,29,31,0.68)]">
          This page shows the status of a Meta data-deletion request. Open it with the confirmation code from Facebook, or
          request deletion from Facebook → Settings → Apps and websites.
        </p>
      )}
    </main>
  );
}
