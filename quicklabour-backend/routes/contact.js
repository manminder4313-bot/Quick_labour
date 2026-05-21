import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// @desc    Submit a contact inquiry
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const contact = new Contact({
      name,
      email,
      subject,
      message,
    });

    const savedContact = await contact.save();
    res.status(201).json({
      message: '🎉 Inquiry received successfully! Our team will get back to you shortly.',
      inquiry: savedContact,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
