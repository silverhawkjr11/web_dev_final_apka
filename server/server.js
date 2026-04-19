require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:3000']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '50mb' })); // Increase limit for large route data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apka-travel', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    salt: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Route Schema
const routeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routeName: String,
    country: String,
    city: String,
    tripType: {
        type: String,
        enum: ['cycling', 'trekking'],
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    routeData: {
        coordinates: [[Number]], // Array of [lat, lng] pairs
        dailySegments: [{
            day: Number,
            distance: Number,
            startPoint: {
                lat: Number,
                lng: Number,
                name: String
            },
            endPoint: {
                lat: Number,
                lng: Number,
                name: String
            },
            waypoints: [[Number]]
        }],
        totalDistance: Number,
        description: String,
        countryImage: String
    },
    weatherData: mongoose.Schema.Types.Mixed,
    approved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Route = mongoose.model('Route', routeSchema);

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

// Register
app.post('/api/auth/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        console.log('🔐 Registration request received:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { username, email, password } = req.body;
        console.log('✅ Validation passed for user:', username);
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            console.log('❌ User already exists:', { email, username });
            return res.status(400).json({ 
                message: 'User already exists with this email or username' 
            });
        }
        
        console.log('🔐 Creating new user...');
        
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            salt: salt
        });
        
        await user.save();
        console.log('✅ User saved successfully:', user._id);
        
        const tokens = generateTokens(user._id, user.username);
        
        console.log('✅ Registration completed for:', username);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            ...tokens
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
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
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const tokens = generateTokens(user._id, user.username);
        
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
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

// Verify Token (for middleware)
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
        console.log('💾 Route save request received');
        console.log('💾 User ID:', req.user.userId);
        console.log('💾 Request body keys:', Object.keys(req.body));
        console.log('💾 Route data structure:', {
            routeName: req.body.routeName,
            country: req.body.country,
            city: req.body.city,
            tripType: req.body.tripType,
            duration: req.body.duration,
            approved: req.body.approved
        });
        
        const routeData = {
            ...req.body,
            userId: req.user.userId
        };
        
        console.log('💾 Creating route with data...');
        const route = new Route(routeData);
        
        console.log('💾 Saving route to database...');
        await route.save();
        
        console.log('✅ Route saved successfully:', route._id);
        res.status(201).json({
            message: 'Route saved successfully',
            route: route
        });
    } catch (error) {
        console.error('❌ Route save error details:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        if (error.errors) {
            console.error('❌ Validation errors:', error.errors);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get User Routes
app.get('/api/routes', verifyToken, async (req, res) => {
    try {
        const routes = await Route.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        
        res.json({ routes });
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ message: 'Error fetching routes' });
    }
});

// Get Route by ID
app.get('/api/routes/:id', verifyToken, async (req, res) => {
    try {
        const route = await Route.findOne({ 
            _id: req.params.id, 
            userId: req.user.userId 
        });
        
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        
        res.json({ route });
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ message: 'Error fetching route' });
    }
});

// Approve Route
app.patch('/api/routes/:id/approve', verifyToken, async (req, res) => {
    try {
        const route = await Route.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { approved: true },
            { new: true }
        );
        
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        
        res.json({ message: 'Route approved', route });
    } catch (error) {
        console.error('Route approval error:', error);
        res.status(500).json({ message: 'Error approving route' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
});