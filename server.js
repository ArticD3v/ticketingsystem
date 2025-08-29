require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  expertise: String
});
const User = mongoose.model('User', userSchema);

// Ticket schema
const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  deadline: String,
  category: String,
  status: String,
  founder: String,
  applicants: [String],
  assignedTo: String,
  createdAt: { type: Date, default: Date.now }
});
const Ticket = mongoose.model('Ticket', ticketSchema);

// Chat message schema
const chatMessageSchema = new mongoose.Schema({
  ticketId: String,
  user: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// --- API ROUTES ---

// Login (simple, no hashing for demo)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

// Get all tickets (optionally filter by role)
app.get('/api/tickets', async (req, res) => {
  const { role, username, expertise } = req.query;
  let filter = {};
  if (role === 'founder') filter.founder = username;
  if (role === 'professional' && expertise)
    filter.$or = [{ category: expertise }, { category: 'General' }];
  const tickets = await Ticket.find(filter);
  res.json(tickets);
});

// Create ticket
app.post('/api/tickets', async (req, res) => {
  const ticket = new Ticket(req.body);
  await ticket.save();
  res.json(ticket);
});

// Get single ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Show interest
app.post('/api/tickets/:id/interest', async (req, res) => {
  const { username } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket.applicants.includes(username)) {
    ticket.applicants.push(username);
    await ticket.save();
  }
  res.json(ticket);
});

// Assign ticket
app.post('/api/tickets/:id/assign', async (req, res) => {
  const { username } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket.assignedTo) {
    ticket.assignedTo = username;
    ticket.status = 'Assigned';
    await ticket.save();
    return res.json(ticket);
  }
  res.status(400).json({ error: 'Already assigned' });
});

// Mark ticket as completed
app.post('/api/tickets/:id/complete', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.status = 'Completed';
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark ticket as completed' });
  }
});

// Get assigned tickets
app.get('/api/assigned', async (req, res) => {
  const { role, username } = req.query;
  let filter = {};
  if (role === 'founder') filter = { founder: username, assignedTo: { $ne: null } };
  else filter = { assignedTo: username };
  const tickets = await Ticket.find(filter);
  res.json(tickets);
});

// Get chat messages for a ticket
app.get('/api/chat/:ticketId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ ticketId: req.params.ticketId })
      .sort({ time: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chat messages' });
  }
});

// Send a chat message
app.post('/api/chat/:ticketId', async (req, res) => {
  try {
    const { user, text } = req.body;
    const message = new ChatMessage({
      ticketId: req.params.ticketId,
      user,
      text
    });
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));