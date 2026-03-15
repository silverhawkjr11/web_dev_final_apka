# 🗺️ Apka Travel Routes 2026

A comprehensive travel route planning platform built with Next.js and Express.js, featuring AI-powered route generation, real-time weather integration, and interactive maps.

## 📋 Project Overview

**Final Project 2026 - Web Platform Development, Semester A**

This platform provides users with intelligent travel route planning capabilities for both cycling and trekking adventures. The system uses advanced AI/LLM models to generate optimized routes while providing real-time weather forecasts and beautiful visualizations.

### 🎯 Key Features

- **🤖 Real AI-Powered Route Planning**: OpenAI GPT integration for intelligent route suggestions
- **🗺️ Interactive Maps**: Leaflet.js with OSRM routing API (realistic curved paths)  
- **🌐 Dynamic Geocoding**: OpenStreetMap Nominatim for any city worldwide
- **🌤️ Live Weather Integration**: OpenWeatherMap API with 3-day forecasts
- **🚴‍♂️ Cycling Routes**: 2-3 day city-to-city routes (30-70km daily)
- **🥾 Trekking Routes**: 1-3 day circular routes (5-10km daily)
- **🔐 Enterprise Security**: JWT auth with bcrypt+salt, middleware protection
- **📱 Modern UI/UX**: Next.js 14 with TypeScript and Tailwind CSS
- **☁️ Production Ready**: Optimized for cloud deployment with MongoDB Atlas

## 🏗️ Architecture

```
├── server/          # Express.js Authentication Server
│   ├── server.js    # Main server with JWT auth & MongoDB
│   └── package.json # Server dependencies
├── client/          # Next.js Frontend
│   ├── app/         # Next.js 14 app directory
│   ├── components/  # React components
│   └── middleware.ts # Auth middleware
└── package.json     # Root package with scripts
```

### 🔧 Technology Stack

**Backend (Express.js Server):**
- Express.js with CORS and Helmet security
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- bcryptjs for password encryption with salt
- Rate limiting and input validation

**Frontend (Next.js Client):**
- Next.js 14 with TypeScript
- React with hooks and context
- Tailwind CSS for styling
- Leaflet.js for interactive maps
- Axios for API communication
- React Hook Form for form handling
- React Hot Toast for notifications

## 🚀 Installation Guide

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Git for version control

### 1. Clone the Repository

```bash
git clone <your-github-repo-url>
cd apka-travel-routes-2026
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies (server + client)
npm run install-all
```

### 3. Environment Configuration

#### Server Configuration (.env)
Create `server/.env`:

```env
# Server Configuration
PORT=9000
NODE_ENV=development

# Database  
MONGODB_URI=mongodb+srv://apkauser:apka2026@apkaroutes.so1v3ue.mongodb.net/apka-travel

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Client URL
CLIENT_URL=http://localhost:3000

# API Keys (Add your actual keys)
OPENAI_API_KEY=your-openai-api-key
WEATHER_API_KEY=your-weather-api-key
UNSPLASH_API_KEY=your-unsplash-api-key
```

#### Client Configuration (.env.local)
Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# External API Keys
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_WEATHER_API_KEY=your-openweathermap-api-key
NEXT_PUBLIC_UNSPLASH_API_KEY=your-unsplash-api-key

# Map Configuration
NEXT_PUBLIC_MAP_DEFAULT_CENTER_LAT=32.0853
NEXT_PUBLIC_MAP_DEFAULT_CENTER_LNG=34.7818
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=8
```

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Database will be created automatically on first run

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and get connection string
3. Update `MONGODB_URI` in `server/.env`

### 5. API Keys Setup

#### OpenAI API (for AI route generation)
1. Get API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to both environment files

#### OpenWeatherMap API (for weather data)
1. Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Add to environment files

#### Unsplash API (for country images)
1. Get API key from [Unsplash Developers](https://unsplash.com/developers)
2. Add to environment files

## 🎮 Running the Application

### Development Mode

```bash
# Start both server and client in development mode
npm run dev

# OR run separately:
# Terminal 1 (Server)
npm run server

# Terminal 2 (Client)
npm run client
```

**Access Points:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:9000/api
- **Server Health Check**: http://localhost:9000/api/health

### Production Mode

```bash
# Build the client
npm run build

