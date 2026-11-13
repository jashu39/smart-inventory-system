import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Business from '../models/Business.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).populate('business', 'name code');
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev_only_change_me', { expiresIn: '12h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, business: user.business } });
  } catch (e) { next(e); }
});

router.post('/users', protect, allowRoles('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password (8+ characters) are required' });
    if (!['admin', 'staff'].includes(role)) return res.status(400).json({ message: 'Role must be admin or staff' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role, business: req.user.business });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) { next(e); }
});
export default router;
