const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mongoose = require('mongoose');
const reconnectAuto = require('../models/reconnect');
const { PermissionsBitField } = require('discord.js');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Passport configuration must come after we require config
const config = require('../config/config');

// Session store configuration - MongoDB for persistence
const sessionStore = MongoStore.create({
  mongoUrl: config.Mongo || process.env.MONGO_URI,
  collectionName: 'sessions',
  ttl: 60 * 60 * 24 * 30, // 30 days in seconds
  autoRemove: 'native',
  touchAfter: 24 * 3600, // Lazy session update (update once per 24 hours)
  crypto: {
    secret: config.sessionSecret // Encrypt session data
  }
});

// Session store event handlers
sessionStore.on('error', (error) => {
  console.error('❌ Session Store Error:', error);
});

sessionStore.on('create', (sessionId) => {
  console.log('✅ New session created:', sessionId);
});

sessionStore.on('touch', (sessionId) => {
  console.log('🔄 Session refreshed:', sessionId);
});

sessionStore.on('destroy', (sessionId) => {
  console.log('🗑️ Session destroyed:', sessionId);
});

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // Use MongoDB to store sessions
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days - persistent session
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' // Helps with OAuth redirects
  },
  rolling: true, // Reset maxAge on every request
  name: 'TitanXMusic.sid' // Custom session cookie name
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new DiscordStrategy({
  clientID: config.clientId,
  clientSecret: config.clientSecret,
  callbackURL: config.dashboardUrl + '/auth/discord/callback',
  scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
  // Store access token in profile for later use
  profile.accessToken = accessToken;
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/?login=required');
}

// Routes
app.get('/', async (req, res) => {
  const isLoggedIn = req.isAuthenticated();
  const userInfo = isLoggedIn ? req.user : null;
  
  // Get real bot stats
  const clientInstance = require('../index');
  let botStats = {
    totalGuilds: '1,000+',
    totalUsers: '50K+',
    uptime: '99.9%',
    activePlayers: '24/7'
  };
  
  if (clientInstance && clientInstance.guilds) {
    try {
      const totalGuilds = clientInstance.guilds.cache.size;
      const totalUsers = clientInstance.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
      const totalPlayers = clientInstance.manager ? clientInstance.manager.players.size : 0;
      
      botStats = {
        totalGuilds: totalGuilds > 1000 ? (totalGuilds / 1000).toFixed(1) + 'K+' : totalGuilds.toLocaleString(),
        totalUsers: totalUsers > 1000 ? (totalUsers / 1000).toFixed(1) + 'K+' : totalUsers.toLocaleString(),
        uptime: '99.9%',
        activePlayers: totalPlayers.toLocaleString()
      };
    } catch (error) {
      console.error('Error fetching bot stats:', error);
    }
  }
  
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zeta Music - Premium Discord Music Bot | High Quality Audio & 24/7 Uptime</title>
        <meta name="description" content="Zeta Music is the ultimate Discord music bot with high-quality audio, 24/7 uptime, and advanced features. Join thousands of servers enjoying crystal clear music.">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
        <style>
          :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --primary-light: #60a5fa;
            --secondary: #8b5cf6;
            --accent: #06b6d4;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark-bg: #0a0e27;
            --dark-surface: #0f1729;
            --dark-surface-2: #1a1f3a;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            scroll-behavior: smooth;
          }
          
          body { 
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, var(--dark-bg) 0%, var(--dark-surface-2) 50%, var(--dark-surface) 100%);
            color: white; 
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
          }
          
          /* Animated background */
          .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            overflow: hidden;
            pointer-events: none;
          }
          
          .particle {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent);
            animation: float linear infinite;
          }
          
          @keyframes float {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) rotate(360deg);
              opacity: 0;
            }
          }
          
          /* Navigation */
          .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }
          
          .navbar.scrolled {
            background: rgba(10, 14, 39, 0.95);
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
          }
          
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .logo {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-decoration: none;
          }
          
          .logo i {
            font-size: 36px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .nav-menu {
            display: flex;
            align-items: center;
            gap: 40px;
            list-style: none;
          }
          
          .nav-menu a {
            color: #cbd5e1;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
          }
          
          .nav-menu a:hover {
            color: var(--primary-light);
          }
          
          .nav-menu a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--primary), var(--primary-light));
            transition: width 0.3s ease;
          }
          
          .nav-menu a:hover::after {
            width: 100%;
          }
          
          .nav-actions {
            display: flex;
            gap: 15px;
          }
          
          .btn {
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            border: none;
            font-size: 16px;
          }
          
          .btn-outline {
            color: var(--primary-light);
            border: 2px solid var(--primary);
            background: transparent;
          }
          
          .btn-outline:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
          }
          
          .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
            position: relative;
            overflow: hidden;
          }
          
          .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(59, 130, 246, 0.6);
          }
          
          .btn-primary::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s;
          }
          
          .btn-primary:hover::before {
            left: 100%;
          }
          
          .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
          }
          
          /* Hero Section */
          .hero {
            padding: 180px 20px 100px;
            text-align: center;
            position: relative;
            z-index: 1;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .hero-content {
            max-width: 900px;
            margin: 0 auto;
            animation: fadeInUp 1s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .hero-badge {
            display: inline-block;
            padding: 10px 25px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 50px;
            color: var(--primary-light);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 30px;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
            }
            50% {
              box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
            }
          }
          
          .hero h1 {
            font-size: 72px;
            font-weight: 900;
            margin-bottom: 25px;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.1;
            letter-spacing: -2px;
          }
          
          .hero-highlight {
            color: var(--secondary);
            position: relative;
            display: inline-block;
          }
          
          .hero p {
            font-size: 24px;
            color: #94a3b8;
            margin-bottom: 50px;
            line-height: 1.7;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .hero-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 60px;
          }
          
          .hero-stats {
            display: flex;
            gap: 50px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 60px;
          }
          
          .hero-stat {
            text-align: center;
            opacity: 0;
            animation: slideInUp 0.6s ease-out forwards;
          }
          
          .hero-stat:nth-child(1) { animation-delay: 0.1s; }
          .hero-stat:nth-child(2) { animation-delay: 0.2s; }
          .hero-stat:nth-child(3) { animation-delay: 0.3s; }
          .hero-stat:nth-child(4) { animation-delay: 0.4s; }
          
          .hero-stat-number {
            font-size: 48px;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 5px;
            position: relative;
            display: inline-block;
          }
          
          .hero-stat-number::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            opacity: 0;
            animation: fadeIn 0.5s ease 0.8s forwards;
          }
          
          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
          
          .hero-stat-label {
            color: #94a3b8;
            font-size: 16px;
          }
          
          /* Features Section */
          .section {
            padding: 100px 20px;
            position: relative;
            z-index: 1;
          }
          
          .section-header {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 70px;
          }
          
          .section-badge {
            display: inline-block;
            padding: 8px 20px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 50px;
            color: var(--primary-light);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .section-description {
            font-size: 20px;
            color: #94a3b8;
            line-height: 1.7;
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 40px;
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .feature-card {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(10px);
            padding: 50px;
            border-radius: 25px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
            opacity: 0;
            animation: fadeInScale 0.6s ease-out forwards;
          }
          
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .feature-card:nth-child(1) { animation-delay: 0.1s; }
          .feature-card:nth-child(2) { animation-delay: 0.2s; }
          .feature-card:nth-child(3) { animation-delay: 0.3s; }
          .feature-card:nth-child(4) { animation-delay: 0.4s; }
          .feature-card:nth-child(5) { animation-delay: 0.5s; }
          .feature-card:nth-child(6) { animation-delay: 0.6s; }
          .feature-card:nth-child(7) { animation-delay: 0.7s; }
          .feature-card:nth-child(8) { animation-delay: 0.8s; }
          
          .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .feature-card:hover {
            transform: translateY(-15px);
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 0 25px 60px rgba(59, 130, 246, 0.4);
          }
          
          .feature-card:hover::before {
            opacity: 1;
          }
          
          .feature-icon {
            width: 90px;
            height: 90px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            font-size: 40px;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          
          .feature-card:hover .feature-icon {
            transform: scale(1.1) rotate(5deg);
          }
          
          .feature-card h3 {
            font-size: 26px;
            margin-bottom: 15px;
            color: #e2e8f0;
          }
          
          .feature-card p {
            color: #94a3b8;
            line-height: 1.8;
            font-size: 16px;
          }
          
          /* Commands Section */
          .commands-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .command-category {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            transition: all 0.3s ease;
          }
          
          .command-category:hover {
            transform: translateY(-5px);
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 0 15px 40px rgba(59, 130, 246, 0.3);
          }
          
          .command-category h3 {
            font-size: 24px;
            margin-bottom: 25px;
            color: var(--primary-light);
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .command-list {
            list-style: none;
          }
          
          .command-item {
            padding: 12px 0;
            border-bottom: 1px solid rgba(59, 130, 246, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #94a3b8;
            font-size: 15px;
          }
          
          .command-item:last-child {
            border-bottom: none;
          }
          
          .command-name {
            font-weight: 600;
            color: #e2e8f0;
          }
          
          /* FAQ Section */
          .faq-container {
            max-width: 900px;
            margin: 0 auto;
          }
          
          .faq-item {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .faq-item:hover {
            border-color: rgba(59, 130, 246, 0.5);
          }
          
          .faq-question {
            font-size: 20px;
            font-weight: 600;
            color: #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .faq-answer {
            margin-top: 20px;
            color: #94a3b8;
            line-height: 1.8;
            font-size: 16px;
            display: none;
          }
          
          .faq-item.active .faq-answer {
            display: block;
          }
          
          .faq-icon {
            transition: transform 0.3s ease;
          }
          
          .faq-item.active .faq-icon {
            transform: rotate(180deg);
          }
          
          /* Footer */
          .footer {
            background: rgba(15, 23, 42, 0.9);
            border-top: 1px solid rgba(59, 130, 246, 0.2);
            padding: 60px 20px 30px;
            position: relative;
            z-index: 1;
          }
          
          .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .footer-section h4 {
            font-size: 20px;
            margin-bottom: 20px;
            color: var(--primary-light);
          }
          
          .footer-links {
            list-style: none;
          }
          
          .footer-links li {
            margin-bottom: 12px;
          }
          
          .footer-links a {
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .footer-links a:hover {
            color: var(--primary-light);
            transform: translateX(5px);
          }
          
          .social-links {
            display: flex;
            gap: 15px;
          }
          
          .social-link {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-light);
            text-decoration: none;
            transition: all 0.3s ease;
          }
          
          .social-link:hover {
            background: var(--primary);
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
          }
          
          .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(59, 130, 246, 0.1);
            color: #94a3b8;
          }
          
          /* Responsive */
          @media (max-width: 1024px) {
            .nav-menu {
              display: none;
            }
            
            .mobile-menu-btn {
              display: block;
            }
          }
          
          @media (max-width: 768px) {
            .hero h1 {
              font-size: 48px;
            }
            
            .hero p {
              font-size: 18px;
            }
            
            .section-title {
              font-size: 36px;
            }
            
            .features-grid,
            .commands-grid {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 480px) {
            .nav-container {
              padding: 15px 20px;
            }
            
            .hero {
              padding: 140px 20px 80px;
            }
            
            .hero h1 {
              font-size: 36px;
            }
            
            .hero p {
              font-size: 16px;
            }
            
            .hero-buttons {
              flex-direction: column;
            }
            
            .btn {
              width: 100%;
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="particles" id="particles"></div>
        
        <!-- Navigation -->
        <nav class="navbar" id="navbar">
          <div class="nav-container">
            <a href="#" class="logo">
              <i class="fas fa-music"></i>
              <span>TitanXMusic</span>
            </a>
            
            <ul class="nav-menu">
              <li><a href="#features">Features</a></li>
              <li><a href="#commands">Commands</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="${config.ssLink}" target="_blank">Support</a></li>
            </ul>
            
            <div class="nav-actions">
              <a href="${config.invite}" target="_blank" class="btn btn-outline">
                <i class="fas fa-plus"></i>
                Add to Discord
              </a>
              ${isLoggedIn ? `
                <a href="/dashboard" class="btn btn-primary">
                  <i class="fas fa-tachometer-alt"></i>
                  Dashboard
                </a>
              ` : `
                <a href="/auth/discord" class="btn btn-primary">
                  <i class="fab fa-discord"></i>
                  Login
                </a>
              `}
            </div>
            
            <button class="mobile-menu-btn">
              <i class="fas fa-bars"></i>
            </button>
          </div>
        </nav>
        
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-content">
            <div class="hero-badge">
              <i class="fas fa-star"></i>
              #1 Music Bot for Discord
            </div>
            
            <h1>
              Premium Music<br>
              Experience for <span class="hero-highlight">Discord</span>
            </h1>
            
            <p>
              TitanXMusic brings high-quality music streaming to your Discord server with 24/7 uptime, 
              advanced audio filters, and an intuitive dashboard. Join thousands of servers enjoying 
              the best music experience.
            </p>
            
            <div class="hero-buttons">
              ${isLoggedIn ? `
                <a href="/dashboard" class="btn btn-primary" style="padding: 18px 40px; font-size: 18px;">
                  <i class="fas fa-tachometer-alt"></i>
                  Go to Dashboard
                </a>
              ` : `
                <a href="/auth/discord" class="btn btn-primary" style="padding: 18px 40px; font-size: 18px;">
                  <i class="fab fa-discord"></i>
                  Login to Dashboard
                </a>
              `}
              <a href="${config.invite}" target="_blank" class="btn btn-outline" style="padding: 18px 40px; font-size: 18px;">
                <i class="fas fa-plus"></i>
                Invite Zeta Music
              </a>
            </div>
            
            <div class="hero-stats">
              <div class="hero-stat" data-aos="fade-up" data-aos-delay="100">
                <div class="hero-stat-number counter" data-target="${botStats.totalGuilds}">${botStats.totalGuilds}</div>
                <div class="hero-stat-label">Active Servers</div>
              </div>
              <div class="hero-stat" data-aos="fade-up" data-aos-delay="200">
                <div class="hero-stat-number counter" data-target="${botStats.totalUsers}">${botStats.totalUsers}</div>
                <div class="hero-stat-label">Happy Users</div>
              </div>
              <div class="hero-stat" data-aos="fade-up" data-aos-delay="300">
                <div class="hero-stat-number">${botStats.uptime}</div>
                <div class="hero-stat-label">Uptime</div>
              </div>
              <div class="hero-stat" data-aos="fade-up" data-aos-delay="400">
                <div class="hero-stat-number counter" data-target="${botStats.activePlayers}">${botStats.activePlayers}</div>
                <div class="hero-stat-label">Active Players</div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Features Section -->
        <section class="section" id="features">
          <div class="section-header">
            <div class="section-badge">Features</div>
            <h2 class="section-title">Why Choose TitanXMusic?</h2>
            <p class="section-description">
              Experience the most advanced Discord music bot with features designed for the best listening experience.
            </p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-headphones"></i>
              </div>
              <h3>High Quality Audio</h3>
              <p>Stream music in crystal-clear quality with our advanced audio processing technology. Enjoy your favorite songs like never before.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-sliders-h"></i>
              </div>
              <h3>20+ Audio Filters</h3>
              <p>Customize your sound with bass boost, nightcore, vaporwave, 8D, and many more professional audio filters.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3>24/7 Music Mode</h3>
              <p>Keep the music playing non-stop with our reliable 24/7 mode. Perfect for community servers and lounges.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-tachometer-alt"></i>
              </div>
              <h3>Web Dashboard</h3>
              <p>Control everything from our beautiful web dashboard. Manage playlists, filters, and settings with ease.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-list-ol"></i>
              </div>
              <h3>Queue Management</h3>
              <p>Advanced queue system with shuffle, loop, remove, and skip features. Full control over your music.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-search"></i>
              </div>
              <h3>Multi-Platform Search</h3>
              <p>Search and play from YouTube, Spotify, SoundCloud, Apple Music, and more. All in one place.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-microphone"></i>
              </div>
              <h3>Lyrics Display</h3>
              <p>View real-time synchronized lyrics for your favorite songs. Sing along with perfect timing.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <h3>Role Permissions</h3>
              <p>Set up DJ roles and customize who can control the music. Keep your server organized and secure.</p>
            </div>
          </div>
        </section>
        
        <!-- Commands Section -->
        <section class="section" id="commands">
          <div class="section-header">
            <div class="section-badge">Commands</div>
            <h2 class="section-title">Powerful Commands</h2>
            <p class="section-description">
              Simple and intuitive commands to control your music experience.
            </p>
          </div>
          
          <div class="commands-grid">
            <div class="command-category">
              <h3>
                <i class="fas fa-music"></i>
                Music Commands
              </h3>
              <ul class="command-list">
                <li class="command-item">
                  <span class="command-name">?play</span>
                  <span>Play a song</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?pause</span>
                  <span>Pause music</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?skip</span>
                  <span>Skip current song</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?stop</span>
                  <span>Stop playback</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?queue</span>
                  <span>View queue</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?nowplaying</span>
                  <span>Current song info</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?forward</span>
                  <span>Forward track by seconds</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?rewind</span>
                  <span>Rewind track by seconds</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?move</span>
                  <span>Move track in queue</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?speed</span>
                  <span>Change playback speed</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?pitch</span>
                  <span>Change track pitch</span>
                </li>
              </ul>
            </div>
            
            <div class="command-category">
              <h3>
                <i class="fas fa-sliders-h"></i>
                Filter Commands
              </h3>
              <ul class="command-list">
                <li class="command-item">
                  <span class="command-name">?bassboost</span>
                  <span>Bass boost filter</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?nightcore</span>
                  <span>Nightcore effect</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?vaporwave</span>
                  <span>Vaporwave filter</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?8d</span>
                  <span>8D audio effect</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?daycore</span>
                  <span>Slowed + reverb</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?reset</span>
                  <span>Remove all filters</span>
                </li>
              </ul>
            </div>
            
            <div class="command-category">
              <h3>
                <i class="fas fa-cog"></i>
                Setup Commands
              </h3>
              <ul class="command-list">
                <li class="command-item">
                  <span class="command-name">?247</span>
                  <span>Toggle 24/7 mode</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?djrole</span>
                  <span>Set DJ role</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?prefix</span>
                  <span>Change prefix</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?volume</span>
                  <span>Adjust volume</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?loop</span>
                  <span>Toggle loop mode</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?autoplay</span>
                  <span>Auto-play similar</span>
                </li>
              </ul>
            </div>
            
            <div class="command-category">
              <h3>
                <i class="fas fa-info-circle"></i>
                Info Commands
              </h3>
              <ul class="command-list">
                <li class="command-item">
                  <span class="command-name">?avatar</span>
                  <span>Get user avatar</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?userinfo</span>
                  <span>Get user information</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?serverinfo</span>
                  <span>Get server information</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?help</span>
                  <span>View all commands</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?ping</span>
                  <span>Check bot latency</span>
                </li>
                <li class="command-item">
                  <span class="command-name">?stats</span>
                  <span>View bot statistics</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        <!-- FAQ Section -->
        <section class="section" id="faq">
          <div class="section-header">
            <div class="section-badge">FAQ</div>
            <h2 class="section-title">Frequently Asked Questions</h2>
            <p class="section-description">
              Everything you need to know about TitanXMusic.
            </p>
          </div>
          
          <div class="faq-container">
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                How do I add Zeta Music to my server?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Click the "Add to Discord" button, select your server, and authorize the required permissions. Zeta Music will be ready to use immediately!
              </div>
            </div>
            
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                Is TitanXMusic free to use?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Yes! Zeta Music is completely free with all features available. We offer premium features for enhanced experience, but the core functionality is free forever.
              </div>
            </div>
            
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                What music platforms are supported?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Zeta Music supports YouTube, Spotify, SoundCloud, Apple Music, Deezer, and direct links. You can play music from any of these platforms seamlessly.
              </div>
            </div>
            
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                How do I enable 24/7 mode?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Use the command ?247 in your server or enable it from the web dashboard. The bot will stay in your voice channel 24/7 and keep playing music.
              </div>
            </div>
            
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                Can I customize the bot prefix?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Absolutely! Use the ?prefix command followed by your desired prefix. You can also manage this from the web dashboard for easier configuration.
              </div>
            </div>
            
            <div class="faq-item" onclick="toggleFaq(this)">
              <div class="faq-question">
                Where can I get support?
                <i class="fas fa-chevron-down faq-icon"></i>
              </div>
              <div class="faq-answer">
                Join our support server for help, feature requests, and updates. Our team is available 24/7 to assist you with any questions or issues.
              </div>
            </div>
          </div>
        </section>
        
        <!-- Footer -->
        <footer class="footer">
          <div class="footer-content">
            <div class="footer-section">
              <h4>
                <i class="fas fa-music"></i>
                TitanXMusic
              </h4>
              <p style="color: #94a3b8; line-height: 1.7; margin-bottom: 20px;">
                The ultimate Discord music bot with high-quality audio, advanced features, and 24/7 support.
              </p>
              <div class="social-links">
                <a href="${config.ssLink}" target="_blank" class="social-link">
                  <i class="fab fa-discord"></i>
                </a>
                <a href="#" class="social-link">
                  <i class="fab fa-twitter"></i>
                </a>
                <a href="#" class="social-link">
                  <i class="fab fa-github"></i>
                </a>
              </div>
            </div>
            
            <div class="footer-section">
              <h4>Quick Links</h4>
              <ul class="footer-links">
                <li><a href="#features"><i class="fas fa-chevron-right"></i> Features</a></li>
                <li><a href="#commands"><i class="fas fa-chevron-right"></i> Commands</a></li>
                <li><a href="#faq"><i class="fas fa-chevron-right"></i> FAQ</a></li>
                <li><a href="/auth/discord"><i class="fas fa-chevron-right"></i> Dashboard</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Resources</h4>
              <ul class="footer-links">
                <li><a href="${config.ssLink}" target="_blank"><i class="fas fa-chevron-right"></i> Support Server</a></li>
                <li><a href="${config.invite}" target="_blank"><i class="fas fa-chevron-right"></i> Invite Bot</a></li>
                <li><a href="${config.topGg}" target="_blank"><i class="fas fa-chevron-right"></i> Vote for Us</a></li>
                <li><a href="#"><i class="fas fa-chevron-right"></i> Documentation</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Legal</h4>
              <ul class="footer-links">
                <li><a href="#"><i class="fas fa-chevron-right"></i> Terms of Service</a></li>
                <li><a href="#"><i class="fas fa-chevron-right"></i> Privacy Policy</a></li>
                <li><a href="#"><i class="fas fa-chevron-right"></i> Cookie Policy</a></li>
                <li><a href="#"><i class="fas fa-chevron-right"></i> Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p>&copy; 2026 Zeta Music. All rights reserved. Made with <i class="fas fa-heart" style="color: #ef4444;"></i> for Discord communities.</p>
          </div>
        </footer>
        
        <script>
          // Animated particles
          const particlesContainer = document.getElementById('particles');
          for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 100 + 50 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = Math.random() * 20 + 10 + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particlesContainer.appendChild(particle);
          }
          
          // Navbar scroll effect
          window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
              navbar.classList.add('scrolled');
            } else {
              navbar.classList.remove('scrolled');
            }
          });
          
          // FAQ toggle
          function toggleFaq(element) {
            const isActive = element.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(item => {
              item.classList.remove('active');
            });
            if (!isActive) {
              element.classList.add('active');
            }
          }
          
          // Smooth scroll
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              const target = document.querySelector(this.getAttribute('href'));
              if (target) {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            });
          });
          
          // Check for URL parameters and show notifications
          const urlParams = new URLSearchParams(window.location.search);
          
          if (urlParams.get('logout') === 'success') {
            showToast('You have been logged out successfully', 'success');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          if (urlParams.get('login') === 'required') {
            showToast('Please login to access the dashboard', 'info');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          if (urlParams.get('error') === 'auth_failed') {
            showToast('Authentication failed. You may not have permission to access this dashboard.', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Toast notification function
          function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
              toast.classList.add('show');
            }, 100);
            
            setTimeout(() => {
              toast.classList.remove('show');
              setTimeout(() => {
                document.body.removeChild(toast);
              }, 300);
            }, 4000);
          }
        </script>
        
        <style>
          .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            padding: 18px 25px;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: white;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
          }
          
          .toast.show {
            opacity: 1;
            transform: translateY(0);
          }
          
          .toast-success {
            border-color: rgba(16, 185, 129, 0.5);
          }
          
          .toast-error {
            border-color: rgba(239, 68, 68, 0.5);
          }
          
          .toast-info {
            border-color: rgba(59, 130, 246, 0.5);
          }
          
          .toast i {
            font-size: 20px;
          }
          
          .toast-success i {
            color: #10b981;
          }
          
          .toast-error i {
            color: #ef4444;
          }
          
          .toast-info i {
            color: #3b82f6;
          }
          
          @media (max-width: 768px) {
            .toast {
              bottom: 20px;
              right: 20px;
              left: 20px;
              max-width: none;
            }
          }
        </style>
      </body>
      </html>
    `);
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/?error=auth_failed',
    successRedirect: '/dashboard'
  })
);

app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const axios = require('axios');
    
    // Get client instance (avoid circular dependency)
    const clientInstance = require('../index');
    
    // Check if client is ready
    if (!clientInstance || !clientInstance.guilds) {
      return res.status(503).send('Bot is not ready yet. Please try again in a moment.');
    }
    
    // Fetch user's guilds from Discord API
    let userGuilds = [];
    try {
      const response = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${req.user.accessToken}`
        }
      });
      userGuilds = response.data;
    } catch (error) {
      console.error('Error fetching user guilds:', error.message);
    }

    // Filter guilds where user has MANAGE_GUILD permission (admin)
    const MANAGE_GUILD = 0x00000020;
    const adminGuilds = userGuilds.filter(guild => {
      const permissions = parseInt(guild.permissions);
      return (permissions & MANAGE_GUILD) === MANAGE_GUILD || (permissions & 0x8) === 0x8; // MANAGE_GUILD or ADMINISTRATOR
    });

    // Get all guilds the bot is in
    const botGuilds = clientInstance.guilds.cache;
    
    // Map guilds with bot status
    const guilds = (await Promise.all(adminGuilds.map(async guild => {
      const botInGuild = botGuilds.has(guild.id);
      const botGuild = botInGuild ? botGuilds.get(guild.id) : null;

      let ownerTag = null;
      if (botGuild) {
        const cachedOwner = botGuild.members?.cache?.get(botGuild.ownerId);
        const ownerMember = cachedOwner || await botGuild.fetchOwner().catch(() => null);
        ownerTag = ownerMember ? ownerMember.user?.tag : null;
      }

      const channelCache = botGuild?.channels?.cache ?? null;
      const textChannelCount = channelCache ? channelCache.filter(channel => channel.type === 0 || channel.type === 15 || channel.type === 5).size : null;
      const voiceChannelCount = channelCache ? channelCache.filter(channel => channel.type === 2 || channel.type === 13).size : null;

      const joinedTimestamp = botGuild && typeof botGuild.joinedTimestamp === 'number'
        ? botGuild.joinedTimestamp
        : (guild.joined_at ? new Date(guild.joined_at).getTime() : null);

      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
        memberCount: botGuild ? botGuild.memberCount : null,
        botInGuild,
        isOwner: config.ownerIDS.includes(req.user.id),
        ownerTag,
        textChannelCount,
        voiceChannelCount,
        joinedTimestamp
      };
    }))).sort((a, b) => {
      // Sort: Servers with bot first, then servers without bot
      if (a.botInGuild && !b.botInGuild) return -1;
      if (!a.botInGuild && b.botInGuild) return 1;
      // If both have same status, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Get bot stats
    const totalGuilds = clientInstance.guilds.cache.size;
    const totalUsers = clientInstance.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const totalPlayers = clientInstance.manager ? clientInstance.manager.players.size : 0;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TitanXMusic Dashboard - Control Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%);
            color: white; 
            min-height: 100vh;
            position: relative;
          }
          
          /* Animated background */
          .bg-animated {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            background: 
              radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%);
            animation: bgPulse 15s ease-in-out infinite;
          }
          
          @keyframes bgPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          
          .dashboard-container {
            position: relative;
            z-index: 1;
            display: flex;
            min-height: 100vh;
          }
          
          /* Sidebar */
          .sidebar {
            width: 280px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(59, 130, 246, 0.2);
            padding: 30px 20px;
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
          }
          
          .sidebar.collapsed {
            width: 80px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            margin-bottom: 40px;
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          }
          
          .logo-icon {
            font-size: 32px;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .logo-link {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-decoration: none;
            transition: opacity 0.2s ease;
          }
          
          .logo-link:hover {
            opacity: 0.85;
          }
          
          .sidebar-menu {
            flex: 1;
          }
          
          .menu-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #94a3b8;
          }
          
          .menu-item:hover, .menu-item.active {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
            color: #60a5fa;
            transform: translateX(5px);
          }
          
          .menu-item i {
            font-size: 20px;
            width: 25px;
          }
          
          .user-section {
            padding: 20px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          
          .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .user-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            border: 2px solid #3b82f6;
          }
          
          .user-name {
            font-size: 14px;
            font-weight: 600;
            color: #e2e8f0;
          }
          
          /* Main Content */
          .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            max-height: 100vh;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            flex-wrap: wrap;
            gap: 20px;
          }
          
          .header-title {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .header-actions {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          
          .overview-hero {
            position: relative;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(15, 23, 42, 0.92) 100%);
            border-radius: 26px;
            padding: 42px 48px;
            border: 1px solid rgba(59, 130, 246, 0.25);
            box-shadow: 0 40px 80px rgba(15, 23, 42, 0.45);
            margin-bottom: 40px;
            display: grid;
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
            gap: 40px;
            overflow: hidden;
          }

          .overview-hero::before {
            content: '';
            position: absolute;
            inset: auto -180px -180px auto;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, rgba(29, 185, 84, 0.28) 0%, rgba(29, 185, 84, 0) 70%);
            filter: blur(3px);
          }

          .overview-hero-content {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .overview-kicker {
            letter-spacing: 0.22em;
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.6);
          }

          .overview-hero-content h1 {
            font-size: 42px;
            font-weight: 700;
            line-height: 1.08;
            color: #f8fafc;
          }

          .overview-description {
            font-size: 15px;
            color: #cbd5f5;
            line-height: 1.7;
            max-width: 620px;
          }

          .overview-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
          }

          .overview-actions .btn {
            padding: 12px 26px;
          }

          .overview-hero-stats {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }

          .overview-stat {
            background: rgba(15, 23, 42, 0.65);
            border-radius: 16px;
            padding: 16px 20px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            min-width: 140px;
          }

          .overview-stat-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: rgba(255, 255, 255, 0.55);
          }

          .overview-stat-value {
            display: block;
            margin-top: 6px;
            font-size: 24px;
            font-weight: 700;
            color: #f8fafc;
          }

          .overview-hero-widget {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 18px;
            align-items: flex-start;
            justify-content: center;
          }

          .overview-widget-card {
            background: rgba(10, 10, 11, 0.9);
            border-radius: 18px;
            padding: 26px 28px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 55px rgba(0, 0, 0, 0.45);
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 240px;
          }

          .widget-metric {
            font-size: 36px;
            font-weight: 700;
            color: #1ed760;
          }

          .widget-subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .widget-caption {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }

          .widget-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 999px;
            background: rgba(29, 185, 84, 0.16);
            color: #1ed760;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(29, 185, 84, 0.28);
          }
          
          .server-filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .filter-btn {
            padding: 10px 20px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            background: rgba(15, 23, 42, 0.6);
            border-radius: 10px;
            color: #94a3b8;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .filter-btn:hover {
            border-color: rgba(59, 130, 246, 0.5);
            color: #60a5fa;
            transform: translateY(-2px);
          }
          
          .filter-btn.active {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
            border-color: #3b82f6;
            color: #60a5fa;
          }
          
          .btn {
            padding: 12px 24px;
            border-radius: 999px;
            border: 1px solid transparent;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
            background: rgba(255, 255, 255, 0.08);
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border-color: rgba(59, 130, 246, 0.25);
          }
          
          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border-color: rgba(239, 68, 68, 0.25);
          }
          
          .btn-success {
            background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
            color: #0a0a0a;
            border-color: rgba(29, 185, 84, 0.4);
            box-shadow: 0 18px 32px rgba(29, 185, 84, 0.25);
          }
          
          .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #0a0a0a;
            border-color: rgba(245, 158, 11, 0.4);
          }
          
          .btn-ghost {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.12);
            color: #e2e8f0;
            box-shadow: none;
          }
          
          .btn-ghost:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.2);
          }
          
          .btn-gradient {
            background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
            color: #0a0a0a;
            border-color: rgba(29, 185, 84, 0.35);
            box-shadow: 0 18px 32px rgba(29, 185, 84, 0.25);
          }
          
          .btn-outline {
            background: transparent;
            border-color: rgba(255, 255, 255, 0.18);
            color: #d1d5db;
          }
          
          .btn-outline:hover {
            background: rgba(255, 255, 255, 0.08);
          }
          
          /* Stats Cards */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }

          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 22px;
            margin-top: 20px;
          }

          .feature-card {
            background: rgba(15, 23, 42, 0.78);
            border-radius: 18px;
            border: 1px solid rgba(59, 130, 246, 0.16);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }

          .feature-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 18px 36px rgba(15, 23, 42, 0.45);
            border-color: rgba(59, 130, 246, 0.35);
          }

          .feature-icon {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            background: rgba(59, 130, 246, 0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #60a5fa;
            font-size: 20px;
          }

          .feature-card h3 {
            font-size: 18px;
            font-weight: 600;
            color: #f8fafc;
          }

          .feature-card p {
            font-size: 13px;
            color: #a1accd;
            line-height: 1.6;
          }
          
          .stat-card {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          }
          
          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
          }
          
          .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .stat-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          
          .stat-value {
            font-size: 36px;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 5px;
          }
          
          .stat-label {
            color: #94a3b8;
            font-size: 14px;
          }
          
          /* Guild Cards */
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 25px;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .guild-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
          }
          
          .guild-card {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
            text-align: left;
            border: 1px solid rgba(59, 130, 246, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .guild-card:hover {
            transform: translateY(-10px);
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 0 20px 50px rgba(59, 130, 246, 0.3);
          }
          
          .guild-card-inactive {
            opacity: 0.7;
            border-color: rgba(148, 163, 184, 0.2);
            cursor: default;
          }
          
          .guild-card-inactive:hover {
            transform: translateY(-5px);
            border-color: rgba(148, 163, 184, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }
          
          .guild-icon {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin: 0 auto 20px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          
          .guild-card:hover .guild-icon {
            border-color: #3b82f6;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }
          
          .guild-card-inactive .guild-icon {
            border-color: rgba(148, 163, 184, 0.3);
            opacity: 0.6;
          }
          
          .guild-name {
            font-size: 20px;
            font-weight: 600;
            color: #e2e8f0;
          }

          .guild-card-header {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .guild-chip-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }

          .guild-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.06);
            color: #d1d5db;
          }

          .guild-chip-active {
            background: rgba(29, 185, 84, 0.2);
            border-color: rgba(29, 185, 84, 0.35);
            color: #1ed760;
          }

          .guild-chip-idle {
            background: rgba(239, 68, 68, 0.18);
            border-color: rgba(239, 68, 68, 0.28);
            color: #f87171;
          }

          .guild-chip.subtle {
            background: rgba(148, 163, 184, 0.12);
            border-color: rgba(148, 163, 184, 0.2);
            color: #cbd5f5;
          }

          .guild-card-body {
            margin: 24px 0;
            display: grid;
            gap: 14px;
          }

          .guild-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .guild-stat-label {
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
          }

          .guild-stat-value {
            font-size: 14px;
            font-weight: 600;
            color: #f8fafc;
          }

          .guild-insights {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 14px;
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(59, 130, 246, 0.14);
            color: #9aa0b5;
            font-size: 13px;
            line-height: 1.6;
          }

          .guild-insights i {
            color: #60a5fa;
            margin-top: 2px;
          }

          .guild-card-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .guild-card-footer .btn,
          .guild-card-footer a.btn {
            flex: 1 1 auto;
            justify-content: center;
          }
          
          /* Control Panel */
          .control-panel {
            position: relative;
            margin-top: 30px;
            padding: 45px;
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(10, 10, 11, 0.88);
            overflow: hidden;
            box-shadow: 0 45px 90px rgba(0, 0, 0, 0.55);
          }

          .control-panel::before {
            content: '';
            position: absolute;
            inset: -120px auto auto -120px;
            width: 360px;
            height: 360px;
            background: radial-gradient(circle, rgba(29, 185, 84, 0.35) 0%, rgba(29, 185, 84, 0) 70%);
            filter: blur(2px);
            opacity: 0.7;
          }

          .control-panel::after {
            content: '';
            position: absolute;
            inset: auto -140px -140px auto;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0) 70%);
            filter: blur(2px);
            opacity: 0.6;
          }

          .control-header {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            flex-wrap: wrap;
            margin-bottom: 36px;
          }

          .control-heading {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 640px;
          }

          .control-chip {
            align-self: flex-start;
            padding: 6px 14px;
            border-radius: 999px;
            background: rgba(29, 185, 84, 0.18);
            color: #1ed760;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 11px;
            font-weight: 700;
          }

          .control-title {
            font-size: 36px;
            font-weight: 700;
            color: #f8fafc;
            line-height: 1.1;
          }

          .control-subtitle {
            color: #9aa0b5;
            font-size: 15px;
            line-height: 1.6;
          }

          .control-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .player-layout {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
            gap: 32px;
            z-index: 1;
          }

          .player-column {
            display: grid;
            gap: 24px;
          }

          .player-card {
            position: relative;
            background: rgba(18, 18, 18, 0.92);
            border-radius: 24px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 35px 70px rgba(0, 0, 0, 0.45);
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .player-card p {
            color: #9aa0b5;
            font-size: 14px;
            line-height: 1.6;
          }

          .player-card h3 {
            font-size: 20px;
            font-weight: 600;
            color: #f8fafc;
          }

          .now-playing-card {
            background: linear-gradient(135deg, rgba(29, 185, 84, 0.18), rgba(25, 25, 25, 0.92));
            overflow: hidden;
          }

          .now-playing-shell {
            display: flex;
            gap: 24px;
            align-items: center;
          }

          .album-art {
            width: 148px;
            height: 148px;
            border-radius: 24px;
            background: linear-gradient(135deg, rgba(30, 215, 96, 0.8) 0%, rgba(15, 167, 255, 0.6) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #0a0a0a;
            box-shadow: 0 25px 45px rgba(29, 185, 84, 0.35);
          }

          .now-playing-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 700;
          }

          .now-playing-title {
            font-size: 28px;
            font-weight: 700;
            color: #f8fafc;
          }

          .now-playing-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a1a7bb;
            font-size: 14px;
          }

          .now-playing-actions {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .input-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .input-row.wrap {
            flex-wrap: wrap;
          }

          .input-row .btn {
            white-space: nowrap;
          }

          .form-group {
            margin-bottom: 0;
          }

          .form-label {
            display: block;
            color: rgba(255, 255, 255, 0.65);
            font-size: 13px;
            letter-spacing: 0.02em;
          }

          .form-input {
            width: 100%;
            padding: 14px 18px;
            background: rgba(12, 12, 12, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            color: #f8fafc;
            font-size: 14px;
            transition: all 0.25s ease;
          }

          .form-input:focus {
            outline: none;
            border-color: rgba(29, 185, 84, 0.45);
            box-shadow: 0 0 0 4px rgba(29, 185, 84, 0.18);
          }

          select.form-input {
            cursor: pointer;
            padding-right: 38px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            appearance: none;
          }

          .source-select {
            max-width: 190px;
          }

          .transport-controls {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
          }

          .transport-button {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: #f8fafc;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.25s ease;
          }

          .transport-button:hover {
            border-color: rgba(255, 255, 255, 0.28);
            transform: translateY(-2px) scale(1.03);
            background: rgba(255, 255, 255, 0.1);
          }

          .transport-button.primary {
            background: #1db954;
            border-color: #1db954;
            color: #0a0a0a;
            font-size: 20px;
            box-shadow: 0 16px 30px rgba(29, 185, 84, 0.35);
          }

          .transport-button.danger {
            border-color: rgba(239, 68, 68, 0.45);
            color: #ef4444;
          }

          .search-card .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .input-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .spotify-results {
            display: grid;
            gap: 12px;
            max-height: 480px;
            overflow-y: auto;
            padding-right: 4px;
          }

          .spotify-track {
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr) auto;
            align-items: center;
            gap: 18px;
            padding: 16px 18px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.03);
            transition: all 0.25s ease;
          }

          .spotify-track:hover {
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.45);
          }

          .spotify-track-thumbnail {
            width: 72px;
            height: 72px;
            border-radius: 14px;
            object-fit: cover;
            background: rgba(255, 255, 255, 0.06);
          }

          .spotify-track-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.3);
            font-size: 32px;
          }

          .spotify-track-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .spotify-track-title {
            font-size: 16px;
            font-weight: 600;
            color: #f8fafc;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .spotify-track-artist {
            font-size: 13px;
            color: #9aa0b5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .spotify-track-duration {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.55);
          }

          .spotify-track > div:last-child {
            display: flex;
            gap: 8px;
          }

          .spotify-track-actions {
            display: flex;
            gap: 8px;
          }

          .spotify-track-add {
            padding: 10px 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #f8fafc;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .spotify-track-add:hover {
            background: #1db954 !important;
            border-color: #1db954 !important;
            color: #0a0a0a !important;
            box-shadow: 0 16px 28px rgba(29, 185, 84, 0.35);
          }

          .spotify-track-add.primary {
            background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
            border-color: rgba(29, 185, 84, 0.35);
            color: #0a0a0a;
            box-shadow: 0 18px 32px rgba(29, 185, 84, 0.25);
          }

          .spotify-track-add.secondary {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.14);
          }

          .utilities-card {
            padding: 0;
          }

          .utility-grid {
            display: grid;
            gap: 1px;
            border-radius: 24px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.04);
          }

          .utility-block {
            background: rgba(14, 14, 16, 0.96);
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .utility-block.full {
            grid-column: 1 / -1;
          }

          .utility-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
          }

          .utility-header p {
            margin-top: -6px;
            font-size: 13px;
          }

          .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .button-group .btn {
            flex: 1 1 auto;
            justify-content: center;
          }

          .button-group.compact .btn {
            flex: 0 0 auto;
          }

          .button-group.stacked {
            flex-direction: column;
          }

          .button-group.stacked .btn {
            width: 100%;
          }

          .volume-slider {
            width: 100%;
            height: 6px;
            border-radius: 999px;
            background: linear-gradient(90deg, rgba(29, 185, 84, 0.6) 0%, rgba(255, 255, 255, 0.08) 100%);
            outline: none;
            -webkit-appearance: none;
          }

          .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #1db954;
            box-shadow: 0 8px 16px rgba(29, 185, 84, 0.35);
            cursor: pointer;
          }

          .volume-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #1db954;
            box-shadow: 0 8px 16px rgba(29, 185, 84, 0.35);
            cursor: pointer;
          }

          .volume-display {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            color: #a1a7bb;
            font-size: 13px;
          }

          .volume-value {
            font-size: 20px;
            font-weight: 700;
            color: #1ed760;
          }

          .status-indicator {
            padding: 16px 18px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            font-size: 13px;
          }

          .status-enabled {
            background: rgba(29, 185, 84, 0.15);
            border: 1px solid rgba(29, 185, 84, 0.3);
            color: #1ed760;
          }

          .status-disabled {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
          }

          .player-sidebar .player-card {
            background: rgba(12, 12, 12, 0.88);
          }

          .player-sidebar .btn {
            width: 100%;
            justify-content: center;
          }

          .player-sidebar .button-group {
            width: 100%;
          }

          /* Modal */
          .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .modal.show {
            opacity: 1;
            visibility: visible;
          }

          .modal-content {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid rgba(59, 130, 246, 0.3);
            transform: scale(0.9);
            transition: all 0.3s ease;
          }

          .modal.show .modal-content {
            transform: scale(1);
          }

          .modal-header {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #60a5fa;
          }

          .queue-item {
            padding: 18px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            margin-bottom: 12px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .queue-item-title {
            font-weight: 600;
            color: #f8fafc;
            font-size: 15px;
          }

          .queue-item-author {
            color: #9aa0b5;
            font-size: 13px;
          }

          .hidden {
            display: none !important;
          }

          /* Notifications */
          .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 25px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 2000;
            transform: translateX(400px);
            transition: all 0.3s ease;
            min-width: 300px;
          }
          
          .notification.show {
            transform: translateX(0);
          }
          
          .notification-success {
            border-color: rgba(16, 185, 129, 0.5);
          }
          
          .notification-error {
            border-color: rgba(239, 68, 68, 0.5);
          }
          
          .notification-info {
            border-color: rgba(59, 130, 246, 0.5);
          }
          
          /* Responsive */
          @media (max-width: 1024px) {
            .sidebar {
              position: fixed;
              left: -280px;
              height: 100vh;
              z-index: 100;
            }
            
            .sidebar.open {
              left: 0;
            }
            
            .main-content {
              width: 100%;
            }
            
            .control-grid {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .main-content {
              padding: 20px;
            }
            
            .header-title {
              font-size: 24px;
            }
            
            .stats-grid {
              grid-template-columns: 1fr;
            }
            
            .guild-grid {
              grid-template-columns: 1fr;
            }
            
            .control-panel {
              padding: 25px;
            }
            
            .modal-content {
              padding: 25px;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .header-actions {
              width: 100%;
            }
            
            .btn {
              width: 100%;
              justify-content: center;
            }
            
            .button-group {
              flex-direction: column;
            }
            
            .button-group .btn {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="bg-animated"></div>
        
        <div class="dashboard-container">
          <!-- Sidebar -->
          <aside class="sidebar" id="sidebar">
            <div class="logo-section">
              <i class="fas fa-music logo-icon"></i>
              <a class="logo-link" href="/">TitanXMusic</a>
            </div>
            
            <nav class="sidebar-menu">
              <div class="menu-item active" onclick="showSection('overview')">
                <i class="fas fa-home"></i>
                <span>Overview</span>
              </div>
              <div class="menu-item" onclick="showSection('servers')">
                <i class="fas fa-server"></i>
                <span>Servers</span>
              </div>
              <div class="menu-item" onclick="showSection('music')">
                <i class="fas fa-music"></i>
                <span>Music Control</span>
              </div>
            </nav>
            
            <div class="user-section">
              <div class="user-info">
                <img src="https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png" alt="User" class="user-avatar">
                <div>
                  <div class="user-name">${req.user.username}</div>
                </div>
              </div>
              <a href="/logout" class="btn btn-danger" style="padding: 8px 15px; font-size: 12px;">
                <i class="fas fa-sign-out-alt"></i>
              </a>
            </div>
          </aside>
          
          <!-- Main Content -->
          <main class="main-content">
            <!-- Overview Section -->
            <div id="overviewSection">
              <section class="overview-hero">
                <div class="overview-hero-content">
                  <span class="overview-kicker">Welcome back</span>
                  <h1>Control every beat your community hears.</h1>
                  <p class="overview-description">
                    Zeta Music keeps your Discord servers locked into the perfect rhythm. Queue bangers, tweak audio, and manage sessions effortlessly—from anywhere in the world.
                  </p>
                  <div class="overview-actions">
                    <button class="btn btn-gradient" onclick="showSection('servers')">
                      <i class="fas fa-server"></i>
                      Manage Servers
                    </button>
                    <button class="btn btn-outline" onclick="showSection('music')">
                      <i class="fas fa-headphones"></i>
                      Open Player
                    </button>
                    <button class="btn btn-ghost" onclick="refreshStats()">
                      <i class="fas fa-sync-alt"></i>
                      Refresh Stats
                    </button>
                  </div>
                  <div class="overview-hero-stats">
                    <div class="overview-stat">
                      <span class="overview-stat-label">Servers</span>
                      <span class="overview-stat-value">${totalGuilds}</span>
                    </div>
                    <div class="overview-stat">
                      <span class="overview-stat-label">Members Reached</span>
                      <span class="overview-stat-value">${totalUsers.toLocaleString()}</span>
                    </div>
                    <div class="overview-stat">
                      <span class="overview-stat-label">Active Players</span>
                      <span class="overview-stat-value">${totalPlayers}</span>
                    </div>
                    <div class="overview-stat">
                      <span class="overview-stat-label">Service Uptime</span>
                      <span class="overview-stat-value">99.9%</span>
                    </div>
                  </div>
                </div>
                <div class="overview-hero-widget">
                  <span class="widget-chip">
                    <i class="fas fa-bolt"></i>
                    Live Session Insight
                  </span>
                  <div class="overview-widget-card">
                    <span class="widget-subtitle">Playing Now</span>
                    <span class="widget-metric">${totalPlayers}</span>
                    <p class="widget-caption">
                      Players currently streaming across your synced communities.
                    </p>
                  </div>
                  <div class="overview-widget-card">
                    <span class="widget-subtitle">Audience Reach</span>
                    <span class="widget-metric">${totalUsers.toLocaleString()}</span>
                    <p class="widget-caption">
                      Members ready to vibe with curated playlists and on-demand playback.
                    </p>
                  </div>
                </div>
              </section>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-icon">
                      <i class="fas fa-sliders-h"></i>
                    </div>
                  </div>
                  <div class="stat-value">${totalPlayers}</div>
                  <div class="stat-label">Sessions Managed Today</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-icon">
                      <i class="fas fa-music"></i>
                    </div>
                  </div>
                  <div class="stat-value">${(totalPlayers * 12 || 0).toLocaleString()}</div>
                  <div class="stat-label">Tracks Streamed (est.)</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-icon">
                      <i class="fas fa-users"></i>
                    </div>
                  </div>
                  <div class="stat-value">${totalUsers.toLocaleString()}</div>
                  <div class="stat-label">Community Members</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-icon">
                      <i class="fas fa-server"></i>
                    </div>
                  </div>
                  <div class="stat-value">${totalGuilds}</div>
                  <div class="stat-label">Servers Connected</div>
                </div>
              </div>

              <div class="feature-grid">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="fas fa-headphones"></i>
                  </div>
                  <h3>Immersive Listening</h3>
                  <p>Deliver lag-free audio with 24/7 uptime, advanced filters, and precise volume automation built for communities.</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <h3>Queue Mastery</h3>
                  <p>Curate playlists, reorder tracks, and switch playback sources instantly—Spotify, YouTube, SoundCloud and more.</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <h3>Admin Friendly</h3>
                  <p>Grant moderators precision control with secure access, real-time status updates, and seamless server switching.</p>
                </div>
              </div>
            </div>
            
            <!-- Servers Section -->
            <div id="serversSection" class="section hidden">
              <div class="header">
                <h1 class="header-title">Your Servers</h1>
                <div class="server-filters">
                  <button class="filter-btn active" onclick="filterServers('all')" data-filter="all">
                    <i class="fas fa-th"></i>
                    All Servers
                  </button>
                  <button class="filter-btn" onclick="filterServers('active')" data-filter="active">
                    <i class="fas fa-check-circle"></i>
                    With Bot
                  </button>
                  <button class="filter-btn" onclick="filterServers('inactive')" data-filter="inactive">
                    <i class="fas fa-times-circle"></i>
                    Without Bot
                  </button>
                </div>
              </div>
              
              <div class="guild-grid" id="guildGrid">
          ${guilds.map(guild => `
                  <div class="guild-card ${!guild.botInGuild ? 'guild-card-inactive' : ''}" data-bot-status="${guild.botInGuild ? 'active' : 'inactive'}" ${guild.botInGuild ? `onclick="selectGuild('${guild.id}', '${guild.name.replace(/'/g, "\\'")}')"` : ''}>
                    <div class="guild-card-header">
                      <img src="${guild.icon}" alt="${guild.name}" class="guild-icon">
                      <div>
                        <div class="guild-name">${guild.name}</div>
                        <div class="guild-chip-row">
                          <span class="guild-chip subtle">
                            <i class="fas fa-id-card"></i>
                            ${guild.id}
                          </span>
                          <span class="guild-chip ${guild.botInGuild ? 'guild-chip-active' : 'guild-chip-idle'}">
                            <i class="fas ${guild.botInGuild ? 'fa-check-circle' : 'fa-plug'}"></i>
                            ${guild.botInGuild ? 'Bot Connected' : 'Bot Not Added'}
                          </span>
                          <span class="guild-chip subtle">
                            <i class="fas fa-calendar-alt"></i>
                            Joined ${new Date(guild.joinedTimestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="guild-card-body">
                      <div class="guild-stat">
                        <span class="guild-stat-label">Members</span>
                        <span class="guild-stat-value"><i class="fas fa-users"></i> ${typeof guild.memberCount === 'number' ? guild.memberCount.toLocaleString() : '—'}</span>
                      </div>
                      <div class="guild-stat">
                        <span class="guild-stat-label">Owner</span>
                        <span class="guild-stat-value"><i class="fas fa-crown"></i> ${guild.ownerTag || 'Unknown'}</span>
                      </div>
                      <div class="guild-stat">
                        <span class="guild-stat-label">Text Channels</span>
                        <span class="guild-stat-value"><i class="fas fa-hashtag"></i> ${typeof guild.textChannelCount === 'number' ? guild.textChannelCount.toLocaleString() : '—'}</span>
                      </div>
                      <div class="guild-stat">
                        <span class="guild-stat-label">Voice Channels</span>
                        <span class="guild-stat-value"><i class="fas fa-volume-up"></i> ${typeof guild.voiceChannelCount === 'number' ? guild.voiceChannelCount.toLocaleString() : '—'}</span>
                      </div>
                    </div>
                    <div class="guild-insights">
                      <i class="fas ${guild.botInGuild ? 'fa-bolt' : 'fa-info-circle'}"></i>
                      <div>
                        ${guild.botInGuild ? `You're ready to manage playback instantly. Select this server to open the Spotify-style control center and orchestrate the queue with ease.` : `Invite TitanXMusic to unlock the full control panel—stream music, manage queues, and automate your community's playlists.`}
                      </div>
                    </div>
                    <div class="guild-card-footer">
                      ${guild.botInGuild ? `
                        <button class="btn btn-primary" onclick="selectGuild('${guild.id}', '${guild.name.replace(/'/g, "\\'")}'); event.stopPropagation();">
                          <i class="fas fa-sliders-h"></i>
                          Open Controls
                        </button>
                        <button class="btn btn-outline" onclick="showSection('music'); event.stopPropagation();">
                          <i class="fas fa-headphones"></i>
                          Continue Session
                        </button>
                      ` : `
                        <a href="${config.invite}&guild_id=${guild.id}" target="_blank" class="btn btn-success" onclick="event.stopPropagation();">
                          <i class="fas fa-plus"></i>
                          Invite Bot Now
                        </a>
                        <a href="https://docs.TitanXMusic.app/onboarding" target="_blank" class="btn btn-outline" onclick="event.stopPropagation();">
                          <i class="fas fa-book"></i>
                          Setup Guide
                        </a>
                      `}
                    </div>
            </div>
          `).join('')}
              </div>
        </div>
        
            <!-- Music Control Section -->
            <div id="musicSection" class="section hidden">
              <div class="control-panel">
                <div class="control-header">
                  <div class="control-heading">
                    <span class="control-chip">Music Control</span>
                    <h2 class="control-title" id="currentGuildName">Select a server first</h2>
                    <p class="control-subtitle">Stream, queue and tune playback with a Spotify / YouTube Music inspired experience.</p>
                  </div>
                  <div class="control-actions">
                    <button class="btn btn-outline" onclick="showSection('servers')">
                      <i class="fas fa-exchange-alt"></i>
                      Switch Server
                    </button>
                    <button class="btn btn-gradient" onclick="showQueue()">
                      <i class="fas fa-list-ol"></i>
                      Open Queue
                    </button>
                  </div>
                </div>

                <div class="player-layout">
                  <div class="player-column">
                    <section class="player-card now-playing-card">
                      <div class="now-playing-shell">
                        <div class="album-art">
                          <i class="fas fa-waveform-lines"></i>
                        </div>
                        <div class="now-playing-info">
                          <span class="eyebrow">Now Playing</span>
                          <div class="now-playing-title" id="nowPlayingTitle">Queue is idle</div>
                          <div class="now-playing-meta">
                            <i class="fas fa-broadcast-tower"></i>
                            <span id="nowPlayingSubtitle">Start playback to see track details here.</span>
                          </div>
                        </div>
                      </div>
                      <div class="now-playing-actions">
                        <div class="form-group">
                          <label class="form-label" for="songQuery">Song name or URL</label>
                          <div class="input-row wrap">
                            <input type="text" id="songQuery" class="form-input" placeholder="Type any track, playlist or URL...">
                            <button class="btn btn-gradient" onclick="playSong()">
                              <i class="fas fa-play"></i>
                              Queue &amp; Play
                            </button>
                          </div>
                        </div>
                        <div class="transport-controls">
                          <button class="transport-button" onclick="pauseMusic()" title="Pause">
                            <i class="fas fa-pause"></i>
                          </button>
                          <button class="transport-button primary" onclick="resumeMusic()" title="Play / Resume">
                            <i class="fas fa-play"></i>
                          </button>
                          <button class="transport-button" onclick="skipSong()" title="Skip">
                            <i class="fas fa-forward"></i>
                          </button>
                          <button class="transport-button danger" onclick="stopMusic()" title="Stop">
                            <i class="fas fa-stop"></i>
                          </button>
                        </div>
                      </div>
                    </section>

                    <section class="player-card search-card">
                      <div class="section-heading">
                        <div>
                          <span class="eyebrow">Discovery</span>
                          <h3>Search the catalog</h3>
                        </div>
                      </div>
                      <div class="input-grid">
                        <div class="input-row wrap">
                          <select id="searchSource" class="form-input source-select">
                            <option value="spotify">🎵 Spotify</option>
                            <option value="youtube">📺 YouTube</option>
                            <option value="soundcloud">☁️ SoundCloud</option>
                          </select>
                          <input type="text" id="spotifySearchQuery" class="form-input" placeholder="Search any song, artist or playlist...">
                          <button class="btn btn-primary" onclick="searchMusic()">
                            <i class="fas fa-search"></i>
                            Search
                          </button>
                        </div>
                        <div class="input-row wrap">
                          <input type="text" id="quickPlayQuery" class="form-input" placeholder="Instant search and play...">
                          <button class="btn btn-success" onclick="quickPlay()">
                            <i class="fas fa-play"></i>
                            Play Now
                          </button>
                        </div>
                      </div>
                      <div id="spotifyResults" class="spotify-results"></div>
                    </section>
                  </div>

                  <div class="player-column player-sidebar">
                    <section class="player-card">
                      <div class="utility-header">
                        <span class="eyebrow">Connection</span>
                        <h3><i class="fas fa-volume-up"></i> Voice Channel</h3>
                        <p>Choose where the bot should play music.</p>
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="voiceChannelSelect">Select channel to join</label>
                        <select id="voiceChannelSelect" class="form-input">
                          <option value="">Loading channels...</option>
                        </select>
                      </div>
                      <div class="button-group stacked">
                        <button class="btn btn-gradient" onclick="joinVoiceChannel()">
                          <i class="fas fa-sign-in-alt"></i>
                          Join Channel
                        </button>
                      </div>

                      <div class="utility-header" style="margin-top: 28px;">
                        <span class="eyebrow">Session</span>
                        <h3><i class="fas fa-clock"></i> 24/7 Mode</h3>
                        <p>Keep the bot connected around the clock.</p>
                      </div>
                      <div class="button-group compact">
                        <button class="btn btn-success" onclick="toggle247(true)">
                          <i class="fas fa-check"></i>
                          Enable
                        </button>
                        <button class="btn btn-danger" onclick="toggle247(false)">
                          <i class="fas fa-times"></i>
                          Disable
                        </button>
                      </div>
                      <div id="status247" class="status-indicator status-disabled" style="margin-top: 16px;">
                        <i class="fas fa-circle"></i>
                        Status: Checking...
                      </div>

                      <div class="utility-header" style="margin-top: 28px;">
                        <span class="eyebrow">Output</span>
                        <h3><i class="fas fa-volume-high"></i> Volume</h3>
                        <p>Fine tune the player loudness.</p>
                      </div>
                      <div class="form-group">
                        <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="80" onchange="changeVolume()">
                        <div class="volume-display">
                          <span><i class="fas fa-volume-down"></i> 0%</span>
                          <span class="volume-value" id="volumeValue">80%</span>
                          <span>100% <i class="fas fa-volume-up"></i></span>
                        </div>
                      </div>
                    </section>

                    <section class="player-card utilities-card">
                      <div class="utility-grid">
                        <div class="utility-block">
                          <div class="utility-header">
                            <h3><i class="fas fa-list"></i> Queue Management</h3>
                            <p>Curate what plays next.</p>
                          </div>
                          <div class="button-group">
                            <button class="btn btn-primary" onclick="showQueue()">
                              <i class="fas fa-list-ol"></i>
                              View Queue
                            </button>
                            <button class="btn btn-danger" onclick="clearQueue()">
                              <i class="fas fa-trash"></i>
                              Clear Queue
                            </button>
                          </div>
                        </div>

                        <div class="utility-block">
                          <div class="utility-header">
                            <h3><i class="fas fa-sliders-h"></i> Audio Effects</h3>
                            <p>Instantly apply curated sound filters.</p>
                          </div>
                          <div class="button-group compact">
                            <button class="btn btn-primary" onclick="applyFilter('bassboost')">
                              <i class="fas fa-volume-up"></i>
                              Bass Boost
                            </button>
                            <button class="btn btn-primary" onclick="applyFilter('nightcore')">
                              <i class="fas fa-moon"></i>
                              Nightcore
                            </button>
                            <button class="btn btn-primary" onclick="applyFilter('daycore')">
                              <i class="fas fa-sun"></i>
                              Daycore
                            </button>
                            <button class="btn btn-primary" onclick="applyFilter('8d')">
                              <i class="fas fa-headphones"></i>
                              8D Audio
                            </button>
                            <button class="btn btn-primary" onclick="applyFilter('vaporwave')">
                              <i class="fas fa-palette"></i>
                              Vaporwave
                            </button>
                            <button class="btn btn-warning" onclick="applyFilter('reset')">
                              <i class="fas fa-undo"></i>
                              Reset
                            </button>
                          </div>
                        </div>

                        <div class="utility-block">
                          <div class="utility-header">
                            <h3><i class="fas fa-tachometer-alt"></i> Playback Speed</h3>
                            <p>Match the vibe with precise tempo control.</p>
                          </div>
                          <div class="form-group">
                            <input type="range" id="speedSlider" class="volume-slider" min="0.25" max="4" step="0.25" value="1" onchange="changeSpeed()">
                            <div class="volume-display">
                              <span>0.25x</span>
                              <span class="volume-value" id="speedValue">1.0x</span>
                              <span>4.0x</span>
                            </div>
                          </div>
                          <div class="button-group compact">
                            <button class="btn btn-primary" onclick="setSpeed(0.5)">0.5x</button>
                            <button class="btn btn-primary" onclick="setSpeed(1.0)">1.0x</button>
                            <button class="btn btn-primary" onclick="setSpeed(1.5)">1.5x</button>
                            <button class="btn btn-primary" onclick="setSpeed(2.0)">2.0x</button>
                          </div>
                        </div>

                        <div class="utility-block">
                          <div class="utility-header">
                            <h3><i class="fas fa-music"></i> Pitch Control</h3>
                            <p>Shift the key without leaving the party.</p>
                          </div>
                          <div class="form-group">
                            <input type="range" id="pitchSlider" class="volume-slider" min="0.1" max="5" step="0.1" value="1" onchange="changePitch()">
                            <div class="volume-display">
                              <span>0.1x</span>
                              <span class="volume-value" id="pitchValue">1.0x</span>
                              <span>5.0x</span>
                            </div>
                          </div>
                          <div class="button-group compact">
                            <button class="btn btn-primary" onclick="setPitch(0.5)">Lower</button>
                            <button class="btn btn-primary" onclick="setPitch(1.0)">Normal</button>
                            <button class="btn btn-primary" onclick="setPitch(1.5)">Higher</button>
                            <button class="btn btn-primary" onclick="setPitch(2.0)">Very High</button>
                          </div>
                        </div>

                        <div class="utility-block">
                          <div class="utility-header">
                            <h3><i class="fas fa-terminal"></i> Quick Commands</h3>
                            <p>One-tap access to advanced playback controls.</p>
                          </div>
                          <div class="button-group compact">
                            <button class="btn btn-primary" onclick="executeCommand('shuffle')">
                              <i class="fas fa-random"></i>
                              Shuffle
                            </button>
                            <button class="btn btn-primary" onclick="executeCommand('loop')">
                              <i class="fas fa-repeat"></i>
                              Loop
                            </button>
                            <button class="btn btn-primary" onclick="executeCommand('replay')">
                              <i class="fas fa-redo"></i>
                              Replay
                            </button>
                            <button class="btn btn-primary" onclick="executeCommand('back')">
                              <i class="fas fa-step-backward"></i>
                              Previous
                            </button>
                            <button class="btn btn-primary" onclick="executeCommand('autoplay')">
                              <i class="fas fa-magic"></i>
                              Autoplay
                            </button>
                            <button class="btn btn-danger" onclick="executeCommand('disconnect')">
                              <i class="fas fa-sign-out-alt"></i>
                              Disconnect
                            </button>
                          </div>
                        </div>

                        <div class="utility-block full">
                          <div class="utility-header">
                            <h3><i class="fas fa-forward"></i> Track Navigation</h3>
                            <p>Jump ahead or rewind within the current song.</p>
                          </div>
                          <div class="form-group">
                            <label class="form-label" for="seekSeconds">Forward / Rewind (seconds)</label>
                            <div class="input-row wrap">
                              <input type="number" id="seekSeconds" class="form-input" placeholder="Seconds" value="10" min="1" max="300">
                              <button class="btn btn-outline" onclick="seekTrack('rewind')">
                                <i class="fas fa-backward"></i>
                                Rewind
                              </button>
                              <button class="btn btn-outline" onclick="seekTrack('forward')">
                                <i class="fas fa-forward"></i>
                                Forward
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        
        <!-- Queue Modal -->
        <div id="queueModal" class="modal">
          <div class="modal-content">
            <h2 class="modal-header">
              <i class="fas fa-list"></i>
              Music Queue
            </h2>
            <div id="queueList"></div>
            <button class="btn btn-primary" onclick="closeQueueModal()" style="width: 100%; margin-top: 20px;">
              <i class="fas fa-times"></i>
              Close
            </button>
          </div>
        </div>
        
        <!-- Notification -->
        <div id="notification" class="notification"></div>
        
        <script>
          let selectedGuildId = '';
          
          function showSection(section) {
            document.querySelectorAll('.section, #overviewSection').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            
            switch(section) {
              case 'overview':
                document.getElementById('overviewSection').classList.remove('hidden');
                document.querySelectorAll('.menu-item')[0].classList.add('active');
                break;
              case 'servers':
                document.getElementById('serversSection').classList.remove('hidden');
                document.querySelectorAll('.menu-item')[1].classList.add('active');
                break;
              case 'music':
                if (!selectedGuildId) {
                  showNotification('Please select a server first', 'error');
                  showSection('servers');
                  return;
                }
                document.getElementById('musicSection').classList.remove('hidden');
                document.querySelectorAll('.menu-item')[2].classList.add('active');
                check247Status();
                break;
            }
          }
          
          function selectGuild(guildId, guildName) {
            selectedGuildId = guildId;
            document.getElementById('currentGuildName').textContent = guildName;
            showSection('music');
            showNotification('Server selected: ' + guildName, 'success');
            loadVoiceChannels(guildId);
          }
          
          // Load voice channels for selected server
          function loadVoiceChannels(guildId) {
            fetch('/api/guild/' + guildId + '/channels')
              .then(response => response.json())
              .then(data => {
                const select = document.getElementById('voiceChannelSelect');
                if (data.success) {
                  if (data.channels.length === 0) {
                    select.innerHTML = '<option value="">No voice channels found</option>';
                  } else {
                    select.innerHTML = '<option value="">-- Select a voice channel --</option>' + 
                      data.channels.map(ch => 
                        '<option value="' + ch.id + '">' + ch.name + ' (' + ch.userCount + ' users)</option>'
                      ).join('');
                  }
                } else {
                  select.innerHTML = '<option value="">Error loading channels</option>';
                }
              })
              .catch(() => {
                document.getElementById('voiceChannelSelect').innerHTML = '<option value="">Error loading channels</option>';
              });
          }
          
          // Join voice channel
          function joinVoiceChannel() {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            const channelId = document.getElementById('voiceChannelSelect').value;
            if (!channelId) {
              showNotification('Please select a voice channel', 'error');
              return;
            }
            
            // Store selected channel
            selectedVoiceChannelId = channelId;
            
            fetch('/api/guild/' + selectedGuildId + '/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ channelId: channelId })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification('Joined voice channel successfully!', 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to join voice channel', 'error'));
          }
          
          // Global variable to store selected voice channel
          let selectedVoiceChannelId = null;
          
          // Search Music
          function searchMusic() {
            const query = document.getElementById('spotifySearchQuery').value;
            const source = document.getElementById('searchSource').value;
            
            if (!query) {
              showNotification('Please enter a search query', 'error');
              return;
            }
            
            const resultsDiv = document.getElementById('spotifyResults');
            resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Searching ' + source + '...</div>';
            
            fetch('/api/music/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: query, source: source })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success && data.tracks.length > 0) {
                resultsDiv.innerHTML = data.tracks.map(track => {
                  const thumbnailHtml = track.thumbnail 
                    ? '<img src="' + track.thumbnail + '" alt="' + track.title + '" class="spotify-track-thumbnail">'
                    : '<div class="spotify-track-thumbnail spotify-track-placeholder"><i class="fas fa-music"></i></div>';
                  
                  return '<div class="spotify-track">' +
                    thumbnailHtml +
                    '<div class="spotify-track-info">' +
                      '<div class="spotify-track-title">' + track.title + '</div>' +
                      '<div class="spotify-track-artist">' + track.author + '</div>' +
                      '<div class="spotify-track-duration">' + formatDuration(track.duration) + '</div>' +
                    '</div>' +
                    '<div class="spotify-track-actions">' +
                      '<button class="spotify-track-add primary" data-uri="' + encodeURIComponent(track.uri) + '" onclick="playTrackNow(decodeURIComponent(this.dataset.uri))">' +
                        '<i class="fas fa-play"></i> Play' +
                      '</button>' +
                      '<button class="spotify-track-add secondary" data-uri="' + encodeURIComponent(track.uri) + '" onclick="addTrackToQueue(decodeURIComponent(this.dataset.uri))">' +
                        '<i class="fas fa-plus"></i> Queue' +
                      '</button>' +
                    '</div>' +
                  '</div>';
                }).join('');
              } else {
                resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;">No results found</div>';
              }
            })
            .catch(err => {
              console.error('Search error:', err);
              resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Search failed</div>';
              showNotification('Search failed', 'error');
            });
          }
          
          // Quick Play - Search and play immediately
          function quickPlay() {
            const query = document.getElementById('quickPlayQuery').value;
            const source = document.getElementById('searchSource').value;
            
            if (!query) {
              showNotification('Please enter a song name', 'error');
              return;
            }
            
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            // Get selected voice channel
            const channelId = document.getElementById('voiceChannelSelect').value || selectedVoiceChannelId;
            if (!channelId) {
              showNotification('Please select a voice channel first', 'error');
              return;
            }
            
            showNotification('Searching and playing...', 'info');
            
            // Prepare search query
            let searchQuery = query;
            if (source === 'spotify') {
              searchQuery = 'spsearch:' + query;
            } else if (source === 'youtube') {
              // Use regular YouTube search
              searchQuery = 'ytsearch:' + query;
            } else if (source === 'soundcloud') {
              searchQuery = 'scsearch:' + query;
            }
            
            fetch('/api/music/play', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                guildId: selectedGuildId, 
                query: searchQuery,
                channelId: channelId
              })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification(data.message, 'success');
                document.getElementById('quickPlayQuery').value = '';
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(err => {
              console.error('Play error:', err);
              showNotification('Failed to play track', 'error');
            });
          }
          
          // Play track now
          function playTrackNow(uri) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            const channelId = document.getElementById('voiceChannelSelect').value || selectedVoiceChannelId;
            if (!channelId) {
              showNotification('Please select a voice channel first', 'error');
              return;
            }
            
            fetch('/api/music/play', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                guildId: selectedGuildId, 
                query: uri,
                channelId: channelId
              })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification(data.message, 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(err => {
              console.error('Play error:', err);
              showNotification('Failed to play track', 'error');
            });
          }
          
          // Add track to queue
          function addTrackToQueue(uri) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            fetch('/api/music/queue/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId: selectedGuildId, uri: uri })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification(data.message, 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to add track', 'error'));
          }
          
          // Execute command
          function executeCommand(command) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            showNotification('Executing ' + command + ' command...', 'info');
            
            // Map command to API endpoint
            const endpoint = '/api/music/' + command + '/' + selectedGuildId;
            
            fetch(endpoint, { method: 'POST' })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  showNotification(command.charAt(0).toUpperCase() + command.slice(1) + ' executed successfully!', 'success');
                } else {
                  showNotification('Error: ' + (data.error || 'Command failed'), 'error');
                }
              })
              .catch(() => showNotification('Failed to execute command', 'error'));
          }
          
          // Format duration (milliseconds to MM:SS)
          function formatDuration(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
          }
          
          // Allow searching with Enter key
          document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('spotifySearchQuery');
            if (searchInput) {
              searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                  searchMusic();
                }
              });
            }
            
            const quickPlayInput = document.getElementById('quickPlayQuery');
            if (quickPlayInput) {
              quickPlayInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                  quickPlay();
                }
              });
            }
          });
          
          function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = 'notification notification-' + type + ' show';
            
            setTimeout(() => {
              notification.classList.remove('show');
            }, 3000);
          }
          
          function refreshStats() {
            showNotification('Stats refreshed!', 'success');
            location.reload();
          }
          
          function check247Status() {
            if (!selectedGuildId) return;
            
            fetch('/api/247/status/' + selectedGuildId)
              .then(response => response.json())
              .then(data => {
                const statusDiv = document.getElementById('status247');
                if (data.enabled) {
                  statusDiv.className = 'status-indicator status-enabled';
                  statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Status: Enabled';
                } else {
                  statusDiv.className = 'status-indicator status-disabled';
                  statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> Status: Disabled';
                }
              })
              .catch(() => {
                showNotification('Failed to check 24/7 status', 'error');
              });
          }
          
          function toggle247(enable) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            fetch('/api/247/' + (enable ? 'enable' : 'disable'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId: selectedGuildId })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification(enable ? '24/7 mode enabled!' : '24/7 mode disabled!', 'success');
                check247Status();
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to toggle 24/7 mode', 'error'));
          }
          
          function playSong() {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            const query = document.getElementById('songQuery').value;
            if (!query) {
              showNotification('Please enter a song name or URL', 'error');
              return;
            }
            
            fetch('/api/music/play', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId: selectedGuildId, query: query })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification('Song added to queue!', 'success');
                document.getElementById('songQuery').value = '';
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to play song', 'error'));
          }
          
          function skipSong() {
            if (!selectedGuildId) return;
            
            fetch('/api/music/skip/' + selectedGuildId, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) showNotification('Song skipped!', 'success');
                else showNotification('Error: ' + data.error, 'error');
            });
          }
          
          function stopMusic() {
            if (!selectedGuildId) return;
            
            fetch('/api/music/stop/' + selectedGuildId, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) showNotification('Music stopped!', 'success');
                else showNotification('Error: ' + data.error, 'error');
            });
          }
          
          function pauseMusic() {
            if (!selectedGuildId) return;
            
            fetch('/api/music/pause/' + selectedGuildId, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) showNotification('Music paused!', 'success');
                else showNotification('Error: ' + data.error, 'error');
            });
          }
          
          function resumeMusic() {
            if (!selectedGuildId) return;
            
            fetch('/api/music/resume/' + selectedGuildId, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) showNotification('Music resumed!', 'success');
                else showNotification('Error: ' + data.error, 'error');
            });
          }
          
          function changeVolume() {
            if (!selectedGuildId) return;
            
            const volume = document.getElementById('volumeSlider').value;
            document.getElementById('volumeValue').textContent = volume + '%';
            
            fetch('/api/music/volume/' + selectedGuildId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ volume: parseInt(volume) })
            });
          }
          
          // Speed control
          function changeSpeed() {
            if (!selectedGuildId) return;
            
            const speed = parseFloat(document.getElementById('speedSlider').value);
            document.getElementById('speedValue').textContent = speed.toFixed(2) + 'x';
            
            fetch('/api/music/speed/' + selectedGuildId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ speed: speed })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification('Speed changed to ' + speed.toFixed(2) + 'x', 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            });
          }
          
          function setSpeed(speed) {
            document.getElementById('speedSlider').value = speed;
            changeSpeed();
          }
          
          // Pitch control
          function changePitch() {
            if (!selectedGuildId) return;
            
            const pitch = parseFloat(document.getElementById('pitchSlider').value);
            document.getElementById('pitchValue').textContent = pitch.toFixed(1) + 'x';
            
            fetch('/api/music/pitch/' + selectedGuildId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pitch: pitch })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification('Pitch changed to ' + pitch.toFixed(1) + 'x', 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            });
          }
          
          function setPitch(pitch) {
            document.getElementById('pitchSlider').value = pitch;
            changePitch();
          }
          
          // Apply filter
          function applyFilter(filter) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            fetch('/api/music/filter/' + selectedGuildId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filter: filter })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification(filter === 'reset' ? 'Filters reset!' : filter.charAt(0).toUpperCase() + filter.slice(1) + ' filter applied!', 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to apply filter', 'error'));
          }
          
          // Seek track
          function seekTrack(direction) {
            if (!selectedGuildId) {
              showNotification('Please select a server first', 'error');
              return;
            }
            
            const seconds = parseInt(document.getElementById('seekSeconds').value) || 10;
            
            fetch('/api/music/seek/' + selectedGuildId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ direction: direction, seconds: seconds })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showNotification((direction === 'forward' ? 'Forwarded' : 'Rewound') + ' by ' + seconds + ' seconds', 'success');
              } else {
                showNotification('Error: ' + data.error, 'error');
              }
            })
            .catch(() => showNotification('Failed to seek track', 'error'));
          }
          
          function showQueue() {
            if (!selectedGuildId) return;
            
            fetch('/api/music/queue/' + selectedGuildId)
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  const queueList = document.getElementById('queueList');
                  if (data.queue.length === 0) {
                    queueList.innerHTML = '<p style="color: #94a3b8; text-align: center;">Queue is empty</p>';
                } else {
                    queueList.innerHTML = data.queue.map((track, index) => 
                      '<div class="queue-item"><div><div class="queue-item-title">' + (index + 1) + '. ' + track.title + '</div><div class="queue-item-author">' + track.author + '</div></div></div>'
                    ).join('');
                  }
                  document.getElementById('queueModal').classList.add('show');
                } else {
                  showNotification('Error: ' + data.error, 'error');
                }
              });
          }
          
          function closeQueueModal() {
            document.getElementById('queueModal').classList.remove('show');
          }
          
          function clearQueue() {
            if (!selectedGuildId) return;
            
            if (confirm('Are you sure you want to clear the queue?')) {
              fetch('/api/music/clear/' + selectedGuildId, { method: 'POST' })
              .then(response => response.json())
              .then(data => {
                  if (data.success) showNotification('Queue cleared!', 'success');
                  else showNotification('Error: ' + data.error, 'error');
                });
            }
          }
          
          // Server filtering
          function filterServers(filter) {
            const guildCards = document.querySelectorAll('.guild-card');
            const filterButtons = document.querySelectorAll('.filter-btn');
            
            // Update active button
            filterButtons.forEach(btn => {
              if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
                } else {
                btn.classList.remove('active');
              }
            });
            
            // Filter cards
            guildCards.forEach(card => {
              const status = card.getAttribute('data-bot-status');
              
              if (filter === 'all') {
                card.style.display = 'block';
              } else if (filter === 'active' && status === 'active') {
                card.style.display = 'block';
              } else if (filter === 'inactive' && status === 'inactive') {
                card.style.display = 'block';
              } else {
                card.style.display = 'none';
              }
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/?logout=success');
    });
  });
});

// API Routes
// Get current user info
app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatar: req.user.avatar,
      avatarURL: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
    }
  });
});

// Get server channels
app.get('/api/guild/:guildId/channels', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.guilds) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    const guild = clientInstance.guilds.cache.get(guildId);
    if (!guild) {
      return res.json({ success: false, error: 'Guild not found' });
    }
    
    // Get voice channels
    const voiceChannels = guild.channels.cache
      .filter(channel => channel.type === 2) // GUILD_VOICE
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        userCount: channel.members ? channel.members.size : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({ success: true, channels: voiceChannels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join voice channel
app.post('/api/guild/:guildId/join', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelId } = req.body;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.guilds || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    const guild = clientInstance.guilds.cache.get(guildId);
    if (!guild) {
      return res.json({ success: false, error: 'Guild not found' });
    }
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.json({ success: false, error: 'Channel not found' });
    }
    
    // Create or get player
    let player = clientInstance.manager.players.get(guildId);
    if (!player) {
      player = await clientInstance.manager.createPlayer({
        guildId: guildId,
        voiceId: channelId,
        textId: channelId,
        volume: 80,
        deaf: true,
        shardId: guild.shardId
      });
    }
    
    res.json({ success: true, message: 'Joined voice channel successfully' });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search music (supports Spotify, YouTube, etc.)
app.post('/api/music/search', isAuthenticated, async (req, res) => {
  try {
    const { query, source = 'spotify' } = req.body;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Prepare search query based on source
    let searchQuery = query;
    if (source === 'spotify') {
      searchQuery = `spsearch:${query}`;
    } else if (source === 'youtube') {
      // Use regular YouTube search (ytmsearch might not be supported)
      searchQuery = `ytsearch:${query}`;
    } else if (source === 'soundcloud') {
      searchQuery = `scsearch:${query}`;
    }
    
    // Search using manager
    const result = await clientInstance.manager.search(searchQuery, { 
      requester: { id: req.user.id, tag: req.user.username } 
    });
    
    if (!result || !result.tracks || !result.tracks.length) {
      return res.json({ success: false, error: 'No results found' });
    }
    
    // Filter out shorts (videos shorter than 30 seconds) and prioritize longer tracks
    // But only filter if we have enough results, otherwise show all
    let filteredTracks = result.tracks;
    if (result.tracks.length > 5) {
      filteredTracks = result.tracks.filter(track => {
        // Exclude tracks shorter than 30 seconds (likely shorts)
        const durationInSeconds = track.length / 1000;
        return durationInSeconds >= 30;
      });
    }
    
    // If no tracks after filtering, use original results
    const tracksToUse = filteredTracks.length > 0 ? filteredTracks : result.tracks;
    
    // Sort by duration (longer first) to prioritize full songs, but keep original order if only a few results
    const sortedTracks = tracksToUse.length > 3 
      ? [...tracksToUse].sort((a, b) => b.length - a.length)
      : tracksToUse;
    
    const tracks = sortedTracks.slice(0, 20).map(track => ({
      title: track.title,
      author: track.author,
      duration: track.length,
      uri: track.uri,
      thumbnail: track.thumbnail || track.artworkUrl || null,
      isrc: track.isrc || null
    }));
    
    res.json({ success: true, tracks, source });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search and Play (like play command)
app.post('/api/music/play', isAuthenticated, async (req, res) => {
  try {
    const { guildId, query, channelId } = req.body;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    const guild = clientInstance.guilds.cache.get(guildId);
    if (!guild) {
      return res.json({ success: false, error: 'Guild not found' });
    }
    
    // Check if player already exists (bot already in VC)
    let player = clientInstance.manager.players.get(guildId);
    
    if (!player) {
      // No player exists, need channelId to create one
      if (!channelId) {
        return res.json({ success: false, error: 'Please join a voice channel first' });
      }
      
      // Create new player
      player = await clientInstance.manager.createPlayer({
        guildId: guildId,
        voiceId: channelId,
        textId: channelId,
        volume: 80,
        deaf: true,
        shardId: guild.shardId
      });
    }
    // If player exists, we can use it without needing channelId
    
    // Search for the track
    const result = await clientInstance.manager.search(query, {
      requester: { id: req.user.id, tag: req.user.username }
    });
    
    if (!result || !result.tracks || !result.tracks.length) {
      return res.json({ success: false, error: 'No results found' });
    }
    
    // Filter out shorts (videos shorter than 30 seconds) for single track searches
    // But only filter if we have enough results
    let tracksToUse = result.tracks;
    if (result.type !== 'PLAYLIST' && result.tracks.length > 3) {
      const filteredTracks = result.tracks.filter(track => {
        const durationInSeconds = track.length / 1000;
        return durationInSeconds >= 30;
      });
      // Use filtered tracks if available, otherwise use original
      tracksToUse = filteredTracks.length > 0 ? filteredTracks : result.tracks;
      // Sort by duration (longer first) to prioritize full songs
      if (tracksToUse.length > 1) {
        tracksToUse.sort((a, b) => b.length - a.length);
      }
    }
    
    // Handle playlist
    if (result.type === 'PLAYLIST') {
      result.tracks.forEach((track) => player.queue.add(track));
      if (!player.playing && !player.paused) player.play();
      
      return res.json({ 
        success: true, 
        message: `Added ${result.tracks.length} songs from playlist`,
        type: 'playlist',
        count: result.tracks.length,
        playlistName: result.playlistName
      });
    }
    
    // Add single track (use first track from filtered/sorted results)
    const track = tracksToUse[0];
    player.queue.add(track);
    
    if (!player.playing && !player.paused) {
      player.play();
    }
    
    res.json({ 
      success: true, 
      message: `${player.playing ? 'Added to queue' : 'Now playing'}: ${track.title}`,
      track: {
        title: track.title,
        author: track.author,
        duration: track.length,
        thumbnail: track.thumbnail || track.artworkUrl,
        uri: track.uri
      },
      queuePosition: player.queue.size
    });
  } catch (error) {
    console.error('Play error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add track to queue
app.post('/api/music/queue/add', isAuthenticated, async (req, res) => {
  try {
    const { guildId, uri } = req.body;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found. Please join a voice channel first.' });
    }
    
    // Search by URI
    const result = await clientInstance.manager.search(uri, { requester: { tag: 'Dashboard User' } });
    
    if (!result.tracks.length) {
      return res.json({ success: false, error: 'Track not found' });
    }
    
    const track = result.tracks[0];
    player.queue.add(track);
    
    if (!player.playing && !player.paused) {
      player.play();
    }
    
    res.json({ 
      success: true, 
      message: `Added ${track.title} to queue`,
      track: {
        title: track.title,
        author: track.author,
        duration: track.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/247/status/:guildId', isAuthenticated, async (req, res) => {
  
  try {
    const guildId = req.params.guildId;
    const data = await reconnectAuto.findOne({ GuildId: guildId });
    
    res.json({
      enabled: !!data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/247/enable', isAuthenticated, async (req, res) => {
  
  try {
    const { guildId } = req.body;
    const clientInstance = require('../index');
    
    // Check if client is ready
    if (!clientInstance || !clientInstance.guilds) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Check if already enabled
    const existing = await reconnectAuto.findOne({ GuildId: guildId });
    if (existing) {
      return res.json({ success: false, error: '24/7 is already enabled' });
    }
    
    // Get guild and check permissions
    const guild = clientInstance.guilds.cache.get(guildId);
    if (!guild) {
      return res.json({ success: false, error: 'Guild not found' });
    }
    
    // Create 24/7 entry
    await reconnectAuto.create({
      GuildId: guildId,
      TextId: '0', // Will be set when needed
      VoiceId: '0' // Will be set when needed
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/247/disable', isAuthenticated, async (req, res) => {
  
  try {
    const { guildId } = req.body;
    
    // Check if enabled
    const existing = await reconnectAuto.findOne({ GuildId: guildId });
    if (!existing) {
      return res.json({ success: false, error: '24/7 is not enabled' });
    }
    
    // Remove 24/7 entry
    await reconnectAuto.findOneAndDelete({ GuildId: guildId });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/play', isAuthenticated, async (req, res) => {
  
  try {
    const { guildId, query } = req.body;
    const clientInstance = require('../index');
    
    // Check if client is ready
    if (!clientInstance || !clientInstance.guilds || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get guild
    const guild = clientInstance.guilds.cache.get(guildId);
    if (!guild) {
      return res.json({ success: false, error: 'Guild not found' });
    }
    
    // Get player
    let player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Search and add to queue
    const result = await clientInstance.manager.search(query, { requester: { tag: 'Dashboard User' } });
    if (!result.tracks.length) {
      return res.json({ success: false, error: 'No results found' });
    }
    
    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) {
        player.queue.add(track);
      }
      if (!player.playing && !player.paused) player.play();
    } else {
      const track = result.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused) player.play();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/skip/:guildId', isAuthenticated, async (req, res) => {
  
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Skip current track
    await player.skip();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/stop/:guildId', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Stop player
    player.queue.clear();
    player.skip();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/pause/:guildId', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Pause player
    player.pause(true);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/resume/:guildId', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Resume player
    player.pause(false);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/volume/:guildId', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const { volume } = req.body;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Set volume
    player.setVolume(volume);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/music/queue/:guildId', isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Get queue
    const queue = player.queue.map(track => ({
      title: track.title,
      author: track.author,
      duration: track.length
    }));
    
    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Speed control endpoint
app.post('/api/music/speed/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { speed } = req.body;
    const clientInstance = require('../index');
    
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No player found' });
    }
    
    await player.setTimescale({ speed: parseFloat(speed) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pitch control endpoint
app.post('/api/music/pitch/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { pitch } = req.body;
    const clientInstance = require('../index');
    
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No player found' });
    }
    
    await player.setTimescale({ pitch: parseFloat(pitch) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Filter endpoint
app.post('/api/music/filter/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { filter } = req.body;
    const clientInstance = require('../index');
    
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No player found' });
    }
    
    // Filter configurations
    const filters = {
      bassboost: { equalizer: [{ band: 0, gain: 0.6 }, { band: 1, gain: 0.67 }, { band: 2, gain: 0.67 }, { band: 3, gain: 0 }, { band: 4, gain: -0.5 }, { band: 5, gain: 0.15 }, { band: 6, gain: -0.45 }, { band: 7, gain: 0.23 }, { band: 8, gain: 0.35 }, { band: 9, gain: 0.45 }, { band: 10, gain: 0.55 }, { band: 11, gain: 0.6 }, { band: 12, gain: 0.55 }, { band: 13, gain: 0 }] },
      nightcore: { timescale: { speed: 1.2999999523162842, pitch: 1.2999999523162842, rate: 1 } },
      daycore: { timescale: { speed: 0.800000011920929, pitch: 0.800000011920929, rate: 1 } },
      '8d': { rotation: { rotationHz: 0.2 } },
      vaporwave: { timescale: { pitch: 0.5 }, equalizer: [{ band: 1, gain: 0.3 }, { band: 0, gain: 0.3 }] },
      reset: {}
    };
    
    if (filter === 'reset') {
      await player.clearFilters();
    } else if (filters[filter]) {
      await player.setFilters(filters[filter]);
    } else {
      return res.json({ success: false, error: 'Invalid filter' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seek endpoint
app.post('/api/music/seek/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { direction, seconds } = req.body;
    const clientInstance = require('../index');
    
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No player found' });
    }
    
    const currentPosition = player.position;
    let newPosition;
    
    if (direction === 'forward') {
      newPosition = currentPosition + (seconds * 1000);
      if (newPosition >= player.current.info.length) {
        newPosition = player.current.info.length - 1000;
      }
    } else {
      newPosition = Math.max(0, currentPosition - (seconds * 1000));
    }
    
    await player.seek(newPosition);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/music/clear/:guildId', isAuthenticated, async (req, res) => {
  
  try {
    const guildId = req.params.guildId;
    const clientInstance = require('../index');
    
    if (!clientInstance || !clientInstance.manager) {
      return res.status(503).json({ success: false, error: 'Bot is not ready yet' });
    }
    
    // Get player
    const player = clientInstance.manager.players.get(guildId);
    if (!player) {
      return res.json({ success: false, error: 'No active player found' });
    }
    
    // Clear queue
    player.queue.clear();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Dashboard server running on port ' + PORT);
});

module.exports = app;
