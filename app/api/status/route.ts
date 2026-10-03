import { NextRequest, NextResponse } from "next/server";
import { resolveServerProvider, ALLOWED_PIPELINE_PROVIDERS, ALLOWED_CONCEPT_ART_PROVIDERS } from "@/lib/auth/serverAuth";
import { checkAndConsumeDemoQuota } from "@/lib/auth/demoQuota";

export async function GET(req: NextRequest) {
  const provider = resolveServerProvider();
  const isDemo = provider === "demo";
  const quota = await checkAndConsumeDemoQuota(req, 0);

  const res = NextResponse.json({
    mode: isDemo ? "demo" : "server",
    aiConnected: !isDemo,
    providerName: isDemo ? "VELLUM Studio Engine" : provider.toUpperCase(),
    isDemo,
    demoRemaining: quota.remaining,
    demoLimit: quota.limit,
    supportedProviders: ALLOWED_PIPELINE_PROVIDERS,
    supportedConceptArtProviders: ALLOWED_CONCEPT_ART_PROVIDERS,
  });

  res.headers.set("x-demo-remaining", String(quota.remaining));
  return res;
}
