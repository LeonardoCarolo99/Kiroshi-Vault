```
██╗  ██╗██╗██████╗  ██████╗ ███████╗██╗  ██╗██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██║ ██╔╝██║██╔══██╗██╔═══██╗██╔════╝██║  ██║██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
█████╔╝ ██║██████╔╝██║   ██║███████╗███████║██║   ██║███████║██║   ██║██║     ██║   
██╔═██╗ ██║██╔══██╗██║   ██║╚════██║██╔══██║╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
██║  ██╗██║██║  ██║╚██████╔╝███████║██║  ██║ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
```

<div align="center">

**[NEON DRENCHED] • [NETRUNNER GRADE] • [CHOOM APPROVED]**

*A Night City command deck for the Cyberpunk Trading Card Game.*

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud_Sync-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

</div>

---

## `> JACK IN...`

**Kiroshi Vault** is your personal Netrunner-grade terminal for managing your Cyberpunk TCG collection. Track every card, build chrome-plated decks, log your gigs in the meatspace, and test your opening hands before you hit the Afterlife.

Built in the style of Night City's Kiroshi Optics interface - all neon grids, scanlines, and corporate chrome.

---

## `> SYSTEM MODULES`

| Module | Function |
| :-- | :-- |
| **COMMAND** | Your home terminal. Get a quick read on your collection, decks, and recent gigs at a glance. |
| **COLLECTION** | Full card index with advanced filtering. Track what you own, what's missing, and build your digital archive. |
| **DECKS** | Build and validate decks with real-time RAM limits, color requirements, and legend restrictions. Export to text for easy sharing. |
| **MATCHES** | Log your runs through the Afterlife. Track wins, losses, formats, and write notes on each gig. |
| **HAND TESTER** | Simulate your opening hands before the real thing. Mulligan until you've got the perfect draw. |
| **SETTINGS** | Backup, restore, and sync your vault across all your rigs via Firebase Cloud Sync. |

---

## `> FEATURES`

- **NEON HUD INTERFACE** - Cyberpunk 2077 inspired terminal UI with glitch aesthetics
- **LOCAL-FIRST** - Everything runs offline with localStorage. No data leaves your rig unless you sync it
- **CLOUD SYNC** - Sign in with Google and sync your collection, decks, and matches across all devices
- **DECK VALIDATION** - Real-time checking for RAM limits, legend counts, and card restrictions
- **MATCH HISTORY** - Track your win rate and relive your greatest gigs
- **HAND SIMULATOR** - Goldfish your decks to perfection
- **PWA READY** - Install on your phone or desktop for that true netrunner feel
- **FULL CARD DATABASE** - Complete Cyberpunk TCG card library with images and metadata

---

## `> BOOT SEQUENCE`

```bash
# Clone the repo
git clone https://github.com/Terminator2544/kiroshi-vault.git
cd kiroshi-vault

# Install dependencies
npm install

# Configure Firebase (for cloud sync)
cp .env.local.example .env.local
# Fill in your Firebase config

# Jack in
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and welcome to Night City.

---

## `> CLOUD SYNC CONFIG`

To enable sync across devices, you'll need a [Firebase](https://firebase.google.com/) project:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google Sign-In
3. Enable **Firestore Database** with the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

4. Add your web app config to `.env.local`

---

## `> TECH STACK`

| Tech | Purpose |
| :-- | :-- |
| [Next.js 16](https://nextjs.org/) | App Router, React Server Components |
| [React 19](https://react.dev/) | UI Framework |
| [TypeScript](https://www.typescriptlang.org/) | Type Safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling with cyberpunk theme |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management with persistence |
| [Firebase](https://firebase.google.com/) | Auth & Firestore for cloud sync |
| [Lucide React](https://lucide.dev/) | Iconography |

---

## `> CREDITS`

- **Card Data** - Sourced from Netdeck for the Cyberpunk TCG
- **Inspiration** - CD Projekt Red's Cyberpunk 2077 UI design
- **Built for** - The chooms in Night City

---

<div align="center">

```
[CONNECTION ESTABLISHED] • [ENCRYPTION: MILSPEC] • [TRACE: NONE]
```

**`> STAY CHROME, CHOOM.`**

</div>
