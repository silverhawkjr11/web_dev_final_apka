require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 9000; // Fixed port for demo server

// In-memory storage for demo (replace with MongoDB later)
let users = [];
let routes = [];
let userIdCounter = 1;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting - TEMPORARILY DISABLED FOR TESTING
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 10,
//     message: { message: 'Too many authentication attempts, please try again later.' }
// });

// app.use('/api/auth', authLimiter);
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
    next();
});

console.log('✅ Middleware configured: CORS, JSON Parser (Rate Limiter DISABLED)');

// JWT Token Generation
const generateTokens = (userId, username) => {
    const accessToken = jwt.sign(
        { userId, username },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
        { userId, username },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '1d' }
    );
    
    return { accessToken, refreshToken };
};

// Middleware for token verification
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Debug route to show all registered routes
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
    });
    res.json({ registeredRoutes: routes });
});

// Register
app.post('/api/auth/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    console.log('🔥 REGISTER ENDPOINT HIT!', req.method, req.path);
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email || u.username === username);
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with this email or username' 
            });
        }
        
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = {
            id: userIdCounter++,
            username,
            email,
            password: hashedPassword,
            salt: salt,
            createdAt: new Date()
        };
        
        users.push(user);
        
        const tokens = generateTokens(user.id, user.username);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            ...tokens
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password } = req.body;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const tokens = generateTokens(user.id, user.username);
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            ...tokens
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Refresh Token
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }
        
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
            
            const tokens = generateTokens(user.userId, user.username);
            res.json(tokens);
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
});

// Verify Token
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: {
            id: req.user.userId,
            username: req.user.username
        }
    });
});

// Save Route
app.post('/api/routes', verifyToken, async (req, res) => {
    try {
        const routeData = {
            id: Date.now(),
            ...req.body,
            userId: req.user.userId,
            createdAt: new Date()
        };
        
        routes.push(routeData);
        
        res.status(201).json({
            message: 'Route saved successfully',
            route: routeData
        });
    } catch (error) {
        console.error('Route save error:', error);
        res.status(500).json({ message: 'Error saving route' });
    }
});

// Get User Routes
app.get('/api/routes', verifyToken, async (req, res) => {
    try {
        const userRoutes = routes.filter(r => r.userId === req.user.userId);
        res.json({ routes: userRoutes });
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ message: 'Error fetching routes' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mode: 'DEMO - In-Memory Storage',
        users: users.length,
        routes: routes.length
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔄 Mode: DEMO - In-Memory Storage (no MongoDB required)`);
    console.log(`👤 Users stored in memory: ${users.length}`);
    console.log(`🔗 Available endpoints:`);
    console.log(`   - GET  http://localhost:${PORT}/api/test`);
    console.log(`   - GET  http://localhost:${PORT}/api/health`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
});