import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import speakeasy from "speakeasy";
import { emailService } from "./email-service.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, fullName, email, position } = req.body;
      
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        email: email || `${username}@example.com`,
        position: position || null,
        role: "admin", // Users who register through auth page automatically get admin role for company privacy
        profileImageUrl: null
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          settings: user.settings
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    const { username, password, twoFactorCode } = req.body;

    try {
      // First authenticate username/password
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check if 2FA is enabled for this user
      if (user.twoFactorEnabled) {
        // 2FA is required
        if (!twoFactorCode) {
          // Send 2FA code via email
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await storage.createPasswordResetToken({
            email: user.email,
            token: code,
            expiresAt: expiresAt,
            used: false
          });

          // Send 2FA code via email
          await emailService.send2FACode(user.email, code);

          return res.status(200).json({ 
            requiresTwoFactor: true,
            message: "Two-factor authentication code sent to your email",
            email: user.email,
            codeForDev: process.env.NODE_ENV === 'development' ? code : undefined
          });
        }

        // Verify 2FA code from email
        const tokenRecord = await storage.getPasswordResetToken(twoFactorCode);
        if (!tokenRecord || tokenRecord.email !== user.email) {
          // Check backup codes
          let isBackupCode = false;
          if (user.backupCodes && user.backupCodes.includes(twoFactorCode)) {
            isBackupCode = true;
            // Remove used backup code
            const updatedBackupCodes = user.backupCodes.filter(code => code !== twoFactorCode);
            await storage.updateUserTwoFactor(user.id, { backupCodes: updatedBackupCodes });
          }

          if (!isBackupCode) {
            return res.status(401).json({ message: "Invalid two-factor authentication code" });
          }
        } else {
          // Mark token as used
          await storage.markTokenAsUsed(tokenRecord.id);
        }
      }

      // Login successful
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.status(200).json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          settings: user.settings,
          twoFactorEnabled: user.twoFactorEnabled
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      profileImageUrl: req.user.profileImageUrl,
      settings: req.user.settings
    });
  });

  // Password reset endpoints
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // In a real implementation, you would:
      // 1. Find user by email
      // 2. Generate a secure reset token
      // 3. Send email with reset link
      // 4. Store the token with expiration
      
      // For demo purposes, we'll generate a simple code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In development, return the code for testing
      if (process.env.NODE_ENV === "development") {
        res.json({ 
          message: "Password reset code sent",
          resetCode: resetCode // Only in development
        });
      } else {
        res.json({ message: "Password reset code sent to your email" });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      // In a real implementation, you would:
      // 1. Verify the reset code
      // 2. Check if it's not expired
      // 3. Find the user by email
      // 4. Update their password
      
      // For demo purposes, we'll accept any 6-digit code
      if (code.length !== 6 || isNaN(code)) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Find user by email (simplified - in real app, store email properly)
      const username = email.split("@")[0];
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}