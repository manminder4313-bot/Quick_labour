# 🚀 QuickLabour Backend & MongoDB Atlas Setup

This directory contains the Express & Mongoose backend service for QuickLabour. It connects directly to MongoDB Atlas to persist user data, worker accounts, job request bookings, reviews, and support inquiries.

---

## 🛠️ Configuration & Secrets (.env)

The backend uses a `.env` configuration file at `quicklabour-backend/.env`. 
By default, it is configured to use a MongoDB cluster. **To use your own MongoDB Atlas connection:**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Create a new Database Cluster and click **Connect**.
3. Choose **Drivers** (Node.js) and copy the Connection String.
4. Replace the `MONGO_URI` value in `quicklabour-backend/.env` with your connection string:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/quicklabour?retryWrites=true&w=majority
   JWT_SECRET=your_custom_secret_key_here
   ```

---

## 🏃 Running the Services Locally

You can launch both the frontend and backend simultaneously. Open two terminals in your workspace:

### Terminal 1: Run Express Backend
```bash
cd quicklabour-backend
npm run start
```
*The server will boot up on port `5000`. On the very first run, it will automatically connect to MongoDB Atlas and seed all tester accounts (`client@quicklabour.com` & `worker@quicklabour.com`) and reviews if they don't already exist!*

### Terminal 2: Run React Frontend
```bash
cd quicklabour-react
npm run dev
```
*The frontend will run at `http://localhost:5173`. It is now fully connected to the Express backend and updates MongoDB in real-time!*

---

## 📁 Data Models Stored in MongoDB Atlas

1. **User Profile (`User` Schema)**:
   - Credentials (hashed password via bcrypt).
   - Base64 encoded profile photo (`avatar`) and government proof documentation (`idFile`).
   - Role distinctions (`client` / `worker`).
   - Worker specialties (occupation, ratings, completed job counts, online/offline availability states).

2. **Job Bookings (`Job` Schema)**:
   - Maps the posting client's ID.
   - Job category, budget, location, and description.
   - Bidding mechanics (array of worker proposals with dynamic rate cards).
   - Status transitions (`Waiting...` ➔ `Accepted` ➔ `Completed`/`Rejected`).

3. **User Testimonials (`Review` Schema)**:
   - Dynamic user reviews posted from the reviews page containing specialty, ratings (1 to 5 stars), and written feedback.

4. **Support Tickets (`Contact` Schema)**:
   - Contact form inquiries (name, email, subject, message) stored in MongoDB for customer care.
