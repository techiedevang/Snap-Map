# 🌍 Snap&Map — AI-Powered Community Needs & Volunteer Matching

---

## 📌 Project Overview
**Snap&Map** is a real-time, AI-driven platform designed to bridge the gap between ground-level community needs and volunteers. It provides field workers with high-speed, accessible tools to report issues—such as infrastructure damage or local resource shortages—using only their voice or a photo. By utilizing Google’s Gemini AI, the platform turns unstructured data (like speech and paper forms) into actionable map markers instantly.

---

## ⚠️ IMPORTANT: Backend Connectivity
> **Note:** The full production backend has not been uploaded to this repository yet. Currently, the platform operates using high-fidelity frontend simulations. 
> 
> **All AI data extraction results, JSON parsing, and API responses can be verified directly via the Browser Console (F12 > Console).**

---

## 💡 The Solution
Snap&Map turns every citizen into a first responder through:
*   **Instant Reporting:** Field workers snap photos of paper surveys or speak reports.
*   **AI Structuring:** Google Gemini AI extracts critical data and categories.
*   **Social Verification:** Volunteers verify reports through a decentralized trust system.
*   **Gamified Impact:** Users grow a digital "Impact Tree" by helping others.

---

## ✨ Key Features

### 🗺️ Living Map Homepage
Real-time interactive map seeded with service request data. **Critical needs pulse red** (urgency ≥ 8), while **standard needs pulse blue.**

### 📸 Snap & Map AI
Upload a photo of any paper form or scene; **Gemini Vision** extracts titles, urgency, and affected population data to pin it to the map automatically.

### 🎤 Voice-First Reporting
Hold-to-speak interface using **Web Speech API**. The transcript is processed by the **Gemini 2.0/Ollama pipeline** into a structured report.

### 🛡️ Trust Circle & Certification
Community voting system. Reports verified by 3+ users earn a **"Community Certified"** badge.

### 🌳 Profile & Impact Tree
Gamified volunteer tracking. Your **Impact Tree grows 1 layer per task completed**, evolving your title from **Seedling to Forest Guardian.**

---

## 🤖 AI Waterfall Pipeline
To ensure zero downtime, the app follows a intelligent fallback logic:
1. **Google Gemini 2.0 Flash** — Primary Engine
2. **Google Gemini 1.5 Flash** — High-quota Fallback
3. **OpenAI GPT-4o-mini** — Redundancy Fallback
4. **Local Ollama (gemma3:4b)** — Offline Testing Fallback

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript |
| **Map Engine** | React-Leaflet + OpenStreetMap |
| **Primary AI** | Google Gemini 2.0 API |
| **Local AI** | Ollama (gemma3:4b) |
| **Speech** | Web Speech API |
| **Deployment** | **Netlify** |

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js v18+
*   Gemini API Key

### Step 1: Clone and Install
```bash
git clone https://github.com/kavyabhardwaj2004/g_soln_challenge.git
cd g_soln_challenge
npm install
