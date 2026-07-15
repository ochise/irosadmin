export const GetInvoiceStatusDescription = (status: number) => {
    // get status description based on status code
    switch (status) {
        case 10:
            return "Pending";
        case 20:
            return "Paid";
        case 30:
            return "Overdue";
        case 40:
            return "Cancelled";
        case 50:
            return "PartiallyPaid"
        default:
            return "Unknown";
    }   

        
     
}