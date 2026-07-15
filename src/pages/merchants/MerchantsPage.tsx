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

export type Merchant = {
  merchantId?: string
  name: string
  contactEmail: string
  contactPhone: string
  meansOfIdentification: string
  identificationNumber: string
  address: string
  category: string
  country: string
  state: string
  LGA: string
  percentage: number
  merchantLogo1?: string
  merchantLogo2?: string
  signature1?: string
  signature2?: string
}

export type OptionType = { id: string; name: string }

// ---------------------------
// Validation
// ---------------------------

const schema = yup
  .object({
    name: yup.string().required('Name is required'),
    contactEmail: yup.string().email('Enter a valid email').required('Email is required'),
    contactPhone: yup.string().required('Phone number is required'),
    meansOfIdentification: yup.string().required('Means of identification is required'),
    identificationNumber: yup.string().required('Identification number is required'),
    address: yup.string().required('Address is required'),
    category: yup.string().required('Category is required'),
    country: yup.string().required('Country is required'),
    state: yup.string().required('State is required'),
    LGA: yup.string().required('LGA is required'),
    percentage: yup
      .number()
      .typeError('Percentage must be a number')
      .required('Percentage is required')
      .min(0, 'Percentage must be at least 0')
      .max(100, 'Percentage cannot exceed 100'),
    merchantLogo1: yup.string().nullable(),
    merchantLogo2: yup.string().nullable(),
    signature1: yup.string().nullable(),
    signature2: yup.string().nullable(),
  })
  .required()

type Order = 'asc' | 'desc'

const columns = [
  { id: 'sn', label: 'SN', sortable: false },
  { id: 'name', label: 'Name', sortable: true },
  { id: 'contactEmail', label: 'Email', sortable: true },
  { id: 'contactPhone', label: 'Phone', sortable: true },
  { id: 'meansOfIdentification', label: 'Means of ID', sortable: true },
  { id: 'address', label: 'Address', sortable: true },
  { id: 'percentage', label: 'Percentage', sortable: true },
]

// ---------------------------
// Helper: file -> base64 with compression/resizing
// ---------------------------

const fileToBase64 = (file: File, maxDimension = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('')

    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const result = reader.result as string

      if (!file.type.startsWith('image/')) {
        return resolve(result)
      }

      const img = new Image()
      img.onerror = () => resolve(result)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              const ratio = maxDimension / width
              width = maxDimension
              height = Math.round(height * ratio)
            } else {
              const ratio = maxDimension / height
              height = maxDimension
              width = Math.round(width * ratio)
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(result)
          ctx.drawImage(img, 0, 0, width, height)

          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const dataUrl = canvas.toDataURL(mime, mime === 'image/png' ? undefined as any : quality)
          resolve(dataUrl)
        } catch {
          resolve(result)
        }
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  })
}

// ---------------------------
// Component
// ---------------------------

