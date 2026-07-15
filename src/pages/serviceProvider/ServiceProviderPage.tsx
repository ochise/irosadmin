import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
  IconButton,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
} from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useSnackbar } from 'notistack'
import Pagination from '../../components/Pagination'
import CrudModal from '../../components/CrudModal'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useHasRole } from '../../auth/useRole'
import debounce from 'lodash.debounce'
import Papa from 'papaparse'
import { Navigator } from '../../components/Navigator'

// ---------------------------
// Types
// ---------------------------

export type ServiceProvider = {
  id?: string
  name: string
  email: string
  phoneNumber: string
  percentage: number
  walletBalance?: number
  merchantId?: string
  merchantName?: string // mapped from merchants list for display
  createdAt?: string
}

export type OptionType = { id: string; name: string }

// ---------------------------
// Validation
// ---------------------------

const schema = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    phoneNumber: yup.string().required('Phone number is required'),
    percentage: yup
      .number()
      .typeError('Percentage must be a number')
      .required('Percentage is required')
      .min(0, 'Percentage must be at least 0')
      .max(100, 'Percentage cannot exceed 100'),
    merchantId: yup.string().required('Merchant is required'),
  })
  .required()

type Order = 'asc' | 'desc'

const columns = [
  { id: 'sn', label: 'SN', sortable: false },
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'phoneNumber', label: 'Phone', sortable: true },
  { id: 'merchantName', label: 'Merchant', sortable: true },
  { id: 'percentage', label: 'Percentage', sortable: true },
  { id: 'walletBalance', label: 'Wallet', sortable: true },
  { id: 'createdAt', label: 'Created At', sortable: true },
]

// ---------------------------
// Component
// ---------------------------

