# 📋 Attendance Tracker

## The Story

I'm a TA for an introductory course and the professor asked me to keep track of attendance. Initially, he asked for it to be done via paper and manually transferred to an Excel sheet. BUT nobody has time for that, so instead I decided to create this project to do that for me lol.

This web app transforms the tedious paper-and-pen attendance process into a streamlined digital kiosk system that students can use to check themselves in. No more shuffling papers, no more manual data entry—just tap your name and you're done!

## ✨ Features

### 🖥️ Admin Dashboard
- **Import existing rosters** from Excel files (supports `.xlsx` and `.xls`)
- **Session management** - Create, view, and clear attendance sessions by date
- **Export to Excel** - Download attendance reports with present/absent status
- **Real-time session tracking** - See all active sessions at a glance
- **Modern UI** - Clean, card-based interface with intuitive navigation

### 📱 Check-In Kiosk
- **Touch-optimized** - Large buttons perfect for iPad or tablet use
- **Real-time search** - Find students by name, ID, or email
- **Live statistics** - See total students, checked-in count, and remaining
- **Auto-clearing search** - Search resets after each check-in for faster workflow
- **Visual feedback** - Toast notifications and haptic feedback on mobile devices
- **Persistent data** - Check-ins persist across page refreshes
- **Session switching** - Easily switch between different dates

### 🔒 Data Management
- **SQLite database** - All data stored locally and persistently
- **Duplicate prevention** - Students can't check in twice for the same session
- **Upsert logic** - Importing Excel files updates existing students without creating duplicates
- **Date normalization** - Handles timezone issues to ensure accurate date tracking

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Prisma](https://www.prisma.io/) + SQLite
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Excel Handling**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Runtime**: Node.js

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm installed
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/attendance-tracker.git
   cd attendance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Admin dashboard: [http://localhost:3000](http://localhost:3000)
   - Check-in kiosk: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)

## 📖 Usage Guide

### Getting Started

1. **Import Your Roster** (Optional but recommended)
   - Go to the admin dashboard at `http://localhost:3000`
   - Upload an Excel file with your student roster
   - **Required format:**
     - Column A: `ID` (Student ID)
     - Column B: `Name` (Full name)
     - Column C: `Email` (Email address)
     - Remaining columns: Date headers for existing attendance data (optional)

2. **Create a Session**
   - Select today's date (or any date you want)
   - Click "Create Session"

3. **Open the Kiosk**
   - Click "Open Check-In Kiosk" or navigate to `/kiosk`
   - Display this page on an iPad/tablet in your classroom
   - Students can search their name and tap "Check In"

4. **Export Attendance**
   - Return to the admin dashboard
   - Click "Download Excel Report"
   - Get a complete attendance report with present/absent status for all sessions

### Features in Detail

#### Search Functionality
- Search works across student names, IDs, and email addresses
- Real-time filtering as you type
- Students who have already checked in are automatically hidden from the list

#### Session Management
- Each date creates a unique session
- Check-ins are tied to specific sessions
- You can switch between dates to view historical attendance
- "Clear Session" deletes all check-ins for that date (use carefully!)

#### Data Persistence
- All data is stored in `prisma/dev.db`
- You can close and restart the server anytime
- Data persists across server restarts
- **Important**: Keep this file backed up, and don't commit it to git (sensitive student data!)

## 🎨 Screenshots

> Add screenshots here showing:
> - Admin dashboard
> - Kiosk check-in interface
> - Excel import/export examples

## 📁 Project Structure

```
attendance-tracker/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database (gitignored)
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── checkin/       # POST check-in endpoint
│   │   │   ├── checkins/      # GET checked-in students
│   │   │   ├── clear/         # POST clear session
│   │   │   ├── export/        # GET Excel export
│   │   │   ├── import/        # POST Excel import
│   │   │   ├── roster/        # GET all students
│   │   │   └── sessions/      # GET/POST sessions
│   │   ├── kiosk/
│   │   │   └── page.tsx       # Check-in kiosk UI
│   │   ├── page.tsx           # Admin dashboard
│   │   └── layout.tsx         # Root layout
│   └── lib/
│       └── db.ts              # Prisma client setup
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 Deployment

This project can be deployed to various platforms. Here are some options:

### Vercel (Recommended for Next.js)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. **Note**: Vercel uses serverless functions, so SQLite won't persist between requests
4. For production, consider using PostgreSQL with Vercel Postgres or another cloud database

### Self-Hosted
1. Build the production version:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
3. Use a process manager like PM2 to keep it running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "attendance-tracker" -- start
   ```

## 🔐 Security Considerations

- **Student data privacy**: The database contains PII (names, emails, student IDs)
- **Always backup** `prisma/dev.db` regularly
- **Never commit** the database file to git (already in `.gitignore`)
- **For production**: Add authentication to protect the admin dashboard
- **Consider**: Password-protecting the clear session functionality

## 🐛 Known Issues & Future Improvements

### Potential Enhancements
- [ ] Add authentication for admin dashboard
- [ ] Implement role-based access (admin vs. student view)
- [ ] Add QR code check-in option
- [ ] Generate analytics/reports (attendance trends, late arrivals)
- [ ] Email notifications for students who miss multiple sessions
- [ ] Dark mode toggle
- [ ] Multi-class support for TAs managing multiple courses
- [ ] Export to CSV in addition to Excel
- [ ] Progressive Web App (PWA) support for offline check-ins

## 🤝 Contributing

This is a personal project built for my TA duties, but feel free to fork it and adapt it for your own use! If you have suggestions or find bugs, open an issue or submit a pull request.

## 📝 License

MIT License - feel free to use this for your own classes or projects!

## 👨‍💻 Author

Built with ☕ and frustration with paper attendance sheets by [Your Name]

---

**Pro tip**: Set up the kiosk on an iPad near the classroom door. Students can check in as they arrive, and you'll have real-time attendance data without lifting a finger! 🎉
