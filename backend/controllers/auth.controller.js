import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { redis } from "../lib/redis.js";

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { 
        expiresIn: "15m" 
    });
    
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
         expiresIn: "7d" 
        });
    return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await redis.set(`refreshToken:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    } catch (error) {
        console.error("Error storing refresh token:", error);
    }
};

const setcookies =(res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,   //prevents XSS attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",  //prevents CSRF attack
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,   //prevents XSS attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",  //prevents CSRF attack
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

export const signup = async(req, res) => {
    const { username, email, password } = req.body;
    try {
    //Filled validation
    if(!username || !email || !password){
        return res.status(400).json({ message: "All fields are required" });
    }

        const userExists = await User.findOne({ email });
    if(userExists){
        return res.status(400).json({ message: "User already exists" });
    }
    //hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    //authenticate
    const {accessToken, refreshToken} = generateToken(user._id);
    await storeRefreshToken(user._id, refreshToken);
    

    setcookies(res, accessToken, refreshToken);

    res.status(201).json({ message: "User created successfully", user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    } });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    } 
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            const { accessToken, refreshToken } = generateToken(user._id);

            await storeRefreshToken(user._id, refreshToken);
            setcookies(res, accessToken, refreshToken);

            return res.json({ message: "Login successful", user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            } });
        }
        else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decoded.userId}`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;

        if (!refreshToken) {
           res.status(401).json({ message: "No refresh token provided" });
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000
        });
        res.json({ message: "Access token refreshed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}; 

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");   
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};  