export default function ServiceProviderPage() {
  const [rawProviders, setRawProviders] = useState<ServiceProvider[]>([]) // original from API (merchantId present)
  const [list, setList] = useState<ServiceProvider[]>([]) // mapped providers with merchantName
  const [filtered, setFiltered] = useState<ServiceProvider[]>([])
  const [merchants, setMerchants] = useState<OptionType[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceProvider | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<keyof ServiceProvider>('name')

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin'])
  const isAdmin = useHasRole(['Admin'])

  const { control, handleSubmit, reset } = useForm<ServiceProvider>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      percentage: 0,
      walletBalance: 0,
      merchantId: '',
      createdAt: '',
    },
  })

  // ---------------------------
  // Helper: map rawProviders -> list with merchantName using merchants state
  // ---------------------------

  const mapProvidersWithMerchantNames = useCallback(
    (providers: ServiceProvider[], merchantList: OptionType[]) => {
      const lookup = new Map<string, string>()
      merchantList.forEach((m) => lookup.set(m.id, m.name))
      return providers.map((p) => ({
        ...p,
        merchantName: p.merchantId ? lookup.get(p.merchantId) ?? '' : '',
      }))
    },
    []
  )

  // ---------------------------
  // Debounced search
  // ---------------------------

  const handleSearch = useMemo(
    () =>
      debounce((term: string, sourceList: ServiceProvider[]) => {
        const lower = term.toLowerCase()
        const filteredList = sourceList.filter(
          (x) =>
            (x.name || '').toLowerCase().includes(lower) ||
            (x.email || '').toLowerCase().includes(lower) ||
            (x.phoneNumber || '').toLowerCase().includes(lower) ||
            (x.merchantName || '').toLowerCase().includes(lower)
        )
        setFiltered(filteredList)
        setPage(1)
        setPageCount(Math.max(1, Math.ceil(filteredList.length / 10)))
      }, 300),
    []
  )

  useEffect(() => {
    handleSearch(search, list)
  }, [search, list, handleSearch])

  // ---------------------------
  // Fetch merchants
  // ---------------------------

  const fetchMerchantsList = useCallback(async () => {
    try {
      const res = await api.get('/merchants')
      const mapped = (res.data || []).map((m: any) => ({ id: m.merchantId, name: m.name }))
      setMerchants(mapped)
    } catch (err: any) {
      enqueueSnackbar('Failed to load merchants list', { variant: 'warning' })
      setMerchants([])
    }
  }, [enqueueSnackbar])

  // ---------------------------
  // Fetch providers (raw)
  // ---------------------------

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/serviceprovider')
      console.log('Service providers response:', res);
      const data: ServiceProvider[] = res.data || []

      setRawProviders(data)
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to load service providers', { variant: 'error' })
      setRawProviders([])
    } finally {
      setLoading(false)
    }
  }, [enqueueSnackbar])

  // Map whenever rawProviders or merchants change
  useEffect(() => {
    const mapped = mapProvidersWithMerchantNames(rawProviders, merchants)
    setList(mapped)
    setFiltered(mapped)
    setPageCount(Math.max(1, Math.ceil(mapped.length / 10)))
  }, [rawProviders, merchants, mapProvidersWithMerchantNames])

  // ---------------------------
  // Init load
  // ---------------------------

  useEffect(() => {
    // load merchants first (so mapping is available quickly), then providers
    // but both functions are independent; fetch both
    fetchMerchantsList()
    fetchProviders()
  }, [fetchMerchantsList, fetchProviders])

  // ---------------------------
  // CRUD
  // ---------------------------

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      email: '',
      phoneNumber: '',
      percentage: 0,
      walletBalance: 0,
      merchantId: '',
      createdAt: '',
    })
    setOpen(true)
  }

  const openEdit = (m: ServiceProvider) => {
    setEditing(m)
    // reset should receive the original structure with merchantId preserved
    reset({
      ...m,
      // ensure merchantId exists in the form field (m.merchantId might be undefined)
      merchantId: m.merchantId ?? '',
      percentage: typeof m.percentage === 'number' ? m.percentage : 0,
      walletBalance: m.walletBalance ?? 0,
      createdAt: m.createdAt ?? '',
    })
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async (data: ServiceProvider) => {
    setSaving(true)
    try {
      const endpoint = editing?.id ? `/serviceprovider/${editing.id}` : '/serviceprovider'
      const method = editing?.id ? api.put : api.post

      // send payload as expected by backend
      const payload = {
        ...data,
      }

      await method(endpoint, payload)
      enqueueSnackbar(editing ? 'Service Provider updated' : 'Service Provider created', { variant: 'success' })
      closeModal()
      // refresh
      fetchProviders()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Save failed', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = (id?: string) => setConfirmDelete(id || null)

  const remove = async () => {
    if (!confirmDelete) return
    try {
      await api.delete(`/serviceprovider/${confirmDelete}`)
      enqueueSnackbar('Service Provider deleted', { variant: 'success' })
      // optimistic removal locally
      setRawProviders((prev) => prev.filter((p) => p.id !== confirmDelete))
      setList((prev) => prev.filter((p) => p.id !== confirmDelete))
      setFiltered((prev) => prev.filter((p) => p.id !== confirmDelete))
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Delete failed', { variant: 'error' })
    } finally {
      setConfirmDelete(null)
    }
  }

  // ---------------------------
  // Sorting & pagination
  // ---------------------------

  const handleSort = (property: keyof ServiceProvider) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedData = useMemo(() => {
    // guard: if orderBy is merchantName, use that property; otherwise read property value
    return [...filtered].sort((a, b) => {
      const getVal = (obj: ServiceProvider, key: keyof ServiceProvider) => {
        const v = obj[key]
        if (v === undefined || v === null) return ''
        return v.toString().toLowerCase()
      }
      const aVal = getVal(a, orderBy)
      const bVal = getVal(b, orderBy)
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [filtered, order, orderBy])

  const displayData = useMemo(() => sortedData.slice((page - 1) * 10, page * 10), [sortedData, page])

  // ---------------------------
  // CSV export
  // ---------------------------

  const exportCSV = () => {
    if (!filtered.length) return enqueueSnackbar('No data to export', { variant: 'info' })
    // ensure merchantName included
    const csv = Papa.unparse(
      filtered.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phoneNumber: p.phoneNumber,
        merchantId: p.merchantId ?? '',
        merchantName: p.merchantName ?? '',
        percentage: p.percentage,
        walletBalance: p.walletBalance ?? '',
        createdAt: p.createdAt ?? '',
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'service_providers_export.csv'
    link.click()
  }

  // ---------------------------
  // Render
  // ---------------------------

  return (
    <Layout>
      <Navigator />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Service Providers</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAdmin && (
            <Tooltip title="Export CSV">
              <IconButton color="secondary" onClick={exportCSV}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Button startIcon={<AddCircleIcon />} variant="contained" onClick={openCreate}>
              New Provider
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 2, width: '40%' }}>
        <TextField
          size="small"
          placeholder="Search by name, email, phone or merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        {loading ? (
          <LinearProgress />
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === (col.id as keyof ServiceProvider)}
                        direction={orderBy === (col.id as keyof ServiceProvider) ? order : 'asc'}
                        onClick={() => handleSort(col.id as keyof ServiceProvider)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayData.length ? (
                displayData.map((m, i) => (
                  <TableRow key={m.id || i} hover>
                    <TableCell>{(page - 1) * 10 + i + 1}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.phoneNumber}</TableCell>
                    <TableCell>{m.merchantName ?? ''}</TableCell>
                    <TableCell>{typeof m.percentage === 'number' ? `${m.percentage}%` : ''}</TableCell>
                    <TableCell>{m.walletBalance ?? ''}</TableCell>
                    <TableCell>{m.createdAt ?? ''}</TableCell>

                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => openEdit(m)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => confirmRemove(m.id)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No service providers found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Pagination page={page} count={pageCount} onChange={setPage} />

      {/* CRUD Modal */}
      <CrudModal open={open} title={editing ? 'Edit Service Provider' : 'New Service Provider'} onClose={closeModal} onSave={handleSubmit(save)} saving={saving}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} size="small" label="Name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} size="small" label="Email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />

          <Controller
            name="phoneNumber"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} size="small" label="Phone Number" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />

          {/* Merchant Dropdown */}
          <Controller
            name="merchantId"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>Merchant</InputLabel>
                <Select
                  {...field}
                  label="Merchant"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {merchants.length > 0 ? (
                    merchants.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No merchants available</em>
                    </MenuItem>
                  )}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          <Controller
            name="percentage"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                label="Percentage (0 - 100)"
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                onChange={(e) => {
                  const val = e.target.value
                  const parsed = val === '' ? '' : Number(val)
                  field.onChange(parsed as any)
                }}
                value={field.value ?? ''}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Box>
      </CrudModal>

      {/* Delete dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Service Provider</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this service provider? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={remove} variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
