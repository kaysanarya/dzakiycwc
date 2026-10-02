import { NextResponse } from "next/server";
import { ALLOWED_PIPELINE_PROVIDERS, ALLOWED_CONCEPT_ART_PROVIDERS } from "@/lib/auth/serverAuth";

export async function GET() {
  return NextResponse.json({
    mode: "byok",
    aiConnected: false,
    providerName: "VELLUM Demo Engine",
    isDemo: true,
    supportedProviders: ALLOWED_PIPELINE_PROVIDERS,
    supportedConceptArtProviders: ALLOWED_CONCEPT_ART_PROVIDERS,
  });
}
