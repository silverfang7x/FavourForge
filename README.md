# ⚡ FavourForge

**Earn quick cash. Help your community. Build local connections.**

FavourForge is a hyper-local, map-based gig economy platform built for instant micro-favors. Whether you need a quick hand with heavy groceries or want to earn a few Rupees in your free time, FavourForge turns your neighborhood into a community of helpers.

---

## 🛑 The Problem
Modern gig platforms (like TaskRabbit or UrbanCompany) are built for massive, scheduled jobs. They are formal, expensive, and slow. If someone just needs a 10-minute favor—like a quick jumpstart for a car, help moving a couch down one flight of stairs, or borrowing a specific tool—there is no frictionless way to broadcast that need to trustworthy people in their immediate vicinity.

## 💡 The Solution (Our Purpose)
FavourForge solves this by gamifying neighborhood assistance. Users drop a "Beacon" directly on an interactive map with a specific task, a time limit, and a Rupee (₹) reward. Nearby users can browse the map, accept the job, and instantly open a chat to coordinate. It is fast, aesthetic, and hyper-local.

---

## 🌍 Real-Life Applications
* **Campus Life:** "Need a charger in the library for 2 hours - ₹50."
* **Everyday Chores:** "Need someone to help carry this new TV up to the 3rd floor - ₹200."
* **Tech Troubleshooting:** "Wi-Fi router is acting up, need a quick tech-savvy eye - ₹150."
* **Emergencies:** "Stuck with a flat tire at the gas station, need a hand - ₹300."

---

## 🏗️ App Architecture & Core Components
The application is built using React Native, Expo, and Supabase, featuring a modern, rounded-corner UI with a vibrant blue/purple aesthetic. 

**Core Components:**
1. **`AuthScreen.tsx`**: A secure, beautifully styled login and registration gateway handling user authentication via Supabase. Features responsive keyboard handling and fluid inputs.
2. **`BeaconMap.tsx`**: The heart of the app. An interactive Google Maps interface featuring:
   * A floating top search bar for location navigation.
   * Custom 40x40 visual map markers for active jobs.
   * A dynamic radius visualizer to filter jobs by distance.
3. **`Job Creation Modal`**: A clean bottom-sheet interface where users define the task, the ₹ reward, and the time duration/deadline for completion.
4. **`Job Details Modal`**: The acceptance menu. Tapping a beacon displays full task details and features a "Start Navigation" button and a "Message Provider" trigger.
5. **`navigation.tsx` / Inbox**: A centralized hub to track active jobs, past favors, and ongoing communications.
6. **`ChatScreen.tsx`**: A real-time, peer-to-peer messaging interface allowing the job provider and the worker to coordinate safely without exchanging phone numbers.

---

## 🚀 How to Run & Test the App (Expo Go)
We built this project with accessibility in mind. You do not need Android Studio or a complex build environment to test FavourForge. You can run it directly on your physical device using Expo Go.

### Prerequisites
* Download the **Expo Go** app on your iOS or Android device.
* Install Node.js and Git on your computer.

### Step-by-Step Setup

**1. Clone the repository**
```bash
git clone [https://github.com/your-username/FavourForge.git](https://github.com/your-username/FavourForge.git)
cd FavourForge
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up Environment Variables**
Create a `.env` file in the root directory and add the Supabase database keys (reach out to the team for the testing keys):
```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Start the Application**
```bash
npx expo start
```
*To share with teammates remotely, run `npx expo start --tunnel`.*

**5. Test on your phone**
Open the Expo Go app on your phone and scan the QR code generated in your terminal. The app will build locally and launch instantly!

Built with ❤️ for the Hackathon by Suryansh Pandey & Team.


***

