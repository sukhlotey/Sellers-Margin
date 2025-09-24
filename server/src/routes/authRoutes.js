import express from "express";
import { registerUser, loginUser, getUserProfile, changePassword, validateRecoveryCode, resetPassword, deleteUserAccount} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.post("/change-password", protect, changePassword);
router.post("/validate-recovery-code", validateRecoveryCode);
router.post("/reset-password", resetPassword);
router.delete("/delete-account", protect, deleteUserAccount);

// router.post("/recovery-code", protect, getRecoveryCode);

export default router;
