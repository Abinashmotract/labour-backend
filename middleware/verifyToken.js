const jwt = require('jsonwebtoken');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const User = require('../models/userModel');

const verifyToken = async (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return next(createError(401, "You are not Authenticated"));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return next(createError(403, "Token is not valid"));
        }
        else {
            req.user = user;
        }
        next();
    })
}

const verifyAllToken = (requiredRoles = []) => {
  return async (req, res, next) => {
    // 1. Get token from cookies/headers
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(createError(401, "Authentication required"));
    }

    try {
      // 2. Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Role check (if specific roles required)
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return next(createError(403, "Insufficient permissions"));
      }

      // 4. Attach user data to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (err) {
      // Handle expired/invalid tokens
      return next(createError(403, "Invalid or expired token"));
    }
  };
};

const refreshAccessToken = async (req, res, next) => {
    try {
        const {refreshToken} = req.body;
  
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required!" });
      }
  
      // Verify the Refresh Token
      jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token!" });
        }
  
        // Check if refresh token exists in the database
        const user = await User.findOne({ _id: decoded.id, refreshToken });
        if (!user) {
          return res.status(403).json({ message: "Invalid refresh token!" });
        }
  
        // Generate a New Access Token
        const newAccessToken = jwt.sign(
          { id: user._id, roles: user.roles },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
  
        res.status(200).json({
          success: true,
          accessToken: newAccessToken,
        });
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error!" });
    }
  };

const verifyUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        // if (req.user.isAdmin) {
        //     next();
        // }
        // else {
        //     return next(createError(403, "You are not authorized!"));
        // }
        next()
    })
}

module.exports = {verifyToken, verifyAllToken, verifyUser,verifyAdmin, refreshAccessToken}