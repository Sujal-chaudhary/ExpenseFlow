import {Router} from "express"
import { verifyJWT } from "../middlewares/Auth.js"
import { getDashboardOverview } from "../controllers/dashboard.controller.js"


const router = Router()

router.route("/").get(verifyJWT, getDashboardOverview)

export default router;