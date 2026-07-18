// import React, { useEffect, useState, useMemo } from "react";
// import Layout from "../../components/Layout";
// import api from "../../utils/api";
// import {
//   Box,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   TextField,
//   IconButton,
//   MenuItem,
//   Collapse,
//   useMediaQuery,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Typography,
//   Chip,
// } from "@mui/material";
// import Pagination from "../../components/Pagination";
// import { useSnackbar } from "notistack";
// import { useHasRole } from "../../auth/useRole";
// import FilterAltIcon from "@mui/icons-material/FilterAlt";
// import DeleteIcon from "@mui/icons-material/Delete";
// import { GetInvoiceStatusDescription } from "../../util/utility";

// type Invoice = {
//   id?: number;
//   invoiceNumber?: string;
//   revenueEntityId?: number;
//   revenueEntity?: any;
//   dueDate?: string;
//   totalAmount?: number;
//   status: number;
//   notes?: string;
// };

// export default function DeleteInvoicePage() {
//   const [list, setList] = useState<Invoice[]>([]);
//   const [entities, setEntities] = useState<any[]>([]);
//   const [page, setPage] = useState(1);
//   const [pageCount, setPageCount] = useState(1);

//   const [showFilter, setShowFilter] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState<{
//     open: boolean;
//     invoice?: Invoice;
//   }>({ open: false });

//   // Filters
//   const [status, setStatus] = useState<number | string>("");
//   const [entity, setEntity] = useState("");
//   const [merchant, setMerchant] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

//   const { enqueueSnackbar } = useSnackbar();
//   const canDelete = useHasRole(["Admin", "Operations"]);

//   const isMobile = useMediaQuery("(max-width:600px)");
//   const isTablet = useMediaQuery("(max-width:900px)");

//   // Load invoices & entities
//   useEffect(() => {
//     fetchInvoices();
//     fetchEntities();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       console.log("Fetching invoices...");
//       const res = await api.get("/invoices");
//       console.log("Invoices response:", res.data);
//       setList(Array.isArray(res.data) ? res.data : []);
//     } catch (error) {
//       console.error("Error fetching invoices:", error);
//       enqueueSnackbar("Failed to load invoices", { variant: "error" });
//       setList([]);
//     }
//   };

//   const fetchEntities = async () => {
//     try {
//       const res = await api.get("/entities");
//       console.log("Entities response:", res.data);
//       setEntities(Array.isArray(res.data) ? res.data : []);
//     } catch (error) {
//       console.error("Error fetching entities:", error);
//       enqueueSnackbar("Failed to load entities", { variant: "error" });
//       setEntities([]);
//     }
//   };

//   const openDeleteConfirm = (invoice: Invoice) => {
//     setConfirmDelete({ open: true, invoice });
//   };

//   const closeDeleteConfirm = () => {
//     setConfirmDelete({ open: false });
//   };

//   const deleteInvoice = async () => {
//     const invoice = confirmDelete.invoice;
//     if (!invoice?.id) return;

//     const prev = [...list];
//     setList(list.filter((i) => i.id !== invoice.id));

//     try {
//       await api.delete(`/invoices/${invoice.id}`);
//       enqueueSnackbar("Invoice deleted successfully", { variant: "success" });
//       closeDeleteConfirm();
//     } catch (error: any) {
//       console.error("Delete error:", error);
//       enqueueSnackbar(
//         error?.response?.data?.message || "Failed to delete invoice",
//         { variant: "error" }
//       );
//       setList(prev);
//       closeDeleteConfirm();
//     }
//   };

