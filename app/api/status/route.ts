import { NextResponse } from "next/server";
import { resolveServerProvider, ALLOWED_PIPELINE_PROVIDERS, ALLOWED_CONCEPT_ART_PROVIDERS } from "@/lib/auth/serverAuth";

export async function GET() {
  const provider = resolveServerProvider();
  const isDemo = provider === "demo";

  return NextResponse.json({
    mode: isDemo ? "demo" : "server",
    aiConnected: !isDemo,
    providerName: isDemo ? "VELLUM Studio Engine" : provider.toUpperCase(),
    isDemo,
    supportedProviders: ALLOWED_PIPELINE_PROVIDERS,
    supportedConceptArtProviders: ALLOWED_CONCEPT_ART_PROVIDERS,
  });
}
