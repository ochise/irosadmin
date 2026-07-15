import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout";
import api from "../../utils/api";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  MenuItem,
  Collapse,
  useMediaQuery,
} from "@mui/material";
import Pagination from "../../components/Pagination";
import CrudModal from "../../components/CrudModal";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { useHasRole } from "../../auth/useRole";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {GetInvoiceStatusDescription} from "../../util/utility";

type Invoice = {
  id?: number;
  invoiceNumber?: string;
  revenueEntityId?: number;
  revenueEntity?: any;
  dueDate?: string;
  totalAmount?: number;
  status: number;
  notes?: string;
};

const schema = yup
  .object({
    revenueEntityId: yup.number().required("Revenue Entity is required"),
    totalAmount: yup.number().required("Amount is required"),
    dueDate: yup.string().required("Due Date is required"),
    notes: yup.string().nullable(),
  })
  .required();

export default function InvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [showFilter, setShowFilter] = useState(false);

  // Filters
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [entity, setEntity] = useState("");
  const [merchant, setMerchant] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { enqueueSnackbar } = useSnackbar();
  const canEdit = useHasRole(["Admin", "Entity"]);

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  // const { control, handleSubmit, reset } = useForm<Invoice>({
  //   resolver: yupResolver(schema),
  // });

  // Load invoices & entities
  useEffect(() => {
    fetchInvoices();
    fetchEntities();
  }, []);

  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices...");
      const res = await api.get("/invoices");
      setList(res.data);
      console.log(res.data);
    } catch {
      enqueueSnackbar("Failed to load invoices", { variant: "error" });
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await api.get("/entities");
      setEntities(res.data);
    } catch {
      enqueueSnackbar("Failed to load entities", { variant: "error" });
    }
  };

  // const openCreate = () => {
  //   setEditing(null);
  //   reset({});
  //   setOpenModal(true);
  // };

  // const openEdit = (inv: Invoice) => {
  //   setEditing(inv);
  //   reset(inv);
  //   setOpenModal(true);
  // };

  const close = () => {
    setOpenModal(false);
    setEditing(null);
  };

  const save:any = async (data: Invoice) => {
    try {
      if (editing?.id) {
        const updated = { ...editing, ...data };
        setList((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        await api.put(`/invoices/${editing.id}`, updated);
        enqueueSnackbar("Invoice updated", { variant: "success" });
      } else {
        const res = await api.post("/invoices", data);
        setList((prev) => [res.data, ...prev]);
        enqueueSnackbar("Invoice created", { variant: "success" });
      }

      close();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || "Save failed", {
        variant: "error",
      });
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;

    const prev = [...list];
    setList(list.filter((i) => i.id !== id));

    try {
      await api.delete(`/invoices/${id}`);
      enqueueSnackbar("Invoice deleted", { variant: "success" });
    } catch {
      enqueueSnackbar("Delete failed", { variant: "error" });
      setList(prev);
    }
  };

  // 🔍 Filtered list
  const filteredList = useMemo(() => {
    return list
      .filter((i) => (status ? i.status === status : true))
      .filter((i) => (entity ? String(i.revenueEntityId) === entity : true))
      .filter((i) =>
        merchant ? String(i.revenueEntityId) === merchant : true
      )
      .filter((i) =>
        startDate ? new Date(i.dueDate!) >= new Date(startDate) : true
      )
      .filter((i) =>
        endDate ? new Date(i.dueDate!) <= new Date(endDate) : true
      );
  }, [list, status, entity, merchant, startDate, endDate]);

  // Pagination
  const pageItems = filteredList.slice((page - 1) * 10, page * 10);
  useEffect(() => {
    setPageCount(Math.max(1, Math.ceil(filteredList.length / 10)));
  }, [filteredList]);

 
  return (
    <Layout>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <h2 style={{ margin: 0 }}>Invoices</h2>

        <Box>
          <IconButton onClick={() => setShowFilter((p) => !p)}>
            <FilterAltIcon />
          </IconButton>
{/* 
          {canEdit && (
            <IconButton onClick={openCreate} sx={{ ml: 1 }}>
              <AddCircleIcon color="primary" />
            </IconButton>
          )} */}
        </Box>
      </Box>

      {/* FILTER PANEL */}
      <Collapse in={showFilter}>
        <Box
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid #ddd",
            borderRadius: 2,
            background: "#fafafa",
            display: "grid",
            gap: 2,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "1fr 1fr"
              : "repeat(4, 1fr)",
          }}
        >
          <TextField
            size="small"
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="10">Pending</MenuItem>
            <MenuItem value="20">Paid</MenuItem>
            <MenuItem value="30">Overdue</MenuItem>
            <MenuItem value="40">Cancelled</MenuItem>
            <MenuItem value="50">Partially Paid</MenuItem>
          </TextField>

          <TextField
            size="small"
            select
            label="Entity"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            {entities.map((e) => (
              <MenuItem key={e.revenueEntityId} value={e.revenueEntityId}>
                {e.accountName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            select
            label="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            {entities
              .filter((e) => e.isMerchant)
              .map((e) => (
                <MenuItem key={e.revenueEntityId} value={e.revenueEntityId}>
                  {e.accountName}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            size="small"
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
        </Box>
      </Collapse>

      {/* TABLE */}
      <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pageItems.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.revenueEntity?.accountName}</TableCell>
                <TableCell>{inv.totalAmount}</TableCell>
                <TableCell>{inv.dueDate}</TableCell>
                <TableCell>{GetInvoiceStatusDescription(inv.status)}</TableCell>
                <TableCell>{inv.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination page={page} count={pageCount} onChange={setPage} />

      {/* CRUD MODAL */}
      {/* <CrudModal
        open={openModal}
        title={editing?.id ? "Edit Invoice" : "New Invoice"}
        onClose={close}
        onSave={handleSubmit(save)}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Controller
            name="revenueEntityId"
            control={control}
            render={({ field }) => (
              <TextField select label="Revenue Entity" fullWidth {...field}>
                {entities.map((e) => (
                  <MenuItem key={e.revenueEntityId} value={e.revenueEntityId}>
                    {e.accountName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="totalAmount"
            control={control}
            render={({ field }) => (
              <TextField type="number" label="Amount" fullWidth {...field} />
            )}
          />

          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <TextField
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                {...field}
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField label="Notes" fullWidth multiline rows={3} {...field} />
            )}
          />
        </Box>
      </CrudModal> */}
    </Layout>
  );
}
