# Deployment Guide

This guide provides step-by-step instructions for deploying the **STEAM LAB** application to production environments.

## 1. Deploying to Google Cloud Run

Google Cloud Run is a fully managed serverless platform for running containerized applications. Since this is a static React application built with Vite, we will containerize it using Nginx.

### Prerequisites
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed.
- A Google Cloud Project with billing enabled.
- Artifact Registry API and Cloud Run API enabled.

### Step 1: Create a Dockerfile
Create a `Dockerfile` in the root of your project:

```dockerfile
# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config if needed (e.g., for SPA routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Build and Push to Artifact Registry
Replace `PROJECT_ID` and `REPO_NAME` with your actual values.

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project PROJECT_ID

# Create a repository in Artifact Registry
gcloud artifacts repositories create REPO_NAME \
    --repository-format=docker \
    --location=us-central1

# Build the image using Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/REPO_NAME/steam-lab:v1 .
```

### Step 3: Deploy to Cloud Run
```bash
gcloud run deploy steam-lab \
    --image us-central1-docker.pkg.dev/PROJECT_ID/REPO_NAME/steam-lab:v1 \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

---

## 2. Deploying to GitHub via Vercel

Vercel is the easiest way to deploy Vite applications with automatic CI/CD from GitHub.

### Step 1: Push to GitHub
1. Create a new repository on GitHub.
2. Initialize git and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/steam-lab.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New"** > **"Project"**.
3. Import your `steam-lab` repository from GitHub.
4. Vercel will automatically detect **Vite** as the framework.
5. **Environment Variables**: If you have any `VITE_` prefixed variables in your `.env`, add them in the "Environment Variables" section of the Vercel project settings.
6. Click **"Deploy"**.

### Step 3: Automatic Deployments
Every time you push to the `main` branch, Vercel will automatically trigger a new build and deployment.

---

## Environment Variables
Ensure you configure any required environment variables (like `GEMINI_API_KEY`) in your deployment platform's settings. For Vite, client-side variables must be prefixed with `VITE_`.
