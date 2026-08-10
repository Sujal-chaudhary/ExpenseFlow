/*
Instead of many CRUD APIs,the dashboard generally has one API that returns lots of statistics.
*/

import {Income} from "../models/income.model.js";
import {Expense} from "../models/expense.model.js";

const getDashboardOverview = async(req,res) =>{
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const incomes = await Income.find({
            userId,
            date:{$gte:startOfMonth, $lte:now}
        }).lean(); //helps to return plain JS object 

        const expenses = await Expense.find({
            userId,
            date:{$gte:startOfMonth, $lte:now}
        }).lean();
            

    const monthlyIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

    const monthlyExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

    const savings = monthlyIncome - monthlyExpense;

    const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

    const recentTransactions = [
      ...incomes.map((i) => ({ ...i, type: "income" })),
      ...expenses.map((e) => ({ ...e, type: "expense" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    //(v.imp...)
    const spendByCategory = {};
    for (const exp of expenses) {
      const cat = exp.category || "Other";
      spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
    }

    /*exp = { category: "Food", amount: 100 }
     cat = "Food"

    spendByCategory["Food"] =
    (spendByCategory["Food"] || 0) + 100;
    */
    
     //(v.imp...)
    const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
      category,
      amount,
      percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
    })); //for charts
      
    return res.status(200).json({
        success: true,
        data:{
            monthlyIncome,
            monthlyExpense,
            savings,
            savingsRate,
            recentTransactions,
            spendByCategory,
            expenseDistribution
        }
    })

    } catch (err) {
        console.log("getdashboardError:", err);
        
        return res.status(500).json({
           success:false,
           message: "dashboard fetch failed"
        });
    }
}

export{
    getDashboardOverview
}


/*{Notes}

Pattern 1: reduce() → Convert many values into one value

array.reduce((accumulator, currentValue) => {
    // return updated accumulator
}, initialValue)

Pattern 2: spread operator are used for arrays
 and we merge two arryas this way
 [
   ...incomeArray,

   ...expenseArray
]

Pattern 3: Sort
.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))

a-b = print is ascending oldest to newest
b-a = print is descending newest t0 oldest

Pattern 4: The pattern to remember,
  Whenever you want to count or sum values grouped by a key, you'll often write:

object[key] = (object[key] || 0) + value;

Pattern 9: Object.entries() => converts an object to array so that you can transform your data and is used for charts ,reports...

*/
