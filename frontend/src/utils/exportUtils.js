import { BookType } from 'lucide-react';
import * as XLSX from 'xlsx';


export const exportToExcel = (data, filename = "transactions") =>{
           if(!data || data.length === 0){
            alert("No data to Export!");
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(data)
            //create a workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook,worksheet,'Transactions')

            //generate a excel file and trigger download
             XLSX.writeFile(workBook, `${filename}.xlsx`, {
                bookType: 'xlsx',
                type: 'array'
           });
        } catch (error) {
            console.error("Export error:",error);
            alert("Error exporting data, please try again!")
        }
}

