# ⚡ QuickLabour - Setup & Execution Guide

Welcome to the **QuickLabour** platform! This document provides detailed, step-by-step instructions to get the React-based frontend up, running, and compiling on your machine.

---

## 🛠️ Tech Stack Overview

The website is constructed using a modern, lightweight, and high-performance stack:
* **Framework**: React 19 (Functional components, hooks)
* **Build Tool & Bundler**: Vite 8 (Ultra-fast Hot Module Replacement)
* **Styling & Icons**: Bootstrap 5 + Vanilla CSS Custom Aesthetic Refinements + Bootstrap Icons
* **Routing**: React Router DOM 7

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your machine:
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher, comes bundled with Node.js)

To verify your installation, run the following commands in your terminal:
```bash
node -v
npm -v
```

---

## 🚀 Getting Started (Step-by-Step)

Follow these exact steps to start the application in development mode:

### Step 1: Open Terminal and Navigate to the Directory
Ensure you are in the React application's root directory:
```bash
cd "d:/mern stack course/mern stack course/quicklabour-react"
```

### Step 2: Install Project Dependencies
Install all the required npm modules (React, Vite, Bootstrap, and ESLint tools):
```bash
npm install
```

### Step 3: Run the Development Server
Launch the local development environment using Vite:
```bash
npm run dev
```

### Step 4: Access the Website
Once started, Vite will display local hosting URLs. Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## ⚙️ Additional Command-Line Scripts

In the project folder, you can run several scripts:

| Command | Action / Description |
| :--- | :--- |
| `npm run dev` | Starts Vite hot-reload server at **`localhost:5173`** |
| `npm run build` | Bundles and minifies the application into the `dist/` directory for production |
| `npm run preview` | Spins up a local web server to preview your production-ready `dist/` folder |
| `npm run lint` | Analyzes code for syntax and style guide consistency using ESLint |

---

## 💎 Features Implemented

* **Browse Worker Categories Page**: A premium, custom-styled category directory featuring:
  * Sleek Slate-Navy Gradient Header with smooth padding.
  * Modern Rounded Cards with premium float layouts and `20px` glassmorphic styling.
  * Micro-animations: Icons scale up (`1.1x`), rotate (`8deg`), and glow with gradient fills on hover.
  * Slate Skill Pill Badges separating different job subfields automatically.
  * Smooth Hover Raised CTAs for client engagement.
* **Premium Global Layout**: Fully responsive Bootstrap 5 grid layout optimized for mobile, tablet, and desktop screens.
