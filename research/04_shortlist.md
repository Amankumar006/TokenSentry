# 04. Top 7 Flagship Agentic AI Project Shortlist

This shortlist presents 7 rigorous, evidence-backed open-source project ideas designed for a third-year AI/ML student in Bengaluru, India. Each project is tailored to the student's existing stack (Unsloth/TRL fine-tuning, Gemma/Llama, ReAct agents, React Native/Expo, Supabase, Groq/Gemini free-tier APIs) and operates strictly on free compute (Kaggle T4 GPUs, Colab, free-tier services). None clone past work (legal assistant, general Indian LLM, planner app).

---

## 1. AshaSanghi (Ambient Frontline Clinical Intelligence & FHIR Agent)

### A. Problem & Target Users
* **Target Users:** 1,000,000+ Accredited Social Health Activists (ASHAs) and 200,000 Auxiliary Nurse Midwives (ANMs) across India.
* **The Problem:** ASHAs spend 3–4 hours each evening transcribing handwritten paper records into cumbersome government web portals. During home consultations, they often miss subtle clinical warning signs (e.g., pre-eclampsia, postpartum sepsis, severe dehydration) governed by the Indian Government's **IMNCI (Integrated Management of Neonatal and Childhood Illness)** protocol. Furthermore, the Ayushman Bharat Digital Mission (ABDM) mandates structured **HL7 FHIR R4** electronic records, which zero current field tools produce automatically.

### B. Agentic Architecture
* **Tools:**
  1. `transcribe_vernacular_audio()`: Offline Whisper/IndicConformer streaming ASR.
  2. `imnci_triage_validator()`: Deterministic clinical decision tree verifying symptoms against WHO/Govt of India guidelines.
  3. `abdm_fhir_serializer()`: Pydantic/Instructor schema generator formatting symptoms, vitals, and diagnoses into valid HL7 FHIR R4 `Encounter` and `Observation` bundles.
  4. `sqlite_offline_store()`: Encrypted local SQLite persistence with background sync to Supabase when connectivity resumes.
* **Memory:**
  * *Session Memory:* Multi-turn buffer tracking patient vitals across a single home visit.
  * *Entity Memory:* Patient historical visits, gestational age, and immunization schedules synced to local SQLite.
* **Planning (Orchestrator-Worker Pattern):**
  * *Step 1 (Ingest):* Stream audio $\rightarrow$ transcribe to Kannada/Hindi $\rightarrow$ translate to clinical clinical English notes via fast edge model.
  * *Step 2 (Extraction Worker):* Extract structured clinical entities (body temperature, fetal movements, blood pressure, cough duration).
  * *Step 3 (Safety & Triage Worker):* Evaluate extracted symptoms against deterministic IMNCI safety rules. If red flags are detected (e.g., systolic BP > 140 with headache $\rightarrow$ pre-eclampsia risk), trigger an immediate voice warning.
  * *Step 4 (ABDM Serializer Worker):* Compile final records into HL7 FHIR JSON and stage for ABDM upload.
* **Evals & Guardrails:**
  * Metric: **Entity Extraction F1 Score** and **IMNCI Clinical Sensitivity** (Target: 100% sensitivity on red-flag conditions).
  * Guardrails: Hardcoded deterministic Python safety overrides—the LLM is never allowed to override a rule-based triage referral.

### C. Tech Stack
* **Fine-Tuned SLM:** Gemma-2-2b-it or Llama-3.2-3B fine-tuned via **Unsloth (QLoRA)** on Kaggle T4 to output strictly validated Pydantic JSON schemas from noisy clinical vernacular transcripts.
* **Client App:** React Native / Expo (offline-first mobile PWA/Android APK).
* **Backend & Database:** Supabase (PostgreSQL + Auth + Storage), edge functions on Supabase.
* **Speech & Cloud Fast Inference:** Groq Whisper-large-v3-turbo (online) / quantized on-device Silero VAD + IndicWhisper (offline fallback).