export default function MerchantsPage() {
  const [list, setList] = useState<Merchant[]>([])
  const [filtered, setFiltered] = useState<Merchant[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [idTypes, setIdTypes] = useState<OptionType[]>([])
  const [categories, setCategories] = useState<OptionType[]>([])
  const [countries, setCountries] = useState<OptionType[]>([])
  const [states, setStates] = useState<OptionType[]>([])
  const [lgas, setLgas] = useState<OptionType[]>([])

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<keyof Merchant>('name')

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin'])
  const isAdmin = useHasRole(['Admin'])

  const { control, handleSubmit, reset, watch } = useForm<Merchant>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      contactEmail: '',
      contactPhone: '',
      meansOfIdentification: '',
      identificationNumber: '',
      address: '',
      category: '',
      country: '',
      state: '',
      LGA: '',
      percentage: 0,
      merchantLogo1: '',
      merchantLogo2: '',
      signature1: '',
      signature2: '',
    },
  })

  // ---------------------------
  // Debounced search
  // ---------------------------

  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        const lower = term.toLowerCase()
        const filteredList = list.filter(
          (m) =>
            (m.name || '').toLowerCase().includes(lower) ||
            (m.contactEmail || '').toLowerCase().includes(lower) ||
            (m.contactPhone || '').toLowerCase().includes(lower)
        )
        setFiltered(filteredList)
        setPage(1)
        setPageCount(Math.max(1, Math.ceil(filteredList.length / 10)))
      }, 400),
    [list]
  )

  useEffect(() => handleSearch(search), [search, handleSearch])

  // ---------------------------
  // Fetch merchants
  // ---------------------------

  const fetchMerchants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/merchants')
      const data: Merchant[] = res.data || []
      setList(data)
      setFiltered(data)
      setPageCount(Math.max(1, Math.ceil(data.length / 10)))
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to load merchants', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [enqueueSnackbar])

  // ---------------------------
  // Fetch dropdowns
  // ---------------------------

  const fetchDropdowns = useCallback(async () => {
    try {
      const [idRes, catRes, countryRes, stateRes] = await Promise.all([
        api.get('/SubSettings/by-setting/0006b218-0038-4579-bda9-475bbd204362'),
        api.get('/SubSettings/by-setting/6adafc80-373d-4edb-96ff-199bbaf51130'),
        api.get('/SubSettings/by-setting/7cefeea2-914b-412c-8912-6c7370050309'),
        api.get('/SubSettings/by-setting/856e503a-b133-4c0d-9fcc-bb282939f94e'),
      ])

      setIdTypes(idRes.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
      setCategories(catRes.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
      setCountries(countryRes.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
      setStates(stateRes.data.map((d: any) => ({ id: d.id, name: d.subDescription })))
    } catch {
      enqueueSnackbar('Failed to load dropdown data', { variant: 'warning' })
    }
  }, [enqueueSnackbar])

  useEffect(() => {
    fetchMerchants()
    fetchDropdowns()
  }, [fetchMerchants, fetchDropdowns])

  // ---------------------------
  // Fetch LGAs by state
  // ---------------------------

  const fetchLgas = useCallback(
    async (stateName: string) => {
      if (!stateName) {
        setLgas([])
        return
      }
      try {
        const res = await api.get(`/lga/lga-by-state?state=${encodeURIComponent(stateName)}`)
        // const mapped = (res.data || []).map((d: any) =>
        //   d.subDescription ? { id: d.subDescription, name: d.subDescription } : { id: d.id ?? d.name, name: d.name ?? d.id }
        // )
        setLgas(res.data.map((d: any) => ({ id: d.id, name: d.lgaName })))
      } catch (err) {
        setLgas([])
        enqueueSnackbar('Failed to load LGAs for selected state', { variant: 'warning' })
      }
    },
    [enqueueSnackbar]
  )

  const selectedState = watch('state')
  useEffect(() => {
    if (selectedState) fetchLgas(selectedState)
    else setLgas([])
  }, [selectedState, fetchLgas])

  // ---------------------------
  // CRUD
  // ---------------------------

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      contactEmail: '',
      contactPhone: '',
      meansOfIdentification: '',
      identificationNumber: '',
      address: '',
      category: '',
      country: '',
      state: '',
      LGA: '',
      percentage: 0,
      merchantLogo1: '',
      merchantLogo2: '',
      signature1: '',
      signature2: '',
    })
    setOpen(true)
  }

  const openEdit = (m: Merchant) => {
    setEditing(m)
    if (m?.state) {
      fetchLgas(m.state)
    }
    // ensure percentage exists (fallback to 0)
    reset({
      ...m,
      percentage: typeof m.percentage === 'number' ? m.percentage : 0,
    })
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async (data: Merchant) => {
    setSaving(true)
    try {
      const endpoint = editing?.merchantId ? `/merchants/${editing.merchantId}` : '/merchants'
      const method = editing?.merchantId ? api.put : api.post
      await method(endpoint, data)
      enqueueSnackbar(editing ? 'Merchant updated successfully' : 'Merchant created successfully', { variant: 'success' })
      closeModal()
      fetchMerchants()
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
      await api.delete(`/merchants/${confirmDelete}`)
      enqueueSnackbar('Merchant deleted successfully', { variant: 'success' })
      setList((prev) => prev.filter((m) => m.merchantId !== confirmDelete))
      setFiltered((prev) => prev.filter((m) => m.merchantId !== confirmDelete))
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Delete failed', { variant: 'error' })
    } finally {
      setConfirmDelete(null)
    }
  }

  // ---------------------------
  // Sorting & pagination
  // ---------------------------

  const handleSort = (property: keyof Merchant) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = (a[orderBy] || '').toString().toLowerCase()
      const bVal = (b[orderBy] || '').toString().toLowerCase()
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [filtered, order, orderBy])

  const displayData = useMemo(() => sortedData.slice((page - 1) * 10, page * 10), [sortedData, page])

  // ---------------------------
  // CSV export
  // ---------------------------

  const exportCSV = () => {
    if (!filtered.length) return enqueueSnackbar('No data to export', { variant: 'info' })
    const csv = Papa.unparse(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'merchants_export.csv'
    link.click()
  }

  // ---------------------------
  // Render
  // ---------------------------

  return (
    <Layout>
      <Navigator />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Merchants</Typography>

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
              New Merchant
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 2, width: '40%' }}>
        <TextField
          size="small"
          placeholder="Search merchants by name, email, or phone..."
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
                        active={orderBy === (col.id as keyof Merchant)}
                        direction={orderBy === (col.id as keyof Merchant) ? order : 'asc'}
                        onClick={() => handleSort(col.id as keyof Merchant)}
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
                  <TableRow key={m.merchantId || i} hover>
                    <TableCell>{(page - 1) * 10 + i + 1}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.contactEmail}</TableCell>
                    <TableCell>{m.contactPhone}</TableCell>
                    <TableCell>{m.meansOfIdentification}</TableCell>
                    <TableCell>{m.address}</TableCell>
                    <TableCell>{typeof m.percentage === 'number' ? `${m.percentage}%` : ''}</TableCell>

                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit Merchant">
                          <IconButton color="primary" onClick={() => openEdit(m)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Merchant">
                          <IconButton color="error" onClick={() => confirmRemove(m.merchantId)} size="small">
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
                      No merchants found
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
      <CrudModal open={open} title={editing ? 'Edit Merchant' : 'New Merchant'} onClose={closeModal} onSave={handleSubmit(save)} saving={saving}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Basic Fields */}
          {[
            { name: 'name', label: 'Merchant Name' },
            { name: 'contactEmail', label: 'Email' },
            { name: 'contactPhone', label: 'Phone' },
          ].map((f) => (
            <Controller
              key={f.name}
              name={f.name as keyof Merchant}
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} size="small" label={f.label} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
          ))}

          {/* Means of ID */}
          <Controller
            name="meansOfIdentification"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>Means of Identification</InputLabel>
                <Select {...field} label="Means of Identification">
                  {idTypes.length > 0 ? idTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>) : <MenuItem disabled><em>No ID types available</em></MenuItem>}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          {/* Identification Number */}
          <Controller
            name="identificationNumber"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} size="small" label="Identification Number" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />

          {/* Category */}
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>Category</InputLabel>
                <Select {...field} label="Category">
                  {categories.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          {/* Country */}
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>Country</InputLabel>
                <Select {...field} label="Country">
                  {countries.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          {/* State */}
          <Controller
            name="state"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>State</InputLabel>
                <Select {...field} label="State">
                  {states.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          {/* LGA */}
          <Controller
            name="LGA"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} size="small">
                <InputLabel>LGA</InputLabel>
                <Select {...field} label="LGA">
                  {lgas.length > 0 ? lgas.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>) : <MenuItem disabled><em>No LGAs available</em></MenuItem>}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          {/* Percentage */}
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
                  // allow empty -> treat as NaN (validation will catch), but keep numeric conversion
                  const parsed = val === '' ? '' : Number(val)
                  field.onChange(parsed as any)
                }}
                value={field.value ?? ''}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          {/* MerchantLogo1 */}
          <Controller
            name="merchantLogo1"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>Merchant Logo 1</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const base64 = await fileToBase64(file, 800, 0.8)
                      field.onChange(base64)
                    }
                  }}
                />
                {field.value ? (
                  <img src={field.value} alt="Logo 1" style={{ width: 80, height: 80, objectFit: 'cover', marginTop: 8, borderRadius: 6 }} />
                ) : null}
              </Box>
            )}
          />

          {/* MerchantLogo2 */}
          <Controller
            name="merchantLogo2"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>Merchant Logo 2</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const base64 = await fileToBase64(file, 800, 0.8)
                      field.onChange(base64)
                    }
                  }}
                />
                {field.value ? (
                  <img src={field.value} alt="Logo 2" style={{ width: 80, height: 80, objectFit: 'cover', marginTop: 8, borderRadius: 6 }} />
                ) : null}
              </Box>
            )}
          />

          {/* Signature1 */}
          <Controller
            name="signature1"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>Signature 1</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const base64 = await fileToBase64(file, 800, 0.8)
                      field.onChange(base64)
                    }
                  }}
                />
                {field.value ? (
                  <img src={field.value} alt="Signature 1" style={{ width: 120, height: 60, objectFit: 'contain', marginTop: 8, borderRadius: 4 }} />
                ) : null}
              </Box>
            )}
          />

          {/* Signature2 */}
          <Controller
            name="signature2"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>Signature 2</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const base64 = await fileToBase64(file, 800, 0.8)
                      field.onChange(base64)
                    }
                  }}
                />
                {field.value ? (
                  <img src={field.value} alt="Signature 2" style={{ width: 120, height: 60, objectFit: 'contain', marginTop: 8, borderRadius: 4 }} />
                ) : null}
              </Box>
            )}
          />

          {/* Address */}
          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} size="small" label="Address" multiline rows={3} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Box>
      </CrudModal>

      {/* Delete dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Merchant</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this merchant? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={remove} variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
