import { Router } from 'express'
import { getCurrentUser, login, logout, refreshAccessToken, register, updatePassword, updateProfile } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/Auth.js';


const router = Router();

//Public routes:- Anyone can access
router.route("/register").post(register);
router.route("/login").post(login);

//Secured routes(AUTH required)

router.route("/logout").post(verifyJWT,logout)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/password").patch(verifyJWT, updatePassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-profile").patch(verifyJWT, updateProfile)

export default router;