import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// GET /api/messages/conversation?userId1=xxx&userId2=yyy
// Fetches all messages between two users (in either direction)
router.get('/conversation', async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;
    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'Both userId1 and userId2 are required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/messages/contacts/:userId
// Returns list of unique users who have exchanged messages with this user
router.get('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    // Build unique contacts from messages
    const contactsMap = new Map();
    messages.forEach(msg => {
      const isOwn = msg.senderId === userId;
      const contactId = isOwn ? msg.receiverId : msg.senderId;
      const contactName = isOwn ? msg.receiverName : msg.senderName;
      const contactAvatar = isOwn ? '' : msg.senderAvatar;
      const contactRole = isOwn ? '' : msg.senderRole;

      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          _id: contactId,
          fullName: contactName,
          avatar: contactAvatar,
          role: contactRole,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unread: !isOwn && !msg.isRead ? 1 : 0,
        });
      } else {
        if (!isOwn && !msg.isRead) {
          contactsMap.get(contactId).unread += 1;
        }
      }
    });

    res.json(Array.from(contactsMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/messages/unread-count/:userId
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.params.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/messages/send
// Sends a new message from one user to another
router.post('/send', async (req, res) => {
  try {
    const { senderId, senderName, senderRole, senderAvatar, receiverId, receiverName, text } = req.body;

    if (!senderId || !senderName || !receiverId || !receiverName || !text) {
      return res.status(400).json({ message: 'senderId, senderName, receiverId, receiverName, and text are required' });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ message: 'Message text cannot be empty' });
    }

    const message = await Message.create({
      senderId,
      senderName,
      senderRole: senderRole || 'client',
      senderAvatar: senderAvatar || '',
      receiverId,
      receiverName,
      text: text.trim(),
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/messages/mark-read
// Marks all messages from a specific sender to a specific receiver as read
router.patch('/mark-read', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/messages/users  — for fetching all clients + workers to message
router.get('/users', async (req, res) => {
  try {
    const { Client, Labour } = await import('../models/User.js');
    const clients = await Client.find({}, 'fullName email avatar role _id').lean();
    const workers = await Labour.find({}, 'fullName email avatar occupation role _id').lean();
    res.json([...clients, ...workers]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
