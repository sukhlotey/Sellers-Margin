import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Generate 10-character recovery code (e.g., 9X7F-A23K-TY88)
const generateRecoveryCode = () => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let code = "";
  for (let i = 0; i < 10; i++) {
    if (i === 4 || i === 7) code += "-"; // Add dashes at positions 4 and 7
    else code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const recoveryCode = generateRecoveryCode();
    const hashedRecoveryCode = await bcrypt.hash(recoveryCode, salt);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      recoveryCode: hashedRecoveryCode,
      plainRecoveryCode: recoveryCode,
      recoveryCodeExpires: expiresAt,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      recoveryCode, // Send plain recovery code to frontend
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    user.lastLogin = new Date(); // Update lastLogin
    await user.save();
    let response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    };

    // Generate new recovery code only if last reset was via forgot-password
    if (!user.recoveryCode && user.lastResetSource === "forgot-password") {
      const salt = await bcrypt.genSalt(10);
      const recoveryCode = generateRecoveryCode();
      const hashedRecoveryCode = await bcrypt.hash(recoveryCode, salt);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      user.recoveryCode = hashedRecoveryCode;
      user.plainRecoveryCode = recoveryCode;
      user.recoveryCodeExpires = expiresAt;
      await user.save();
      response.recoveryCode = recoveryCode; // Include in response
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -recoveryCode -plainRecoveryCode -recoveryCodeExpires");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Validate recovery code
export const validateRecoveryCode = async (req, res) => {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode) {
      return res.status(400).json({ message: "Email and recovery code are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!user.recoveryCode) {
      return res.status(400).json({ message: "No recovery code set for this user" });
    }

    const isMatch = await bcrypt.compare(recoveryCode, user.recoveryCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid recovery code" });
    }

    res.json({ message: "Recovery code validated", userId: user._id });
  } catch (error) {
    console.error("validateRecoveryCode error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Reset password with recovery code
export const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword, source } = req.body;

    if (!userId || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "User ID and passwords are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Generate new recovery code for settings reset
    let newRecoveryCode = null;
    if (source === "settings") {
      newRecoveryCode = generateRecoveryCode();
      const hashedRecoveryCode = await bcrypt.hash(newRecoveryCode, salt);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      user.recoveryCode = hashedRecoveryCode;
      user.plainRecoveryCode = newRecoveryCode;
      user.recoveryCodeExpires = expiresAt;
    } else {
      user.recoveryCode = null;
      user.plainRecoveryCode = null;
      user.recoveryCodeExpires = null;
    }

    user.password = hashedPassword;
    user.lastResetSource = source || "forgot-password";
    await user.save();

    res.json({
      message: "Password reset successfully",
      ...(source === "settings" && { recoveryCode: newRecoveryCode }),
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.deleteOne({ _id: req.user.id });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("deleteUserAccount error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};