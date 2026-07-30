import {Router} from "express"
import { verifyJWT } from "../middlewares/Auth.js";
import { addIncome, deleteIncome, downloadIncomeExcel, getAllIncome, getIncomeOverview, update } from "../controllers/income.controller.js";


const router = Router();

//routes:
router.route("/add").post(verifyJWT,addIncome);
router.route("/get").get(verifyJWT,getAllIncome);
router.route("/update/:id").patch(verifyJWT,update);
router.route("/delete/:id").delete(verifyJWT, deleteIncome);
router.route("/downloadexcel").get(verifyJWT,downloadIncomeExcel );
router.route("/overview").get(verifyJWT,getIncomeOverview);



export default router;