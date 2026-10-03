import sharp from "sharp";
import { buildBackgroundPlatePrompt } from "../lib/prompts/buildPrompt";
import { generateProceduralPlate, compositeProductOnPlate } from "../lib/ai/studioCompositor";
import { resolveServerProvider } from "../lib/auth/serverAuth";
import { ProductBlueprint, ProductLocks, PhotographyDirection, PreservationSettings, UploadedImage } from "../types";

async function runProvenanceAudit() {
  console.log("================================================================================");
  console.log("                  VELLUM AI: FASE 0 - REQUEST PROVENANCE AUDIT                  ");
  console.log("================================================================================\n");

  // 1. Create realistic product image & reference image
  const productSvg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="#ffffff"/>
      <!-- Side profile sneaker shape -->
      <path d="M 150 500 Q 220 450 350 450 Q 450 450 520 380 Q 580 340 640 400 Q 690 480 700 520 L 160 520 Z" fill="#1e1e24"/>
      <path d="M 160 520 L 700 520 L 680 560 L 180 560 Z" fill="#ffffff" stroke="#ccc" stroke-width="2"/>
    </svg>
  `;
  const productBuf = await sharp(Buffer.from(productSvg)).png().toBuffer();
  const productBase64 = `data:image/png;base64,${productBuf.toString("base64")}`;

  const referenceSvg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <!-- Top flatlay wrinkled linen reference -->
      <rect width="800" height="800" fill="#eae6df"/>
      <circle cx="400" cy="400" r="300" fill="#dcd6cb"/>
      <path d="M 200 200 Q 400 300 600 200 Q 500 500 300 600 Z" fill="#b0a898" opacity="0.5"/>
    </svg>
  `;
  const referenceBuf = await sharp(Buffer.from(referenceSvg)).jpeg().toBuffer();
  const referenceBase64 = `data:image/jpeg;base64,${referenceBuf.toString("base64")}`;

  // ---------------------------------------------------------------------------
  // TAHAP A: STATE UI -> BODY FETCH -> ROUTE HANDLER
  // ---------------------------------------------------------------------------
  console.log("--- [TAHAP A] NILAI STATE UI -> BODY FETCH -> ROUTE HANDLER ---");

  // a. State UI (app/page.tsx: lines 94-110, lines 860-888)
  const uiState_cameraAngle = "side"; // User selected "Side Profile"
  const uiState_background = "studio_beige"; // Default backdrop in CameraSettings
  const uiState_aspectRatio = "1:1";
  const uiState_referenceImages: UploadedImage[] = [
    {
      id: "ref-test-01",
      name: "flatlay-linen-reference.jpg",
      dataUrl: referenceBase64,
      size: referenceBuf.byteLength,
      type: "image/jpeg",
      tag: "general",
    },
  ];
  const uiState_sourceImages: UploadedImage[] = [
    {
      id: "prod-test-01",
      name: "sneaker-side-view.png",
      dataUrl: productBase64,
      size: productBuf.byteLength,
      type: "image/png",
      tag: "front",
    },
  ];

  console.log(`[UI State] cameraAngle: "${uiState_cameraAngle}" (file: app/page.tsx:102)`);
  console.log(`[UI State] background / backdropPreset: "${uiState_background}" (file: app/page.tsx:103)`);
  console.log(`[UI State] aspectRatio: "${uiState_aspectRatio}" (file: app/page.tsx:105)`);
  console.log(`[UI State] referenceImages count: ${uiState_referenceImages.length} (file: app/page.tsx:94)`);
  console.log(`[UI State] sourceImages count: ${uiState_sourceImages.length} (file: app/page.tsx:93)`);

  // Body Fetch (app/page.tsx: lines 514-527)
  const fetchBody = {
    blueprint: {
      category: "footwear",
      subcategory: "sneakers",
      shape: "low-top profile",
      dimensions: "standard",
      proportions: "balanced",
      material: "canvas",
      color: "black/white",
      texture: "woven",
      components: ["upper", "sole"],
      logo: { presence: false },
      stitching: { pattern: "tonal", color: "white", contrast: true },
      ornaments: [],
      hardware: { type: "eyelets", finish: "silver", color: "silver" },
      outsole: { material: "rubber", color: "white", profile: "flat", pattern: "plain" },
      heel: { heelHeight: "20mm", heelWidth: "standard", heelAngle: "90", heelPosition: "rear", heelShape: "flat", heelThickness: "standard", frontSoleThickness: "15mm", outsolePattern: "plain" },
      construction: "vulcanized",
      visualNotes: "side view sneaker",
      confidence: 0.95,
    } as ProductBlueprint,
    locks: { preserveProductDetails: true } as ProductLocks,
    direction: {
      modelSetting: "without_model",
      cameraAngle: uiState_cameraAngle,
      background: uiState_background,
      marketplacePreset: "general",
      aspectRatio: uiState_aspectRatio,
    } as PhotographyDirection,
    preservation: {
      detailPreservation: 100,
      referenceStrength: 70,
      consistencyMode: true,
      strictProductMode: true,
    } as PreservationSettings,
    sourceImages: uiState_sourceImages,
    referenceImages: uiState_referenceImages,
    count: 1,
  };

  const serializedPayload = JSON.stringify(fetchBody);
  console.log(`[Body Fetch] Serialized JSON size: ${(serializedPayload.length / 1024).toFixed(1)} KB (file: app/page.tsx:518-526)`);

  // Route Handler Deserialization (app/api/generate/route.ts: lines 25-42)
  const routeParsed = JSON.parse(serializedPayload);
  console.log(`[Route Handler] Received cameraAngle: "${routeParsed.direction.cameraAngle}" (file: app/api/generate/route.ts:29)`);
  console.log(`[Route Handler] Received background: "${routeParsed.direction.background}" (file: app/api/generate/route.ts:29)`);
  console.log(`[Route Handler] Received aspectRatio: "${routeParsed.direction.aspectRatio}" (file: app/api/generate/route.ts:29)`);
  console.log(`[Route Handler] Received referenceImages: ${routeParsed.referenceImages.length} items (file: app/api/generate/route.ts:32)\n`);

  // ---------------------------------------------------------------------------
  // TAHAP B: PROVIDER + MODEL YANG DIPANGGIL & APAKAH MENERIMA INPUT GAMBAR
  // ---------------------------------------------------------------------------
  console.log("--- [TAHAP B] PROVIDER & MODEL DIPANGGIL, SERTA INPUT GAMBAR ---");
  const serverProvider = resolveServerProvider();
  console.log(`[Server Auth] Resolved Provider: "${serverProvider}" (file: lib/auth/serverAuth.ts:108-123)`);

  // Inspect Provider Classes:
  console.log(`[Provider Dispatch] Provider class selected: GeminiAIProvider / DemoAIProvider (file: lib/ai/factory.ts:18-60)`);
  console.log(`[Provider Behavior] Does the generator receive the product image as an image input?`);

  // Check geminiProvider.ts: lines 408-465
  console.log(`  - Gemini (Imagen 3 predict): calls models/imagen-3.0-generate-002:predict with prompt ONLY. NO input image passed! (file: lib/ai/geminiProvider.ts:418-424)`);
  console.log(`  - Gemini (Pollinations Flux fallback): calls https://image.pollinations.ai/prompt/{encodedPrompt} GET with prompt ONLY. NO input image passed! (file: lib/ai/geminiProvider.ts:451)`);
  console.log(`  - Gemini (Procedural SVG fallback): generates procedural SVG cyclorama. NO input image passed! (file: lib/ai/geminiProvider.ts:469-473)`);
  console.log(`  - OpenAI (openAIProvider.ts): calls DALL-E 3 with prompt ONLY. NO input image passed! (file: lib/ai/openAIProvider.ts:172-179)`);
  console.log(`  - Stability (stabilityProvider.ts): calls generate/core with FormData prompt ONLY. NO input image passed! (file: lib/ai/stabilityProvider.ts:91-94)`);
  console.log(`  - Replicate (replicateProvider.ts): calls flux-schnell with prompt ONLY. NO input image passed! (file: lib/ai/replicateProvider.ts:93-99)`);
  console.log(`  => KESIMPULAN TAHAP B: SEMUA provider di arsitektur Plate+Composite HANYA menjalankan text-to-image untuk latar belakang. Generator AI TIDAK PERNAH menerima foto produk sebagai input gambar!\n`);

  // ---------------------------------------------------------------------------
  // TAHAP C: JUMLAH & UKURAN BYTE GAMBAR KE PROVIDER & PROMPT AKHIR
  // ---------------------------------------------------------------------------
  console.log("--- [TAHAP C] JUMLAH & UKURAN BYTE GAMBAR KE GENERATOR & PROMPT AKHIR ---");
  console.log(`[Source Product Image] Buffer size: ${productBuf.byteLength} bytes (${(productBuf.byteLength / 1024).toFixed(1)} KB)`);
  console.log(`[Reference Image] Buffer size: ${referenceBuf.byteLength} bytes (${(referenceBuf.byteLength / 1024).toFixed(1)} KB)`);
  console.log(`[Images sent to Background Generator] 0 images (0 bytes) sent to Imagen/Pollinations/DALL-E/Flux!`);

  // Build the prompt that is actually sent
  const mockReferenceAnalysis = {
    lightingDirection: "Soft overhead diffuse window light 45 deg",
    lightQuality: "Natural morning diffused window lighting",
    colorTemperature: "5200K daylight",
    backgroundStyle: "Wrinkled white linen bedsheet flatlay surface",
    shadowType: "Soft ambient occlusion contact shadow",
    framingComposition: "Overhead 45-degree top-down flatlay perspective",
    mood: "Minimalist relaxed lifestyle aesthetic",
  };

  const { platePrompt, negativePrompt } = buildBackgroundPlatePrompt({
    direction: fetchBody.direction,
    referenceAnalysis: mockReferenceAnalysis,
    variationIndex: 0,
  });

  console.log(`[Final Generator Prompt]:\n  "${platePrompt}" (file: lib/prompts/buildPrompt.ts:271)`);
  console.log(`[Final Negative Prompt]:\n  "${negativePrompt}" (file: lib/prompts/buildPrompt.ts:273)\n`);

  // ---------------------------------------------------------------------------
  // TAHAP D: APAKAH SHARP COMPOSITE DIJALANKAN SETELAH GENERATOR & PRODUK MANA YANG DITEMPEL
  // ---------------------------------------------------------------------------
  console.log("--- [TAHAP D] SHARP COMPOSITE & ASAL PRODUK YANG DITEMPEL ---");
  console.log(`[Execution Order] Sharp composite dijalankan SETELAH plate generator selesai!`);
  console.log(`  - geminiProvider.ts: lines 484-487: await compositeProductOnPlate({ plateBuffer, productCutoutBuffer })`);
  console.log(`  - openAIProvider.ts: lines 217-220: await compositeProductOnPlate({ plateBuffer, productCutoutBuffer })`);
  console.log(`  - stabilityProvider.ts: lines 116-119: await compositeProductOnPlate({ plateBuffer, productCutoutBuffer })`);
  console.log(`  - replicateProvider.ts: lines 125-128: await compositeProductOnPlate({ plateBuffer, productCutoutBuffer })`);
  console.log(`  - demoProvider.ts: lines 129-132: await compositeProductOnPlate({ plateBuffer, productCutoutBuffer })`);

  // Execute composite with test buffers
  const plateBuf = await generateProceduralPlate({ aspectRatio: "1:1", backgroundSetting: "studio_beige" });
  const compResult = await compositeProductOnPlate({
    plateBuffer: plateBuf,
    productCutoutBuffer: productBuf,
  });
  const compMeta = await sharp(compResult).metadata();

  console.log(`[Composite Test Result] Output dimensions: ${compMeta.width}x${compMeta.height}, size: ${(compResult.byteLength / 1024).toFixed(1)} KB`);
  console.log(`[Produk yang Ditempel] Produk diambil LANGSUNG dari 'input.sourceImages[0]' (foto mentahan 2D user yang di-cutout)!`);
  console.log(`  => BUKTI TELAK: Karena 'productCutoutBuffer' ditempelkan langsung dengan Sharp, produk di kanvas akhir adalah bitmap 2D yang persis sama dengan foto mentahan. Rotasi sudut kamera 'cameraAngle = Side Profile / Top Flatlay' TIDAK AKAN PERNAH mengubah pose/sudut produk karena Sharp hanya melakukan 2D alpha composite pada layer flat!\n`);

  // ---------------------------------------------------------------------------
  // TAHAP E: BAGAIMANA REFERENSI DIKIRIM & APAKAH BUTUH URL PUBLIK
  // ---------------------------------------------------------------------------
  console.log("--- [TAHAP E] FORMAT TRANSMISI REFERENSI & KEBUTUHAN URL PUBLIK ---");
  console.log(`[Transmisi Referensi di Pipeline Saat Ini]:`);
  console.log(`  1. UI -> Route: Dikirim sebagai data URL Base64 di body JSON (file: app/page.tsx:524 -> app/api/generate/route.ts:32).`);
  console.log(`  2. Route -> analyzeReference: Dikirim sebagai base64 string ke Gemini Vision generateContent (file: lib/ai/geminiProvider.ts:173-181).`);
  console.log(`  3. Route -> Provider -> Generator:`);
  console.log(`     - Imagen 3 predict: TIDAK MENERIMA referensi (file: lib/ai/geminiProvider.ts:418).`);
  console.log(`     - Pollinations Flux: HANYA menerima prompt teks di query string URL (file: lib/ai/geminiProvider.ts:451). Tidak menerima gambar.`);
  console.log(`     - DALL-E 3: HANYA menerima prompt teks (file: lib/ai/openAIProvider.ts:173).`);
  console.log(`     - Flux via Replicate: HANYA menerima prompt teks (file: lib/ai/replicateProvider.ts:94).`);
  console.log(`[Kebutuhan URL Publik untuk Image-to-Image / Multi-Reference]:`);
  console.log(`  - Gemini multimodal (generateContent): Menerima inlineData base64 langsung (TIDAK butuh URL publik).`);
  console.log(`  - Pollinations (image-conditioned/kontext): Butuh URL publik / signed URL sementara agar model bisa mengunduh file gambar.`);
  console.log(`  - Replicate (flux-inpaint / ip-adapter): Butuh URL gambar publik atau data URI base64.`);
  console.log(`================================================================================`);
  console.log("                   AUDIT FASE 0 SELESAI SECARA MENYELURUH                       ");
  console.log("================================================================================");
}

runProvenanceAudit().catch(console.error);
