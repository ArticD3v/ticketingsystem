# Ticketing System

A simple ticketing platform where Founders create tickets, Professionals show interest and get assigned, and both collaborate via chat.

## Contents
- Overview
- Tech Stack
- Quick Start
- Configuration (.env)
- Running the App
- Data Model
- User Roles & Flows
- Frontend Pages
- API Reference
- Sample Data (users)
- Troubleshooting
- Notes & Security

## Overview
- Founders create tickets with title, description, deadline, and category.
- Professionals see open tickets filtered by their expertise and show interest.
- Founders assign tickets to interested professionals.
- Both can see assigned tickets and chat on each ticket.

## Tech Stack
- Backend: Node.js, Express, Mongoose (MongoDB)
- Frontend: HTML, CSS, Vanilla JavaScript
- DB: MongoDB

## Quick Start
1) Install dependencies
```bash
npm install
```
2) Configure environment (see "Configuration")
3) Start server
```bash
node server.js
```
4) Open `index.html` in your browser (double-click or serve statically)

## Configuration (.env)
Create a `.env` at project root:
```
MONGO_URI=mongodb://localhost:27017/ticketing_system
```
Use any valid MongoDB connection string.

## Running the App
- Backend runs on port 3001 (see `server.js`).
- Frontend files are static: `index.html`, `auth.html`, `founder.html`, `pro.html`, `assigned.html`, `chat.html`.
- Auth is demo-level: users must exist in the `users` collection (see Sample Data).

## Data Model
User (collection: `users`)
- `username`: String
- `password`: String (plain for demo)
- `role`: String ('founder' | 'professional')
- `expertise`: String (for professionals; used to filter tickets)

Ticket (collection: `tickets`)
- `title`: String
- `description`: String
- `deadline`: String (YYYY-MM-DD)
- `category`: String ('General', 'Tech', 'Legal', 'Marketing', 'Finance', 'Other')
- `status`: String ('Open' | 'Assigned' | 'Completed')
- `founder`: String (creator username)
- `applicants`: [String] (usernames who showed interest)
- `assignedTo`: String (professional username)
- `createdAt`: Date (default now)

ChatMessage (collection: `chatmessages`)
- `ticketId`: String (Ticket._id)
- `user`: String (username)
- `text`: String
- `time`: Date (default now)

## User Roles & Flows
Founder
- Login via `auth.html`.
- Create tickets in `founder.html`.
- See own tickets and assign to applicants.
- View assigned tickets in `assigned.html`.
- Chat in `chat.html`.
- Can mark a ticket as Completed.

Professional
- Login via `auth.html`.
- See open tickets matching `expertise` in `pro.html`.
- Show interest; if assigned, it moves to `assigned.html`.
- Chat in `chat.html` on assigned tickets.

## Frontend Pages
- `index.html`: Dashboard entry.
- `auth.html`: Simple login; stores session in `sessionStorage` as `ts_session`.
- `founder.html`: Create tickets, list own tickets, assign applicants.
- `pro.html`: Browse open tickets by expertise; show interest.
- `assigned.html`: List assigned tickets for both roles; open chat; founders can complete.
- `chat.html`: Chat on a specific ticket; auto-refreshes messages.

## API Reference (Base: http://localhost:3001)
Auth
- POST `/api/login`
  - body: `{ "username": "alice", "password": "secret" }`
  - 200: user object `{ username, role, expertise? }`

Tickets
- GET `/api/tickets?role=founder&username=:u`
  - Founder view: returns tickets created by `username`.
- GET `/api/tickets?role=professional&expertise=:e`
  - Pro view: returns open tickets for expertise or 'General'.
- POST `/api/tickets`
  - body: `{ title, description, deadline, category, status, applicants, assignedTo, founder }`
  - 200: created ticket
- GET `/api/tickets/:id`
  - 200: ticket by id
- POST `/api/tickets/:id/interest`
  - body: `{ username }`
  - 200: updated ticket with applicants
- POST `/api/tickets/:id/assign`
  - body: `{ username }` (professional)
  - 200: updated ticket (status -> Assigned)
- POST `/api/tickets/:id/complete`
  - 200: updated ticket (status -> Completed)

Assigned Tickets
- GET `/api/assigned?role=:r&username=:u`
  - If role=founder: tickets where `founder=u` and `assignedTo != null`
  - Else: tickets where `assignedTo=u`

Chat
- GET `/api/chat/:ticketId`
  - 200: `[ { ticketId, user, text, time }, ... ]`
- POST `/api/chat/:ticketId`
  - body: `{ user, text }`
  - 200: created chat message

## Sample Data (users)
Insert users with Mongo shell or MongoDB GUI:
```javascript
// In Mongo shell or mongosh
use ticketing_system;
db.users.insertMany([
  { username: 'founder1', password: 'pass', role: 'founder' },
  { username: 'pro1', password: 'pass', role: 'professional', expertise: 'Tech' },
  { username: 'pro2', password: 'pass', role: 'professional', expertise: 'Legal' }
]);
```
Login with these credentials via `auth.html`.

## Troubleshooting
- Server not starting
  - Ensure MongoDB is running and `MONGO_URI` is correct.
- Login fails
  - Ensure user exists in `users` collection with exact `username` and `password`.
- Tickets not appearing for pros
  - Ticket `category` must match professional `expertise` or be `General`.
  - Ticket must be `Open`.
- Assign not persisting
  - Check server logs; confirm `POST /api/tickets/:id/assign` returns 200.
- Chat not updating
  - Ensure `GET/POST /api/chat/:ticketId` return 200; check console for CORS/network errors.

## Notes & Security
- Demo app: passwords are stored in plain text (do not use in production).
- No registration endpoint; seed users directly in MongoDB.
- CORS is enabled globally; tighten for production.
- Frontend uses polling for chat; for production consider WebSockets.