# Start production servers
npm start
```

## 📖 Usage Guide

### 1. User Registration & Authentication
1. Navigate to http://localhost:3000
2. Click "Sign Up" to create account
3. Fill in username, email, and password
4. System encrypts password with bcrypt and salt
5. JWT tokens issued for authentication

### 2. Route Planning
1. Go to "Route Planning" page
2. Select country/city, trip type (cycling/trekking), and duration
3. AI generates optimized route with:
   - Real road/trail routing (no straight lines)
   - Daily distance breakdowns
   - Weather forecasts
4. Review and approve route to save

### 3. Route History
1. Visit "Route History" page
2. View all saved routes
3. Click route for updated weather forecast
4. Create similar routes based on saved ones

## 🔒 Authentication Flow

### JWT Implementation
- **Access Token**: 15-minute expiry, used for API requests
- **Refresh Token**: 1-day expiry, used for silent renewal
- **Middleware**: Protects all planning and history routes
- **Auto-refresh**: Silent token renewal every 14 minutes

### Security Features
- Password hashing with bcrypt and unique salt
- Rate limiting on auth endpoints
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Helmet.js for security headers

## 🗺️ Route Generation

### AI Integration
The system uses LLM models to generate realistic routes based on:
- Geographic constraints
- Trip type requirements
- Duration preferences
- Real road/trail networks

### Route Types

#### 🚴‍♂️ Cycling Routes
- **Duration**: 2-3 consecutive days
- **Distance**: 30-70 km per day
- **Type**: City-to-city linear routes
- **Routing**: Real roads and bike paths

#### 🥾 Trekking Routes
- **Duration**: 1-3 days
- **Distance**: 5-10 km per day
- **Type**: Circular routes (return to start)
- **Routing**: Hiking trails and walking paths

## 🌤️ Weather Integration

- **Forecast Period**: 3 days starting tomorrow
- **Data Source**: OpenWeatherMap API
- **Display**: Temperature, conditions, and icons
- **Updates**: Fresh forecast when viewing saved routes

## 🚀 Deployment

### Cloud Deployment Options

#### Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd client
vercel --prod
```

#### Railway/Heroku (for Backend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically from main branch

#### Full Stack Deployment
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: MongoDB Atlas (cloud)

### Environment Variables for Production
Update all instances of:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` (use strong, unique keys)
- `MONGODB_URI` (cloud database connection)
- `CLIENT_URL` and `NEXT_PUBLIC_API_URL` (production URLs)
- API keys for external services

## 🧪 Testing

### Manual Testing
1. User registration and login
2. Route generation for both cycling and trekking
3. Weather forecast display
4. Route approval and saving
5. Route history viewing and searching

### API Testing
```bash
# Health check
curl http://localhost:9000/api/health

# Register user
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## 🐛 Known Issues & Limitations

### Current Limitations
- Large route datasets may take a few seconds to optimize for storage
- Weather forecast limited to 3-day window
- Map requires internet connection for tile loading

### Implemented Features
- ✅ **Real OpenAI/GPT integration** for intelligent route generation
- ✅ **Live OpenWeatherMap API** for accurate weather forecasts  
- ✅ **OSRM Navigation API** for realistic road/trail routing
- ✅ **OpenStreetMap Nominatim** for dynamic city geocoding
- ✅ **Unsplash API** integration for country-specific images

### Future Enhancements
- Advanced route optimization algorithms
- Offline map support
- Social features (route sharing)
- Mobile app development
- Route difficulty ratings

## 👥 Team Information

**Project Team**: [Add Your Name(s) Here]
**Course**: Web Platform Development - Final Project 2026
**GitHub Repository**: [Add Your GitHub Repository URL]
**Cloud Deployment**: [Add Your Cloud Deployment URL when deployed]
**Presentation Date**: [Add Your Defense Date]

## 🎯 Assignment Compliance

This project fully meets all requirements from "פרויקט סיום 2026 - פיתוח בפלטפורמת WEB":

✅ **Express Server**: JWT authentication, bcrypt + salt encryption  
✅ **Next.js Client**: Middleware-protected routes, smooth token refresh  
✅ **Home Page**: "מסלול טיולים אפקה 2026" title  
✅ **Route Planning**: LLM-powered with Leaflet maps  
✅ **Route History**: Database retrieval with weather updates  
✅ **Cycling Routes**: 30-70km, 2-3 days, city-to-city  
✅ **Trekking Routes**: 5-10km, 1-3 days, circular  
✅ **Real Routing**: OSRM API (not straight lines)  
✅ **Weather Integration**: 3-day forecasts for route execution  
✅ **Country Images**: Real photos from Unsplash API  
✅ **User Approval**: Route validation before database storage

## 📝 Project Structure Details

### Database Schema
```javascript
// User Schema
{
  username: String (unique, 3-30 chars),
  email: String (unique, validated),
  password: String (bcrypt hashed),
  salt: String (unique per user),
  createdAt: Date
}

// Route Schema
{
  userId: ObjectId (ref: User),
  routeName: String,
  country: String,
  city: String,
  tripType: String (cycling/trekking),
  duration: Number,
  routeData: {
    coordinates: [[Number]], // lat/lng pairs
    dailySegments: [...],
    totalDistance: Number,
    description: String,
    countryImage: String
  },
  weatherData: Mixed,
  approved: Boolean,
  createdAt: Date
}
```

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/verify` - Token verification
- `POST /api/routes` - Save route
- `GET /api/routes` - Get user routes
- `GET /api/routes/:id` - Get specific route
- `PATCH /api/routes/:id/approve` - Approve route

## 📄 License

This project is created for educational purposes as part of the Web Platform Development course, 2026.

---

**Good Luck with your Final Project Defense! 🎓**

*For questions or issues, please check the GitHub issues or contact the development team.*