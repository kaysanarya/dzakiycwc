# HARVIE AI Agent — Product Photography Director

> **Core Philosophy:**
> 
> **PRODUCT = LOCKED**  
> **PHOTOGRAPHY = GENERATIVE**  
>
> The AI may creatively modify photography characteristics (*lighting, shadows, backgrounds, camera angle, composition, framing, environment, presentation*), but it must preserve the physical identity of the uploaded product as much as the selected AI/image-generation provider technically allows.

---

## 🌟 Overview

HARVIE is a production-quality AI-powered commercial product photography studio web application.

```
USER PRODUCT PHOTO
        ↓
PRODUCT ANALYSIS
        ↓
PRODUCT BLUEPRINT
        ↓
PHOTOGRAPHY DIRECTION
        ↓
PRODUCT LOCK
        ↓
AI IMAGE GENERATION
        ↓
VISUAL VALIDATION
        ↓
REGENERATE IF FAILED
        ↓
FINAL PRODUCT PHOTOS
```

### Key Differentiators:
- **Product Identity Preservation:** Not generic image generation. We lock the silhouette, proportions, textures, stitching, hardware, and outsole/heel specifications.
- **Reference Images Influence Direction Only:** Photo references describe lighting, background, and mood. Product geometry is never borrowed from references.
- **Footwear Heel Lock:** Dedicated constraints for footwear elevation, heel shape, pitch angle, thickness, and front sole welt.
- **Dual Operational Modes:**
  1. **Real AI Mode:** Powered by Google Gemini / OpenAI vision models, Imagen / DALL-E, and visual validation audits.
  2. **Demo Mode:** Fully functional out-of-the-box when AI credentials are not connected, with authentic high-fidelity demo assets, realistic blueprints, and genuine consistency estimation.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode, zero `any`)
- **Styling:** Tailwind CSS (warm neutral studio aesthetic, Inter typography)
- **Icons:** Lucide React
- **Database & Storage:** Supabase PostgreSQL & Supabase Storage (with graceful zero-config local fallback)
- **AI Abstraction Layer:** `/lib/ai/` provider interface (`GeminiAIProvider`, `DemoAIProvider`, interchangeable factory)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn

### 2. Installation
```bash
git clone <your-repo>
cd dzakiycwc
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
# AI Provider Credentials (Leave blank for DEMO MODE)
AI_API_KEY=your_gemini_or_ai_api_key
AI_VISION_MODEL=gemini-2.0-flash
AI_IMAGE_MODEL=imagen-3.0-generate-002
AI_VALIDATION_MODEL=gemini-2.0-flash

# Optional: Supabase (Leave blank for automatic local demo persistence)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Building for Production
```bash
npm run build
npm run start
```

---

## 💎 Operating Modes

### 1. Real AI Mode
When `AI_API_KEY` (or `GEMINI_API_KEY` / `OPENAI_API_KEY`) is configured in `.env.local`:
- The header displays **REAL AI MODE CONNECTED** (green badge).
- Vision models inspect the uploaded raw images to construct the detailed JSON blueprint.
- Generation models execute structured prompts with strict geometry locks and negative prompts.
- Validation models audit the generated photo against the original blueprint constraints.

### 2. Demo Mode
When credentials are omitted:
- The header prominently displays:
  ```
  DEMO MODE — AI API NOT CONNECTED
  ```
- The application is 100% operational with realistic interactive demo data.
- Click **"Load Demo Product"** to load the pre-analyzed luxury ivory sculpted heeled mule, complete with 3 multi-angle sources, reference studio lighting, structured blueprint, and 4 commercial outputs.
- Validation notes clearly indicate fallback status; demo output is never misrepresented as live AI generation.

---

## 📐 AI Provider Architecture

The AI layer is abstracted in `/lib/ai/`:

```
/lib/ai/
  ├── provider.ts          # AIProvider generic interface
  ├── factory.ts           # Provider selector (Gemini vs Demo)
  ├── demoProvider.ts      # Deterministic, realistic demo studio provider
  ├── geminiProvider.ts    # Google Gemini Vision + Imagen provider
  ├── analyzeProduct.ts    # Multimodal image analysis wrapper
  ├── buildBlueprint.ts    # Structured blueprint constructor
  ├── analyzeReference.ts  # Reference lighting/mood extraction
  ├── generateImages.ts    # Multi-angle commercial generation
  └── validateImages.ts    # Post-generation consistency audit
```

To add another provider (e.g., Replicate, Fal.ai, or custom model):
1. Implement the `AIProvider` interface from `/lib/ai/provider.ts`.
2. Add your provider instantiation in `/lib/ai/factory.ts`.

---

## 🗄️ Database & Storage Setup (Supabase)

To connect Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Under **Storage**, ensure the following buckets exist:
   - `product-sources` (private)
   - `references` (private)
   - `generated` (public)
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

*Note: If Supabase credentials are not provided, HARVIE automatically defaults to local in-memory storage, preserving history in `localStorage`.*

---

## ⚠️ Known Limitations

1. **Pixel-Perfect Identity vs. Generative Diffusion:**  
   Current commercial generative models (e.g. Imagen, DALL-E, Flux) synthesize images through diffusion latent spaces. Small micro-textures, engraved serial numbers, or complex typography may exhibit minor variations. HARVIE mitigates this through structured blueprint constraints, strict negative prompts, and visual validation scores ("AI Consistency Estimate").
2. **Visual Validation Fallback:**  
   If a visual validation API call encounters a rate limit or timeout, the engine uses a structured fallback heuristic to ensure the user's session remains uninterrupted.
3. **Marketplace Guidelines:**  
   Marketplace presets (Shopee, Tokopedia, TikTok Shop, Instagram, Amazon) provide standard aspect ratios, scale, and safe margin guides; always confirm current seller tier policies on the respective platforms.