//   // 🔍 Filtered list
//   const filteredList = useMemo(() => {
//     return list
//       .filter((i) =>
//         status && status !== "" ? i.status === Number(status) : true
//       )
//       .filter((i) => (entity ? String(i.revenueEntityId) === entity : true))
//       .filter((i) =>
//         merchant ? String(i.revenueEntityId) === merchant : true
//       )
//       .filter((i) =>
//         startDate ? new Date(i.dueDate!) >= new Date(startDate) : true
//       )
//       .filter((i) =>
//         endDate ? new Date(i.dueDate!) <= new Date(endDate) : true
//       )
//       .filter((i) =>
//         searchInvoiceNumber
//           ? i.invoiceNumber
//               ?.toLowerCase()
//               .includes(searchInvoiceNumber.toLowerCase())
//           : true
//       );
//   }, [list, status, entity, merchant, startDate, endDate, searchInvoiceNumber]);

//   // Pagination
//   const pageItems = filteredList.slice((page - 1) * 10, page * 10);
//   useEffect(() => {
//     setPageCount(Math.max(1, Math.ceil(filteredList.length / 10)));
//   }, [filteredList]);

//   return (
//     <Layout>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
//         <Box>
//           <Typography variant="h4" fontWeight={600}>
//             Delete Invoices
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//             Search and delete invoices from the system
//           </Typography>
//         </Box>

//         <Box>
//           <IconButton onClick={() => setShowFilter((p) => !p)}>
//             <FilterAltIcon />
//           </IconButton>
//         </Box>
//       </Box>

//       {/* FILTER PANEL */}
//       <Collapse in={showFilter}>
//         <Box
//           sx={{
//             p: 2,
//             mb: 2,
//             border: "1px solid #ddd",
//             borderRadius: 2,
//             background: "#fafafa",
//             display: "grid",
//             gap: 2,
//             gridTemplateColumns: isMobile
//               ? "1fr"
//               : isTablet
//               ? "1fr 1fr"
//               : "repeat(4, 1fr)",
//           }}
//         >
//           <TextField
//             size="small"
//             label="Invoice Number"
//             value={searchInvoiceNumber}
//             onChange={(e) => setSearchInvoiceNumber(e.target.value)}
//             placeholder="Search by invoice number"
//             fullWidth
//           />

//           <TextField
//             size="small"
//             select
//             label="Status"
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//             fullWidth
//           >
//             <MenuItem value="">All</MenuItem>
//             <MenuItem value="10">Pending</MenuItem>
//             <MenuItem value="20">Paid</MenuItem>
//             <MenuItem value="30">Overdue</MenuItem>
//             <MenuItem value="40">Cancelled</MenuItem>
//             <MenuItem value="50">Partially Paid</MenuItem>
//           </TextField>

//           <TextField
//             size="small"
//             select
//             label="Entity"
//             value={entity}
//             onChange={(e) => setEntity(e.target.value)}
//             fullWidth
//           >
//             <MenuItem value="">All</MenuItem>
//             {entities.map((e) => (
//               <MenuItem key={e.revenueEntityId} value={e.revenueEntityId}>
//                 {e.accountName}
//               </MenuItem>
//             ))}
//           </TextField>

//           <TextField
//             size="small"
//             select
//             label="Merchant"
//             value={merchant}
//             onChange={(e) => setMerchant(e.target.value)}
//             fullWidth
//           >
//             <MenuItem value="">All</MenuItem>
//             {entities
//               .filter((e) => e.isMerchant)
//               .map((e) => (
//                 <MenuItem key={e.revenueEntityId} value={e.revenueEntityId}>
//                   {e.accountName}
//                 </MenuItem>
//               ))}
//           </TextField>

//           <TextField
//             size="small"
//             type="date"
//             label="Start Date"
//             InputLabelProps={{ shrink: true }}
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             fullWidth
//           />

//           <TextField
//             size="small"
//             type="date"
//             label="End Date"
//             InputLabelProps={{ shrink: true }}
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             fullWidth
//           />
//         </Box>
//       </Collapse>

//       {/* Stats */}
//       <Box sx={{ mb: 2 }}>
//         <Chip
//           label={`Total Invoices: ${filteredList.length}`}
//           color="primary"
//           variant="outlined"
//         />
//       </Box>

