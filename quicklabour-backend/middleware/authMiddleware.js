import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quicklabour_secret_key_12345');

      // Get user from the token, exclude password manually since it's an adapter
      const user = await User.findById(decoded.id);
      if (user) {
        user.password = undefined;
        if (user.role === 'worker' && user.isSuspended) {
          if (user.suspendedUntil && new Date() < new Date(user.suspendedUntil)) {
            const formattedDate = new Date(user.suspendedUntil).toLocaleDateString();
            return res.status(403).json({
              message: `Your account is suspended until ${formattedDate} for violating the Worker Conduct Policy.`,
              isSuspended: true
            });
          } else {
            user.isSuspended = false;
            user.suspendedUntil = null;
            await user.save();
          }
        }
      }
      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