### D. Data Sources & Free APIs
* [WHO/UNICEF IMNCI Clinical Guidelines](https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/integrated-management-of-childhood-illness) (Open PDF ground truth).
* [ABDM Sandbox & NRCeS FHIR R4 Profiles](https://sandbox.abdm.gov.in/) (Free official developer sandbox).
* [AI4Bharat IndicVoices / IndicWhisper](https://ai4bharat.iitm.ac.in/) (Open weights on Hugging Face).

### E. 8-Week MVP Implementation Plan
* **Week 1:** Download IMNCI manuals; construct synthetic evaluation dataset of 200 bilingual (Kannada/Hindi/English) maternal-child consultation transcripts with ground-truth FHIR JSON and triage flags.
* **Week 2:** Fine-tune Gemma-2-2B on Kaggle T4 using Unsloth with LoRA on the synthetic clinical extraction dataset. Achieve >95% JSON schema compliance.
* **Week 3:** Build deterministic IMNCI validation engine in Python; implement Pydantic models for FHIR R4 `Encounter`, `Condition`, `Observation`.
* **Week 4:** Build React Native / Expo mobile interface with one-tap vernacular voice recording and offline SQLite storage.
* **Week 5:** Connect Groq Whisper API for speech-to-text; integrate fine-tuned SLM via FastAPI backend (hosted on Hugging Face Spaces free tier).
* **Week 6:** Implement ABDM Sandbox M1/M2 API connectors (mocking ABHA ID generation and encrypted FHIR bundle staging).
* **Week 7:** Run DeepEval evaluation suite measuring extraction accuracy, clinical safety violations (target: 0), and latency (<3s on mobile).
* **Week 8:** Open-source release: comprehensive GitHub README, Loom video walkthrough in Kannada and English, submit grant application to FOSS United.

### F. Open-Source Strategy & Traction
* Target FOSS United Grant (₹1,00,000–₹3,00,000).
* Publish model weights on Hugging Face (`AshaSanghi-Gemma-2B-FHIR`).
* Pitch to National Health Authority (NHA) ABDM innovation challenges and health-tech non-profits (Khushi Baby, Jan Swasthya Sahyog).

### G. Risks & Guardrails
* *Clinical Misdiagnosis Risk:* Mitigated by designing the system as an **ambient scribe and referral triage alert**, not a diagnostic prescriber. It never suggests medications—only documents observations and flags urgent Primary Health Centre (PHC) referrals based on deterministic IMNCI trees.

### H. Evaluation Scores (1–10)
* **Societal Impact:** 10/10
* **Industry Relevance:** 9.5/10 (Clinical ambient documentation is among the highest-funded AI categories—Abridge, Scribe, Ambience).
* **Feasibility:** 8.5/10
* **Differentiation:** 10/10 (First offline-first, vernacular FHIR agent for frontline health).
* **Profile Value:** 10/10
* **Total Score:** **48 / 50**

---

## 2. KisanOS: AgriOrchestrator (Deterministic Multi-Agent Farm Operations & Mandi Arbitrage Engine)

### A. Problem & Target Users
* **Target Users:** 140M smallholder farmers in India and agricultural extension workers.
* **The Problem:** Farmers receive fragmented, ungrounded advice. They have to navigate isolated apps for weather forecasts, mandi prices, and pest diagnosis. Most critically, commercial pesticide shops encourage chemical overdosing. Farmers lack an integrated agent that runs multi-variable economic equations: e.g., determining whether expected mandi price surges justify harvest transport costs today versus waiting out a forecasted 48-hour rain spell.

### B. Agentic Architecture
* **Tools:**
  1. `get_mandi_arrivals_and_prices(commodity, district)`: Fetches live daily APMC data from Open Government Data (`data.gov.in`).
  2. `get_weather_forecast(lat, lon)`: Fetches 7-day hourly rain/wind/humidity from Open-Meteo API.
  3. `detect_pest_and_damage(image_base64)`: Runs fine-tuned vision model to count pest severity (economic injury level).
  4. `calculate_chemical_spray_window()`: Deterministic calculator cross-referencing rainfall timing with Central Insecticide Board & Registration Committee (CIBRC) approved dosage rates.
* **Memory:** Farm Profile (acreage, soil pH, sowing date, previous pesticide applications stored in Supabase).
* **Planning (ReAct + Constrained Verification):**
  * Agent checks pest photo $\rightarrow$ identifies fall armyworm/bollworm $\rightarrow$ queries economic threshold $\rightarrow$ checks 3-day precipitation forecast $\rightarrow$ queries 5 closest APMC mandi price trends $\rightarrow$ outputs mathematical harvest/spray decision.
* **Evals & Guardrails:**
  * Guardrails: Zero tolerance for chemical dosage hallucinations. All chemical recommendations are constrained via lookup tables against official CIBRC manuals.

### C. Tech Stack
* **Fine-Tuned SLM:** Llama-3.2-3B or Qwen-2.5-3B fine-tuned with Unsloth on Indian agronomy Q&A and tool-calling trajectories.
* **Frontend:** React Native / Expo with voice note recording in vernacular languages.
* **Backend:** FastAPI, Supabase (pgvector for agronomy manuals, PostgreSQL for user farm telemetry).
* **APIs:** Groq Llama-3.3-70B (for complex multi-tool reasoning), Open-Meteo, data.gov.in Agmarknet API.

### D. Data Sources & Free APIs
* [Data.gov.in Agmarknet Daily APMC Mandi Prices](https://data.gov.in/) (Free API key).
* [Central Insecticide Board & Registration Committee (CIBRC) Major Uses Guidelines](http://ppqs.gov.in/) (Public regulatory records).
* [Wadhwani AI Pest Datasets](https://github.com/WadhwaniAI) & PlantVillage Open Dataset.

### E. 8-Week MVP Implementation Plan
* **Week 1:** Build scrapers and API connectors for Agmarknet Mandi data and Open-Meteo weather feeds; cache them into Supabase.
* **Week 2:** Create structured CIBRC chemical safety lookup table covering top 15 Indian staple crops (paddy, cotton, wheat, tomato, onion, chili).
* **Week 3:** Build multi-agent tool pipeline using LangGraph: Mandi Arbitrage Agent + Weather Risk Agent + Agronomy Agent.
* **Week 4:** Implement pest identification endpoint using Gemini 2.0 Flash / fine-tuned lightweight YOLOv8-nano running on free Hugging Face Spaces.
* **Week 5:** Build React Native mobile app with audio input (Bhashini / Whisper) and clean visual summary cards (not walls of text).
* **Week 6:** Implement Ragas evaluation pipeline: verify that tool arguments match official API specs and dosage calculations have 0% variance from CIBRC manuals.
* **Week 7:** Test with 20 real crop disease scenarios and compare agentic recommendations against agricultural university extension bulletins.
* **Week 8:** GitHub launch, write interactive blog post on LinkedIn, submit to FOSS United and AgTech hackathons.

### F. Open-Source Strategy & Traction
* Release as an open SDK: `pip install kisan-agent` allowing other agri-startups to plug in real-time mandi and weather intelligence.
* Target FOSS United grant and AI4Bharat community showcases.

### G. Risks & Guardrails
* *Risk:* Off-label pesticide recommendation liability. *Mitigation:* Explicit CIBRC database verification; if a crop-chemical combination is not found in the verified registry, the agent strictly refuses to suggest a chemical formulation and refers to local Krishi Vigyan Kendra (KVK).

### H. Evaluation Scores (1–10)
* **Societal Impact:** 9.5/10
* **Industry Relevance:** 8.5/10 (AgTech, supply chain, automated commerce).
* **Feasibility:** 9.0/10
* **Differentiation:** 9.0/10 (Moves beyond chat wrappers to mathematical arbitrage and verified chemical safety).
* **Profile Value:** 9.0/10
* **Total Score:** **45 / 50**

---

## 3. CrisisGraph: JalRakshak (Multi-Agent Urban Flood & Disaster Situational Awareness Graph)

### A. Problem & Target Users
* **Target Users:** Disaster response teams (NDRF, SDRF), municipal corporations (BBMP, BMC), and citizen volunteer relief networks during severe monsoon floods and landslides.
* **The Problem:** In urban disasters (like Bengaluru or Chennai floods), administrative dispatchers drown in chaos: thousands of raw, unstructured SOS messages flood X and WhatsApp, while satellite inundation data (Copernicus Sentinel-1 SAR) and river gauge data remain locked inside scientific portals. First responders waste critical hours rescuing already-evacuated locations or dispatching boats to dry roads.

### B. Agentic Architecture
* **Tools:**
  1. `fetch_sentinel1_flood_polygons(bbox)`: Ingests processed Copernicus Sentinel-1 SAR imagery to identify standing surface water polygons.
  2. `ingest_social_sos_stream(text)`: Extracts geo-coordinates, street landmarks, trapped count, medical urgency, and water level.
  3. `deduplicate_sos_signals()`: Semantic clustering agent matching incoming distress posts against existing incident nodes within a 200m spatial buffer.
  4. `route_rescue_priority(incidents_geojson, flood_polygons)`: Computes priority scores ($P = \text{Vulnerability} \times \text{WaterDepth} \times \text{TimeElapsed}$) and maps safe access corridors.
* **Memory:** Graph-based spatial memory (NetworkX / Supabase PostGIS) maintaining the live state of every reported sector (Pending, Dispatched, Rescued, Inaccessible).
* **Planning (Orchestrator-Workers):**
  * Ingestion Worker parses feeds $\rightarrow$ Verification Worker geocodes landmark against OpenStreetMap Nominatim $\rightarrow$ Spatial Worker cross-references water depth $\rightarrow$ Priority Agent ranks rescue queue.
* **Evals & Guardrails:**
  * Metric: Geocoding accuracy (within 100 meters) and SOS extraction precision.
  * Guardrails: High-severity distress calls (infants, dialyis patients trapped) are flagged with immediate human-in-the-loop audit triggers.

### C. Tech Stack
* **LLM Engine:** Groq Llama-3.3-70B for fast JSON information extraction from messy Indian vernacular SOS texts ("3rd cross near Anjaneya temple under 5 feet water").
* **Geospatial & Vector Database:** Supabase with **PostGIS** extension (spatial indexing, polygon intersections).
* **Frontend:** React Native / Expo map dashboard utilizing MapLibre GL / OpenStreetMap.
* **Satellite Processing:** Google Earth Engine Python API (free academic/research tier) or Open Copernicus SciHub.

### D. Data Sources & Free APIs
* [Google Flood Hub & Forecasting API](https://developers.google.com/flood-forecasting) (Free CC BY 4.0 data).
* [Copernicus Sentinel-1 SAR Open Data](https://browser.dataspace.copernicus.eu/) (Free public radar satellite imagery).
* [OpenStreetMap Nominatim Geocoding API](https://nominatim.openstreetmap.org/) (Free open-source geocoding).

### E. 8-Week MVP Implementation Plan
* **Week 1:** Setup Supabase with PostGIS; build schema for Incidents, FloodPolygons, and EvacuationCenters.
* **Week 2:** Create synthetic benchmark of 500 multilingual Indian disaster SOS posts (Hindi, Kannada, Tamil, English) with annotated ground-truth GPS, entity tags, and severity.
* **Week 3:** Build extraction and deduplication agent using Groq Llama-3.3-70B and LangGraph; achieve >90% extraction F1.
* **Week 4:** Integrate Open-Meteo precipitation alerts and Google Flood Forecasting riverine discharge endpoints.
* **Week 5:** Integrate Sentinel-1 SAR floodwater polygon ingestion pipeline (using Google Earth Engine Python scripts).
* **Week 6:** Build responsive web/mobile dispatch dashboard using React / React Native with interactive MapLibre vector tiles.
* **Week 7:** Benchmark end-to-end pipeline latency (<2 seconds per incoming SOS post) and spatial routing accuracy.
* **Week 8:** Publish open-source repository, create interactive video simulation of the 2022 Bengaluru floods, and present to volunteer civic tech groups (OpenCity Bengaluru).

### F. Open-Source Strategy & Traction
* Open-source under MIT license.
* Submit to FOSS United grants and international disaster-tech hackathons (Call for Code).
* Partner with local civic tech collectives in Bengaluru (DataMeet, OpenCity.in).

### G. Risks & Guardrails
* *Risk:* False-alarm hallucinations sending boats to incorrect locations. *Mitigation:* Multi-source consensus score (requires either 2+ independent crowd reports or 1 crowd report validated by satellite SAR inundation overlay).

### H. Evaluation Scores (1–10)
* **Societal Impact:** 9.2/10
* **Industry Relevance:** 9.0/10 (Spatial intelligence, multi-modal sensor fusion, graph databases).
* **Feasibility:** 8.2/10 (Requires handling geospatial GIS pipelines).
* **Differentiation:** 9.5/10 (First open-source system combining SAR satellite radar with vernacular crowd NLP).
* **Profile Value:** 9.5/10
* **Total Score:** **45.4 / 50**

---

## 4. LekhaMitra (Autonomous MSME GST Reconciliation & Cash-Flow Defense Agent)

### A. Problem & Target Users
* **Target Users:** 63M Indian MSMEs, sole proprietorships, and small accounting firms.
* **The Problem:** MSMEs face two crippling cash-flow barriers:
  1. *Input Tax Credit (ITC) Loss:* Discrepancies between physical purchase bills and GSTR-2B portal data trigger GST penalty notices under Section 73/74.
  2. *Delayed Payments:* Over ₹47,000 crore is trapped in delayed payments. Under Section 15 of the MSMED Act, buyers must settle within 45 days or pay 3x compound bank interest, but MSMEs lack resources to track default dates, compute statutory interest, and draft formal legal notices.

### B. Agentic Architecture
* **Tools:**
  1. `parse_unstructured_invoice(image_or_pdf)`: Multimodal vision extraction (GSTIN, Invoice No, Date, Taxable Value, CGST/SGST/IGST).
  2. `reconcile_gstr2b(purchase_book_json, gstr2b_json)`: Fuzzy matching agent resolving formatting discrepancies (`INV-001` vs `1`).
  3. `compute_msmed_interest(principal, invoice_date, payment_date)`: Deterministic RBI bank rate compound interest calculator.
  4. `generate_section15_legal_notice(vendor_details, defaulted_invoices)`: Generates court-ready PDF legal notice citing Section 15/16 of the MSMED Act.
* **Memory:** Multi-quarter ledger state cached locally in SQLite/Supabase.
* **Planning (Evaluator-Optimizer Pattern):**
  * Parse Invoice $\rightarrow$ Run Deterministic Match $\rightarrow$ Send Discrepancies to Reconciler Agent $\rightarrow$ Second LLM Evaluator grades tax validity $\rightarrow$ Output Reconciliation Schedule + Ready-to-file Samadhaan XML/PDF.
* **Evals & Guardrails:**
  * Arithmetic calculations are executed strictly via Python functions, never generated by LLM text completion.

### C. Tech Stack
* **SLM / Vision:** Gemini 2.0 Flash / Groq Llama-3.3-70B for document OCR and semantic fuzzy resolution.
* **Fine-Tuning:** Unsloth fine-tuning of Llama-3.2-3B for local, privacy-first invoice data extraction on Kaggle T4.
* **Desktop / Mobile App:** React Native / Expo (or Electron / Tauri for desktop accountants).
* **Database:** Local SQLite (zero enterprise financial data ever leaves the user's laptop unless opted in).

### D. Data Sources & Free APIs
* [GST Portal Sandbox Specifications](https://developer.gst.gov.in/) & sample GSTR-2B JSON schemas.
* [MSME Samadhaan Portal Guidelines & Case Law](https://samadhaan.msme.gov.in/).
* Reserve Bank of India (RBI) Historical Bank Rates (Public series).

### E. 8-Week MVP Implementation Plan
* **Week 1:** Construct dataset of 100 realistic Indian GST invoices (handwritten, scanned, printed, faded) with ground truth GSTR-2B tables.
* **Week 2:** Build invoice parser using Gemini Flash / fine-tuned SLM with Pydantic output validation.
* **Week 3:** Implement fuzzy reconciliation algorithm (Levenshtein + semantic LLM referee for edge cases).
* **Week 4:** Implement deterministic MSMED Section 15 compound interest engine with RBI rate lookups.
* **Week 5:** Build automatic PDF legal notice generator using ReportLab / React-PDF.
* **Week 6:** Package into a clean, privacy-first desktop/mobile UI (React Native / Expo Web).
* **Week 7:** Benchmark against 50 real-world GSTR-2B discrepancies; achieve 100% mathematical precision.
* **Week 8:** Launch on GitHub, submit to FOSS United (Zerodha FLOSS Fund / FOSS Grants love Indian fintech/compliance tools), write a technical breakdown on LinkedIn.

### F. Open-Source Strategy & Traction
* Open-source under AGPL-3.0 / MIT.
* Position as the free, privacy-preserving open-source alternative to ClearTax for micro-businesses.
* Immediate appeal to Indian developer-accountants, CA communities, and FOSS United.

### G. Risks & Guardrails
* *Tax Penalty Liability:* All output schedules explicitly show the exact line-by-line mathematical derivation and flag items requiring CA sign-off.

### H. Evaluation Scores (1–10)
* **Societal Impact:** 8.8/10
* **Industry Relevance:** 9.2/10 (Fintech, document extraction, agentic accounting).
* **Feasibility:** 9.5/10 (Easiest to run locally on free compute with 0 API cost).
* **Differentiation:** 8.8/10 (First tool coupling GST matching with automated MSMED Act statutory debt recovery).
* **Profile Value:** 9.0/10
* **Total Score:** **45.3 / 50**

---

## 5. DrishtiCopilot (Local Multimodal Edge Agent for Visually Impaired Indian Citizens)

### A. Problem & Target Users
* **Target Users:** 40M+ visually impaired individuals in India.
* **The Problem:** Western-built visual assistants (Be My Eyes, Envision) fail on Indian vernacular challenges: recognizing soiled/folded Indian Rupee banknotes, deciphering vernacular handwriting on clinic prescriptions, and warning against unique Indian street hazards (open drains, unbarricaded road cuts). They also demand paid subscriptions and high-bandwidth cloud video streams.

### B. Agentic Architecture
* **Tools:**
  1. `detect_indian_currency_denomination(image)`: Fast local classifier for ₹10, ₹20, ₹50, ₹100, ₹200, ₹500 notes.
  2. `read_medicine_strip_and_dosage(image)`: Extracts brand name, generic composition, expiration date, and dosage instructions.
  3. `describe_scene_spatial_hazards(image)`: Generates concise, low-latency audio spatial descriptions ("Puddle 3 steps ahead, construction debris to your right").
* **Memory:** Short-term conversational context (answering follow-up questions: "Is this the morning or night tablet?").
* **Planning:** Low-latency routing agent: local fast model handles currency and obstacles; cloud VLM (Gemini Flash free tier) handles complex prescription parsing.
* **Evals & Guardrails:** Latency is critical: obstacle alerts must fire in <400ms.

### C. Tech Stack
* **Edge ML:** YOLOv8-nano / MobileNet quantized for Indian currency and common obstacles running directly on Android via ONNX Runtime / TensorFlow Lite.
* **Cloud VLM:** Gemini 2.0 Flash (free tier) for deep OCR and prescription explanation.
* **Client:** React Native / Expo with full Android TalkBack / accessibility integration and haptic feedback.
* **TTS:** On-device Android text-to-speech engine (zero latency, zero cloud cost).

### D. Data Sources & Free APIs
* [Indian Currency Note Dataset](https://huggingface.co/datasets) (Kaggle / Hugging Face public banknote collections).
* [1mg / Jan Aushadhi Open Medicine Datasets](https://janaushadhi.gov.in/) (Indian generic medicine names).

### E. 8-Week MVP Implementation Plan
* **Week 1:** Gather and augment Indian currency dataset (including folded, crumpled, dimly lit notes).
* **Week 2:** Train/quantize lightweight YOLOv8 currency model on Kaggle T4; achieve >98% mAP at <50ms inference.
* **Week 3:** Build React Native camera pipeline with gesture-based controls and haptic confirmation.
* **Week 4:** Connect Gemini Flash API for deep medicine packaging inspection and prescription interpretation.
* **Week 5:** Implement conversational voice agent loop using on-device Speech-to-Text and Text-to-Speech.
* **Week 6:** User testing with visually impaired students / NGOs (e.g., Samarthanam Trust in Bengaluru).
* **Week 7:** Refine audio prompts for minimal cognitive load (short, direct navigational directives).
* **Week 8:** Release open-source app on GitHub and F-Droid, submit to accessibility tech showcases.

### F. Open-Source Strategy & Traction
* High emotional and social resonance on LinkedIn and Twitter.
* Potential for Google Summer of Code (GSoC) or disability tech grants.

### G. Risks & Guardrails
* *Safety Risk:* Navigation cannot claim to replace a white cane; app must repeatedly warn users that real-time hazard detection is an advisory aid only.

### H. Evaluation Scores (1–10)
* **Societal Impact:** 9.2/10
* **Industry Relevance:** 8.5/10 (Multimodal edge AI, computer vision, on-device SLMs).
* **Feasibility:** 8.5/10
* **Differentiation:** 8.8/10 (Localized for Indian physical infrastructure and currency).
* **Profile Value:** 9.2/10
* **Total Score:** **44.2 / 50**

---

## 6. NeerBudget: HydroAgent (Autonomous Micro-Watershed Groundwater Budgeting Agent)

### A. Problem & Target Users
* **Target Users:** 250,000 Gram Panchayats, village water committees, and rural watershed NGOs.
* **The Problem:** India extracts 25% of global groundwater. Gram Panchayats are legally mandated under the Atal Bhujal Yojana to create Village Water Security Plans, but lack data analysts to calculate sustainable extraction budgets, monitor borewell decline, or plan water-resilient crop switching.

### B. Agentic Architecture
* **Tools:**
  1. `get_cgwb_well_water_levels(district, block)`: Queries Central Ground Water Board telemetry via India-WRIS.
  2. `compute_monsoon_recharge_estimate(rainfall_mm, soil_type)`: Calculates expected aquifer recharge.
  3. `recommend_crop_portfolio(available_water_m3, soil_type)`: Optimization agent balancing crop profitability against cubic meters of water required per hectare (e.g., shifting from water-guzzling paddy to millets/pulses).
* **Memory:** Longitudinal aquifer depth trends stored in Supabase PostGIS.
* **Planning:** Scenario simulation agent: projects water table depth under various rainfall and cropping scenarios over a 3-year horizon.
* **Evals & Guardrails:** Hydrological formulas must follow Central Ground Water Board (CGWB) GEC-2015 standard methodology.

### C. Tech Stack
* **Agent Engine:** LangGraph, Python, FastAPI.
* **Models:** Groq Llama-3.3-70B for scenario synthesis and report generation in vernacular languages (Hindi, Marathi, Telugu).
* **Frontend:** React Native / Expo web dashboard showing village aquifer maps and water balance sheets.

### D. Data Sources & Free APIs
* [India-WRIS (Water Resources Information System)](https://indiawris.gov.in/) (Open Government Data).
* [Central Ground Water Board (CGWB) Groundwater Assessment Reports](http://cgwb.gov.in/).
* [NASA GRACE Groundwater Anomaly Datasets](https://grace.jpl.nasa.gov/) (Open scientific data).

### E. 8-Week MVP Implementation Plan
* **Weeks 1–2:** Build data pipeline ingesting historical CGWB well telemetry for 5 drought-prone districts.
* **Weeks 3–4:** Implement CGWB GEC-2015 water balance calculation equations in Python.
* **Weeks 5–6:** Build multi-agent crop-portfolio optimization loop using LangGraph and Groq.
* **Weeks 7–8:** Build Panchayat report generator outputting visual 2-page vernacular PDF Water Security Plans; open-source release.

### F. Open-Source Strategy & Traction
* Align with India Water Portal and Jal Jeevan Mission open data initiatives.

### G. Risks & Guardrails
* Scientific inaccuracy: Must explicitly benchmark calculation algorithms against published CGWB district reports.

### H. Evaluation Scores (1–10)
* **Societal Impact:** 8.8/10
* **Industry Relevance:** 7.8/10 (Climate tech, environmental modeling).
* **Feasibility:** 8.0/10
* **Differentiation:** 9.2/10 (Very few AI agents exist in rural hydrology).
* **Profile Value:** 8.5/10
* **Total Score:** **42.3 / 50**

---

## 7. BecknFlow (Autonomous Multimodal Kirana-to-ONDC Onboarding & Protocol Agent)

### A. Problem & Target Users
* **Target Users:** 12M+ neighborhood kirana stores and small merchants.
* **The Problem:** The Open Network for Digital Commerce (ONDC) aims to democratize e-commerce, but traditional shopkeepers cannot code against the complex **Beckn Protocol** schemas (`/search`, `/on_search`, `/select`, `/confirm`). Digitizing physical inventory item by item takes weeks of manual cataloging.

### B. Agentic Architecture
* **Tools:**
  1. `digitize_shelf_photo(image)`: VLM detects packaged products on shelves and maps them to standard Indian EAN/UPC barcodes and GST HSN codes.
  2. `voice_update_inventory(audio)`: Voice agent listening in vernacular ("10 packets of Nandini milk arrived, price ₹24") and updating inventory counts.
  3. `beckn_protocol_handler()`: Formats merchant catalog into standard Beckn JSON payloads and handles network callback handshakes.
* **Memory:** Local store catalog and transaction history in Supabase.
* **Planning:** Event-driven agent handling incoming ONDC orders, checking stock, and dispatching pickup confirmations.
* **Evals & Guardrails:** Strict schema compliance against official ONDC/Beckn sandbox test suites.

### C. Tech Stack
* **VLM & Agent:** Gemini 2.0 Flash (free tier) for shelf inventory OCR + Groq Llama-3.3-70B for Beckn schema generation.
* **Mobile App:** React Native / Expo for the merchant mobile terminal.
* **Protocol Layer:** Node.js / Express Beckn adapter connecting to ONDC Staging Sandbox.

### D. Data Sources & Free APIs
* [ONDC Official Protocol Specifications & Sandboxes](https://github.com/ONDC-Official) (Free open repository).
* [Beckn Protocol Documentation & Reference Implementations](https://github.com/beckn).
* Open Food Facts India (Barcode database).

### E. 8-Week MVP Implementation Plan
* **Weeks 1–2:** Setup local Beckn Sandbox environment; test basic search/select/confirm handshakes.
* **Weeks 3–4:** Build multimodal shelf image cataloging pipeline using Gemini Flash.
* **Weeks 5–6:** Build React Native merchant app with vernacular voice inventory management.
* **Weeks 7–8:** Complete end-to-end sandbox transaction on ONDC; publish open-source repo with developer documentation.

### F. Open-Source Strategy & Traction
* High visibility within the Indian startup and fintech ecosystem (Nandan Nilekani initiatives, ONDC community hackathons).

### G. Risks & Guardrails
* Network transaction integrity: Requires rigorous automated unit tests to prevent out-of-sync inventory sales.

### H. Evaluation Scores (1–10)
* **Societal Impact:** 8.2/10
* **Industry Relevance:** 9.2/10 (Autonomous commerce, MCP, protocol-based agent networks).
* **Feasibility:** 8.0/10
* **Differentiation:** 8.5/10
* **Profile Value:** 8.8/10
* **Total Score:** **42.7 / 50**

---

## 8. Summary Comparison Matrix

| Project Idea | Societal Impact | Industry Relevance | Feasibility (Solo 8-Wk) | Differentiation | Profile Value | **Total (out of 50)** | Recommendation Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. AshaSanghi (Frontline Health Agent)** | **10** | **9.5** | **8.5** | **10** | **10** | **48.0** | **#1 Top Pick (Flagship)** |
| **2. KisanOS (AgriOrchestrator)** | **9.5** | **8.5** | **9.0** | **9.0** | **9.0** | **45.0** | Strong Contender |
| **3. CrisisGraph (Flood Situational Graph)** | **9.2** | **9.0** | **8.2** | **9.5** | **9.5** | **45.4** | **#2 Runner-Up** |
| **4. LekhaMitra (MSME Cash-Flow Defender)** | **8.8** | **9.2** | **9.5** | **8.8** | **9.0** | **45.3** | High Feasibility Alternative |
| **5. DrishtiCopilot (Blind Assistive Agent)** | **9.2** | **8.5** | **8.5** | **8.8** | **9.2** | **44.2** | High Emotional Value |
| **6. NeerBudget (Groundwater Budgeting)** | **8.8** | **7.8** | **8.0** | **9.2** | **8.5** | **42.3** | Scientific Niche |
| **7. BecknFlow (Kirana ONDC Agent)** | **8.2** | **9.2** | **8.0** | **8.5** | **8.8** | **42.7** | High Commercial Interest |
