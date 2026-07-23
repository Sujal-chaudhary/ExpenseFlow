import { Expense } from "../models/expense.model.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from 'xlsx';



const addExpense = async(req,res) => {
    const userId = req.user._id;
    const {description, amount , category,date } = req.body;
    try {
        if(!description || amount == null || !date || !category){
            return res.status(400).json({
                success:false,
                message: "all fields are required"
    })
}
      const newExpense = await Expense.create({
        userId,
        description,
        amount,
        category,
        date: new Date(date)
      })
       return res.status(201).json({
            success:true,
            message: "expense added successfully",
            data: newExpense
        })

    }catch(error){
         return res.status(500).json({
            success:false,
            message: error.message
        })
    }

}

const getAllExpense = async(req,res) => {
    const userId = req.user._id;
    const {id} = req.params;

    try {
        const userExpense = await Expense.findOne({_id:id, userId}).sort({date: -1});
        return res.status(200).json({
            success:true,
            data:userExpense
        });
    } catch (error) {
          return res.status(500).json({
            success:false,
            message: error.message
        })
    }
}

const updateExpense = async(req,res) => {
    const {id} = req.params //bcz my route has (:id) therefore express put it in req.params.
     const userId = req.user._id;
     const {description, amount} = req.body
     try {
          const updatedExpense = await Expense.findOneAndUpdate({
                      _id: id ,userId
                  },{description, amount},
                    {new:true}
              );
          
               if(!updatedExpense){
                  return res.status(404).json({
                      success:false,
                      message: "Expense not found"
                  })
               }
          
               return res.status(200).json({
                  success:true,
                  message:"Expense updated successfully",
                  data:updatedExpense
               });
     } catch (error) {
         return res.status(500).json({
            success:false,
            message: error.message
        })
     }
}

const deleteExpense = async(req,res) => {
  const userId = req.user._id
  const {id} = req.params
  try {
   const expense = await Expense.findOneAndDelete({_id: id, userId})
    if(!expense){
        return res.status(404).json({
           success:false,
           message: "expense not found"
       });
     }
       return res.json({
             success:true,
              message:"Expense deleted successfully",
             
         });
  } catch (error) {
             return res.status(500).json({
            success:false,
            message: error.message
        })
  }
}

const downloadExpenseExcel = async(req,res) => {
      const userId = req.user._id;
          try {
              const expense = await Expense.find({userId}).sort({date: -1}); //returns an array of Mongoose documents and sorting helps to keep newest at top.
              const plainData = expense.map((exp) => ({
                  Description: exp.description,
                  Amount: exp.amount,
                  Category:exp.category,
                  Date: new Date(exp.date).toLocaleDateString()
              }));
              
              //convert data to ExcelWorksheet:
              const worksheet = XLSX.utils.json_to_sheet(plainData);//converts into something Excel understands internally.
              const workBook = XLSX.utils.book_new(); //it can contain many worksheet
              XLSX.utils.book_append_sheet(workBook, worksheet, "Expense");
      
            /*Instead of creating a physical file,generate it in memory,optimize later on */
              XLSX.writeFile(workBook,"expense_details.xlsx");
              res.download("expense_details.xlsx");
              
      
          } 
          
          catch (error) {
              return res.status(500).json({
                  success:false,
                  message: error.message
              });
          }
      
}

const getExpenseOverview = async(req,res) => {
    try {
        const userId = req.user._id;
        const {range = "monthly"} = req.query; // destructuring with a default value
        const{start, end} = getDateRange(range);

        const expenses = await Expense.find({
            userId,
            date:{$gte: start, $lte: end}
         }).sort({date: -1});

         const totalExpense = expenses.reduce((acc, cur) => acc + cur.amount, 0);//Combine all array elements into one value.
         const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
         const numberOfTransactions = expenses.length;
         const recentTransactions = expenses.slice(0, 9);

         res.json({
            success:true,
            data:{
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range
            }
         });

    }catch(error){
         return res.status(500).json({
                  success:false,
                  message: error.message
              });
    }
}

export{
    addExpense,
    getAllExpense,
    updateExpense,
    deleteExpense,
    downloadExpenseExcel,
    getExpenseOverview 
}