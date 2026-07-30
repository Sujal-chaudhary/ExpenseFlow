import { Income } from "../models/income.model.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dateFilter.js";

//add income
const addIncome = async(req,res) => {
    const userId = req.user._id;
    const {description, amount , category,date } = req.body;
    try {
        if(!description || amount == null || !date || !category){
            return res.status(400).json({
                success:false,
                message: "all fields are required"
            })
        }

        const newIncome = await Income.create({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });
        return res.status(201).json({
            success:true,
            message: "income added successfully",
            data: newIncome
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message
        })
    }
}

//getIncome
const getAllIncome = async(req,res) =>{
     const userId = req.user._id;
     try {
        const userIncome = await Income.find({userId}).sort({date: -1});
        
        return res.status(200).json({
            success:true,
            data: userIncome
        });
     } catch (error) {
         return res.status(500).json({
            success:false,
            message: error.message
        });
     }
};


//updateIncome
const update = async(req,res) => {
    const {id} = req.params //bcz my route has (:id) therefore express put it in req.params.
     const userId = req.user._id;
     const {description, amount} = req.body
     try {
        const updatedIncome = await Income.findOneAndUpdate({
            _id: id ,userId
        },{description, amount},
          {new:true}
    );

     if(!updatedIncome){
        return res.status(404).json({
            success:false,
            message: "income not found"
        })
     }

     return res.status(200).json({
        success:true,
        message:"Income updated successfully",
        data:updatedIncome
     });

     } catch (error) {
         return res.status(500).json({
            success:false,
            message: error.message
        });
     }

    
}

//delete:
 const deleteIncome = async(req,res) => {
    const userId = req.user._id;
           try {
              const income = await Income.findOneAndDelete({_id:req.params.id,userId});
              if(!income){
                 return res.status(404).json({
                  success:false,
                  message: "income not found"
             });
         }
         return res.json({
             success:true,
              message:"Income deleted successfully",
             
         });

           } catch (error) {
               return res.status(500).json({
                  success:false,
                  message: error.message
             });
     }

}

// to download the data in an excel sheet:-
const downloadIncomeExcel = async(req,res) => {
    const userId = req.user._id;
    try {
        const income = await Income.find({userId}).sort({date: -1}); //returns an array of Mongoose documents and sorting helps to keep newest at top.
        const plainData = income.map((inc) => ({
            Description: inc.description,
            Amount: inc.amount,
            Category:inc.category,
            Date: new Date(inc.date).toLocaleDateString()
        }));
        
        //convert data to ExcelWorksheet:
        const worksheet = XLSX.utils.json_to_sheet(plainData);//converts into something Excel understands internally.
        const workBook = XLSX.utils.book_new(); //it can contain many worksheet
        XLSX.utils.book_append_sheet(workBook, worksheet, "Income");

      /*Instead of creating a physical file,generate it in memory,optimize later on */
        XLSX.writeFile(workBook,"income_details.xlsx");
        res.download("income_details.xlsx");
        

    } 
    
    catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message
        });
    }

}

//getIncomeOverview:- Analytics API (v.imp...)
const getIncomeOverview = async(req,res) =>{
    try {
        const userId = req.user._id;
        const {range = "monthly"} = req.query; // destructuring with a default value
        const{start, end} = getDateRange(range);

        const incomes = await Income.find({
            userId,
            date:{$gte: start, $lte: end}
         }).sort({date: -1});

         const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);//Combine all array elements into one value.
         const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
         const numberOfTransactions = incomes.length;
         const recentTransactions = incomes.slice(0, 9);

         res.json({
            success:true,
            data:{
                totalIncome,
                averageIncome,
                numberOfTransactions,
                recentTransactions,
                range
            }
         });

    } catch (error) {
          return res.status(500).json({
           success:false,
           message: error.message
        });
    }
};

export{
    addIncome,
    getAllIncome,
    update,
    deleteIncome,
    downloadIncomeExcel,
    getIncomeOverview

}

/*NOTES: (always remember)

Rule of thumb for your ExpenseFlow project

Whenever you fetch, update, or delete a resource owned by a user, include both the document ID and the authenticated user's ID:

// Read
Income.findOne({ _id: id, userId });

// Update
Income.findOneAndUpdate({ _id: id, userId }, updateData);

// Delete
Income.findOneAndDelete({ _id: id, userId });

This tells MongoDB:-
"Find the income whose _id is this and whose userId matches the currently logged-in user."
  

*/