//       {/* TABLE */}
//       <TableContainer
//         component={Paper}
//         sx={{ width: "100%", overflowX: "auto" }}
//       >
//         <Table size={isMobile ? "small" : "medium"}>
//           <TableHead>
//             <TableRow>
//               <TableCell>Invoice #</TableCell>
//               <TableCell>Entity</TableCell>
//               <TableCell>Amount</TableCell>
//               <TableCell>Due Date</TableCell>
//               <TableCell>Status</TableCell>
//               <TableCell>Notes</TableCell>
//               {canDelete && <TableCell align="center">Action</TableCell>}
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {pageItems.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center">
//                   <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
//                     No invoices found
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               pageItems.map((inv) => (
//                 <TableRow key={inv.id}>
//                   <TableCell>{inv.invoiceNumber}</TableCell>
//                   <TableCell>{inv.revenueEntity?.accountName}</TableCell>
//                   <TableCell>₦{inv.totalAmount?.toLocaleString()}</TableCell>
//                   <TableCell>
//                     {inv.dueDate
//                       ? new Date(inv.dueDate).toLocaleDateString()
//                       : "N/A"}
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={GetInvoiceStatusDescription(inv.status)}
//                       size="small"
//                       color={
//                         inv.status === 20
//                           ? "success"
//                           : inv.status === 30
//                           ? "error"
//                           : "default"
//                       }
//                     />
//                   </TableCell>
//                   <TableCell>{inv.notes || "-"}</TableCell>
//                   {canDelete && (
//                     <TableCell align="center">
//                       <IconButton
//                         size="small"
//                         color="error"
//                         onClick={() => openDeleteConfirm(inv)}
//                         title="Delete Invoice"
//                       >
//                         <DeleteIcon fontSize="small" />
//                       </IconButton>
//                     </TableCell>
//                   )}
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       <Pagination page={page} count={pageCount} onChange={setPage} />

//       {/* Delete Confirmation Dialog */}
//       <Dialog
//         open={confirmDelete.open}
//         onClose={closeDeleteConfirm}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Confirm Delete Invoice</DialogTitle>
//         <DialogContent>
//           <Typography variant="body1" gutterBottom>
//             Are you sure you want to delete this invoice?
//           </Typography>
//           {confirmDelete.invoice && (
//             <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
//               <Typography variant="body2">
//                 <strong>Invoice #:</strong>{" "}
//                 {confirmDelete.invoice.invoiceNumber}
//               </Typography>
//               <Typography variant="body2">
//                 <strong>Entity:</strong>{" "}
//                 {confirmDelete.invoice.revenueEntity?.accountName}
//               </Typography>
//               <Typography variant="body2">
//                 <strong>Amount:</strong> ₦
//                 {confirmDelete.invoice.totalAmount?.toLocaleString()}
//               </Typography>
//               <Typography variant="body2">
//                 <strong>Status:</strong>{" "}
//                 {GetInvoiceStatusDescription(confirmDelete.invoice.status)}
//               </Typography>
//             </Box>
//           )}
//           <Typography
//             variant="body2"
//             color="error"
//             sx={{ mt: 2, fontWeight: 500 }}
//           >
//             ⚠️ This action cannot be undone!
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={closeDeleteConfirm}>Cancel</Button>
//           <Button
//             onClick={deleteInvoice}
//             color="error"
//             variant="contained"
//             startIcon={<DeleteIcon />}
//           >
//             Delete Invoice
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Layout>
//   );
// }


import React, { useState } from 'react';
import Layout from '../../components/Layout';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';

// Validation schema
const schema = yup.object({
  invoiceNumber: yup
    .string()
    .required('Invoice number is required')
    .trim()
    .min(3, 'Invoice number must be at least 3 characters'),
}).required();

type DeleteInvoiceForm = {
  invoiceNumber: string;
};

export default function DeleteInvoicePage() {
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [plainInvoiceNumber, setPlainInvoiceNumber] = useState<string>(''); // Store plain text
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [searchError, setSearchError] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteInvoiceForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      invoiceNumber: '',
    },
  });

  // Search for invoice before deletion
  const searchInvoice = async (invoiceNumber: string) => {
    try {
      setLoading(true);
      setSearchError('');
      setInvoiceDetails(null);

      // Search for the invoice using the invoices endpoint
      const response = await api.get(`/invoices`);

      // Find the invoice by invoice number
      const invoice = response.data.find(
        (inv: any) => inv.invoiceNumber === invoiceNumber
      );

      if (invoice) {
        setInvoiceDetails(invoice);
        return true;
      } else {
        setSearchError('Invoice not found');
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Failed to search invoice';
      setSearchError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission - opens confirmation dialog
  const onSubmit = async (data: DeleteInvoiceForm) => {
    const invoiceNumber = data.invoiceNumber.trim();

    // First, search for the invoice
    const found = await searchInvoice(invoiceNumber);

    if (found) {
      setPlainInvoiceNumber(invoiceNumber); // Store plain invoice number
      setConfirmDialogOpen(true);
    }
  };

  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setConfirmDialogOpen(false);

      // ✅ CORRECTED: Send plain invoice number as URL path parameter
      await api.delete(`/modify/deleteinvoice/${plainInvoiceNumber}`);

      enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });

      // Reset form and states
      reset();
      setInvoiceDetails(null);
      setPlainInvoiceNumber('');
      setSearchError('');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Failed to delete invoice';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel confirmation
  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setPlainInvoiceNumber('');
  };

  // Handle input change to clear errors
  const handleInputChange = () => {
    setSearchError('');
    setInvoiceDetails(null);
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Delete Invoice
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the invoice number to delete. This action cannot be undone.
          </Typography>

          {/* Alert for errors */}
          {searchError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setSearchError('')}
            >
              {searchError}
            </Alert>
          )}

          {/* Invoice Details Display */}
          {invoiceDetails && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Invoice Found:
              </Typography>
              <Typography variant="body2">
                <strong>Invoice #:</strong> {invoiceDetails.invoiceNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Entity:</strong>{' '}
                {invoiceDetails.revenueEntity?.accountName || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> ₦
                {invoiceDetails.totalAmount?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2">
                <strong>Due Date:</strong> {invoiceDetails.dueDate || 'N/A'}
              </Typography>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Invoice Number Input */}
              <Controller
                name="invoiceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Invoice Number"
                    placeholder="Enter invoice number"
                    fullWidth
                    required
                    error={!!errors.invoiceNumber}
                    helperText={errors.invoiceNumber?.message}
                    disabled={loading || isSubmitting}
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange();
                    }}
                    InputProps={{
                      sx: { backgroundColor: '#fff' },
                    }}
                  />
                )}
              />

              {/* Delete Button */}
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DeleteIcon />
                  )
                }
                disabled={loading || isSubmitting}
                fullWidth
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                {loading ? 'Searching...' : 'Delete Invoice'}
              </Button>
            </Box>
          </form>

          {/* Warning Message */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: '#fff3cd',
              borderRadius: 1,
              border: '1px solid #ffc107',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              ⚠️ <strong>Warning:</strong> Deleting an invoice is permanent and
              cannot be reversed. Please ensure you have the correct invoice
              number before proceeding.
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="confirm-delete-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="confirm-delete-dialog" sx={{ fontWeight: 600 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice{' '}
            <strong>{plainInvoiceNumber}</strong>?
          </DialogContentText>

          {invoiceDetails && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                <strong>Entity:</strong>{' '}
                {invoiceDetails.revenueEntity?.accountName || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> ₦
                {invoiceDetails.totalAmount?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2">
                <strong>Due Date:</strong> {invoiceDetails.dueDate || 'N/A'}
              </Typography>
            </Box>
          )}

          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
