import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.js';
import { addExpense, deleteExpense, downloadExpenseExcel, getAllExpense, getExpenseOverview, updateExpense } from '../controllers/expense.controller.js';

const router = Router()

router.route("/add").post(verifyJWT,addExpense);
router.route("/get/:id").get(verifyJWT,getAllExpense);
router.route("/update/:id").patch(verifyJWT,updateExpense);
router.route("/delete/:id").delete(verifyJWT, deleteExpense);
router.route("/downloadexcel").get(verifyJWT,downloadExpenseExcel );
router.route("/overview").get(verifyJWT, getExpenseOverview);



export default router;