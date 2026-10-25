# 05. Strategic Recommendation & First-Week Execution Roadmap

## The Top Pick: **AshaSanghi**
### *(Ambient Frontline Clinical Intelligence & Offline FHIR Agent for ASHA/ANM Workers)*

```
       ┌────────────────────────────────────────────────────────┐
       │             Vernacular Consultation Audio              │
       │           (Kannada / Hindi / Tamil / Telugu)           │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │            Streaming Vernacular ASR Pipeline           │
       │    (On-device Silero VAD + Groq Whisper / IndicWhisper) │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Unsloth Fine-Tuned Gemma-2-2B              │
       │     (Clinical Entity & Symptom Extractor to Pydantic)   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
       ┌───────────────────────────┐ ┌──────────────────────────┐
       │  Deterministic IMNCI Tree │ │  ABDM HL7 FHIR R4 Engine │
       │  (Rule-based Triage Alert)│ │  (Encounter/Observation) │
       └─────────────┬─────────────┘ └───────────┬──────────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Offline SQLite Sync ──► Supabase Cloud Backup       │
       │        (React Native / Expo Field-Ready Mobile APK)     │
       └────────────────────────────────────────────────────────┘
```

---

## 1. Why AshaSanghi Is the Undisputed Flagship

### A. Perfect Alignment with Your Existing Skills & Free Compute
* **Unsloth Fine-Tuning on Kaggle T4:** You have direct experience with Unsloth and Gemma/Llama. Fine-tuning a 2B parameter model (Gemma-2-2B or Llama-3.2-3B) with QLoRA to output structured clinical Pydantic schemas takes under 45 minutes on a single free Kaggle T4 GPU.
* **React Native / Expo & Supabase:** You already possess full-stack mobile skills. Frontline health apps demand an offline-first mobile client (React Native + local SQLite) that caches records in remote villages and syncs with Supabase when cellular connectivity is restored.
* **Free API Tiers:** Fast transcription uses Groq’s free tier (Whisper-large-v3-turbo processes 30 seconds of audio in <400ms at zero cost), with IndicWhisper as an offline fallback.

### B. Unmatched Industry Hiring & Funding Relevance
* **Ambient Clinical AI Is the Highest-Valued Vertical AI Sector:** Companies like **Abridge** (valued at >$850M), **Ambience Healthcare**, and **Microsoft DAX Copilot** have proven that automated ambient clinical scribing is among the most commercially viable AI business models.
* **Hiring Signal:** Engineering teams at healthcare labs, health-tech startups, and foundation model teams aggressively hire engineers who understand **structured schema enforcement**, **HL7 FHIR R4 interoperability**, and **deterministic safety boundaries**. This is not a chatbot; it is a clinical data pipeline.

### C. Exceptional Public Profile & Grant Potential
* **FOSS United Grants & Zerodha FLOSS/Fund:** FOSS United actively funds digital public goods that interface with Indian Digital Public Infrastructure (DPI). AshaSanghi directly targets the National Health Authority’s **Ayushman Bharat Digital Mission (ABDM)**. A working prototype is an immediate contender for a ₹1,00,000–₹3,00,000 FOSS United grant and a speaking slot at **IndiaFOSS** in Bengaluru.
* **National Impact:** Over 1 million ASHA workers perform the most grueling, uncompensated digital data entry in the country. Solving this problem gives your work immediate moral and practical credibility.

---

## 2. The Runner-Up: **CrisisGraph (JalRakshak)**
### *(Multi-Agent Urban Flood & Disaster Situational Awareness Graph)*

* **Why It’s Compelling:**
  * Living in Bengaluru, urban flooding is an immediate, visible challenge.
  * Combines cutting-edge multi-agent architecture (LangGraph) with geospatial satellite intelligence (Copernicus Sentinel-1 SAR) and real-time social SOS stream processing.
* **Why It Placed Second:**
  * Satellite SAR data pipelines (Google Earth Engine, Sentinel Hub) have steeper learning curves for a solo student and can be tricky to evaluate deterministically compared to clinical guidelines.
  * Field adoption requires municipal clearance (BBMP, NDRF), whereas health worker tools can be tested directly with local clinics, PHCs, or health NGOs.

---

## 3. Concrete First-Week Execution Roadmap for AshaSanghi

Here is your exact, day-by-day sprint plan for Week 1 to establish the technical foundation without spending a single rupee:

### **Day 1: Ground Truth & Clinical Protocol Acquisition**
* **Tasks:**
  1. Download the official Indian Ministry of Health & Family Welfare / WHO **IMNCI (Integrated Management of Neonatal and Childhood Illness)** guidelines for young infants and children (0–5 years) and maternal triage protocols.
  2. Map out the top 5 high-risk triage conditions:
     - *Maternal:* Pre-eclampsia (elevated BP + headache/vision blur), postpartum hemorrhage, severe anemia.
     - *Neonatal/Child:* Severe pneumonia (chest indrawing + fast breathing), severe dehydration (lethargy + sunken eyes), high fever.
  3. Formulate the deterministic triage rules as a clean Python dictionary/decision-tree module (`triage_rules.py`).

### **Day 2: ABDM FHIR R4 Schema Definition**
* **Tasks:**
  1. Sign up on the [ABDM Developer Sandbox](https://sandbox.abdm.gov.in/) and download the NRCeS FHIR R4 profile specifications.
  2. Implement strict Pydantic schemas in Python for:
     - `PatientDemographics` (Age, gender, ABHA address).
     - `ClinicalObservation` (Vitals: systolic/diastolic BP, temperature, respiratory rate).
     - `IMNCISymptom` (Cough duration, vomiting, convulsions).
     - `FHIRBundle` (HL7 FHIR R4 compliant `Encounter` + `Observation` JSON output).

### **Day 3: Synthetic Consultation Dataset Generation**
* **Tasks:**
  1. Write a generation script using Gemini 2.0 Flash / Groq to create 150 realistic bilingual consultation dialogues:
     - 50 in **Kannada + English** (typical rural Karnataka ASHA dialogue).
     - 50 in **Hindi + English**.
     - 50 in **Tamil/Telugu + English**.
  2. Ensure 40% represent healthy/routine checkups, 40% represent moderate illness, and 20% represent acute emergency red flags.
  3. Pair each dialogue with its ground-truth Pydantic JSON extraction and expected IMNCI triage alert. Split into 100 train / 50 test.

### **Day 4: Unsloth Fine-Tuning Setup on Kaggle**
* **Tasks:**
  1. Spin up a free Kaggle Notebook with a GPU T4 x2 instance.
  2. Load `unsloth/gemma-2-2b-it` or `unsloth/Llama-3.2-3B-Instruct` in 4-bit precision.
  3. Format the 100 training dialogues into Alpaca/ChatML prompt templates where the input is the messy doctor-patient transcript and the output is the exact Pydantic JSON string.
  4. Run LoRA fine-tuning for 3 epochs using Unsloth (takes ~30–40 minutes on Kaggle T4). Save LoRA adapters to Hugging Face Hub (private or public).

### **Day 5: Verification & Evaluation Pipeline (DeepEval / Pytest)**
* **Tasks:**
  1. Write an evaluation harness (`tests/eval_extraction.py`) evaluating the fine-tuned model against the 50 held-out test transcripts.
  2. Measure:
     - **JSON Validity Rate:** Must be 100% (using Pydantic validation).
     - **Critical Entity Recall:** Accuracy in detecting high-risk symptoms (must achieve 100% recall on convulsions, chest indrawing, high BP).
     - **Inference Latency:** Measure token generation speed on Groq and locally.

### **Day 6: Mobile Client Architecture (React Native / Expo)**
* **Tasks:**
  1. Initialize an Expo React Native TypeScript project (`npx create-expo-app asha-sanghi -t expo-template-blank-typescript`).
  2. Install `expo-av` (audio recording) and `expo-sqlite` (offline storage).
  3. Design an ultra-minimal, high-contrast mobile interface tailored for field health workers:
     - Large microphone button: *Tap to Record Consultation*.
     - Real-time animated audio visualizer.
     - Red/Yellow/Green triage summary card appearing upon consultation completion.
     - Offline cache indicator ("3 consultations queued for sync").

### **Day 7: End-to-End Pipeline Integration & Repository Launch**
* **Tasks:**
  1. Connect mobile app audio recording $\rightarrow$ send audio to Groq Whisper API endpoint $\rightarrow$ pass transcript to fine-tuned SLM $\rightarrow$ run deterministic IMNCI triage $\rightarrow$ render FHIR JSON and clinical alert on mobile screen.
  2. Initialize public GitHub repository with an exceptional README:
     - Architecture diagram.
     - Video demo or animated GIF showing voice-to-FHIR in Kannada.
     - Evaluation metrics table.
     - Attribution to ABDM and WHO IMNCI standards.
  3. Post progress update on LinkedIn / X tagging FOSS United and AI4Bharat community members.
