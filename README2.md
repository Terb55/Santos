# Project Implementation & Launch Guide

## What We Implemented

**Buildr AI** is an intelligent PC building companion website designed to simplify the custom PC creation process. It features:
- **AI-Powered Builder**: A step-by-step guided experience that recommends optimal PC configurations based on specific use cases (Gaming, Creative, Workstation), budget constraints, and user priorities.
- **Real-Time Price Tracker**: A dedicated "Price Watch" section monitoring component prices across the market.
- **Visual Visualization AI**: A "Visual Artist" agent that generates stunning, realistic images of your potential PC build.
- **Price-to-Performance AI**: A "Balance/Price Evaluator" that compares component performance benchmarks against real-time market prices to find the absolute best value parts.
- **Conversational Assistant**: An integrated AI chat widget that helps users refine their builds and answers hardware queries.

We have set up a full-stack integration connecting a **Solace Agent Mesh (SAM)** backend with this custom frontend interface.

### Key Components:
- **Backend (SAM)**: Located in the `sam/` directory. It uses the Solace Agent Mesh hackathon quickstart to provide LLM agent capabilities. Ideally run via Docker for a consistent environment.
- **Frontend**: A static web application located in `frontend/` (served from `frontend/public/`). It includes:
  - `index.html` (Main entry point)
  - `dashboard.html`, `builder.html` (Application interfaces)
  - Custom CSS and JS assets
- **Communication Bridge (`server.py`)**: A custom Python HTTP proxy server located in `frontend/public/server.py`. It runs on port **8080** and handles:
  - Serving static frontend files.
  - Proxying API requests (starting with `/api`) to the backend running on port **8000**.

Results: You get a unified development experience where the frontend talks to the AI backend seamlessely via the proxy.

---

## How to Launch

Follow these steps to get the entire application running.

### Prerequisites
- **Docker** and Docker Compose (desktop version recommended).
- **Python 3** installed on your system.

### Step 1: Start the Backend (Docker)

1. Open a terminal and navigate to the `sam` directory:
   ```bash
   cd sam
   ```

2. Create your environment file (if you haven't already):
   ```bash
   cp .env.example .env
   # Open .env and add your LLM API keys (e.g., OpenAI, etc.)
   ```

3. Build the Docker image:
   ```bash
   docker build -t sam-hackathon-quickstart .
   ```

4. Run the container:
   ```bash
   # Run in background (detached), forwarding port 8000
   docker run -d --rm -p 8000:8000 --env-file .env --name sam-app sam-hackathon-quickstart
   ```

   *To view logs later:* `docker logs -f sam-app`

### Step 2: Start the Frontend (Python Proxy)

1. Open a **new terminal** window/tab.

2. Navigate to the public frontend folder:
   ```bash
   cd frontend/public
   ```

3. Launch the proxy server:
   ```bash
   python server.py
   ```
   You should see output indicating the server is running on `http://127.0.0.1:8080`.

### Step 3: Access the Application

Open your browser and go to:
**[http://localhost:8080](http://localhost:8080)**

The frontend will load, and any AI interactions will be proxied to your running Docker backend.
