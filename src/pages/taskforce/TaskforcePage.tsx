import React, { useEffect, useState, useMemo } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Typography, Tooltip
} from '@mui/material'
import Pagination from '../../components/Pagination'
import CrudModal from '../../components/CrudModal'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { useHasRole } from '../../auth/useRole'

import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import debounce from 'lodash.debounce'
import Papa from 'papaparse'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { Navigator } from '../../components/Navigator'

/* --------------------------------------------
   Taskforce Model (cleaned)
-------------------------------------------- */
type Taskforce = {
  id?: string

  firstName: string
  surname: string
  email: string
  primaryPhoneNumber: string

  identificationType: string
  identificationNumber: string

  dateOfBirth: string

  merchant: string

  country: string
  state: string
  lga: string
}

type IdTypeModel = { id: string; name: string }
type MerchantModel = { merchantId: string; name: string }
type CountryModel = { id: string; name: string }
type StateModel = { id: string; name: string }
type LGAModel = { id: string; name: string }

/* --------------------------------------------
   Validation Schema
-------------------------------------------- */
const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  surname: yup.string().required('Surname is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  primaryPhoneNumber: yup.string().required('Phone number is required'),

  identificationType: yup.string().required('Identification type is required'),
  identificationNumber: yup.string().required('Identification number is required'),

  dateOfBirth: yup.string().required('Date of Birth is required'),

  merchant: yup.string().required('Merchant is required'),

  country: yup.string().required('Country is required'),
  state: yup.string().required('State is required'),
  lga: yup.string().required('LGA is required'),
}).required()

export default function TaskforcePage() {
  /* --------------------------------------------
     State
  -------------------------------------------- */
  const [list, setList] = useState<Taskforce[]>([])
  const [filtered, setFiltered] = useState<Taskforce[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Taskforce | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>({ open: false })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [idTypes, setIdTypes] = useState<IdTypeModel[]>([])
  const [merchants, setMerchants] = useState<MerchantModel[]>([])

  const [countries, setCountries] = useState<CountryModel[]>([])
  const [states, setStates] = useState<StateModel[]>([])
  const [lgas, setLgas] = useState<LGAModel[]>([])

  const [loadingLGAs, setLoadingLGAs] = useState(false)

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin', 'Agent'])
  const isAdmin = useHasRole(['Admin'])

  const { control, handleSubmit, reset, watch } = useForm<Taskforce>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      primaryPhoneNumber: '',
      identificationType: '',
      identificationNumber: '',
      dateOfBirth: '',
      merchant: '',
      country: '',
      state: '',
      lga: '',
    }
  })

  const watchState = watch("state")

  /* --------------------------------------------
     Data Normalizer
-------------------------------------------- */
  const normalizeTaskforce = (a: any): Taskforce => ({
    id: a.id || a.taskforceId,

    firstName: a.firstName || '',
    surname: a.surname || '',
    email: a.email || '',
    primaryPhoneNumber: a.primaryPhoneNumber || '',

    identificationType: a.identificationType || '',
    identificationNumber: a.identificationNumber || '',

    dateOfBirth: a.dateOfBirth || '',

    merchant: typeof a.merchant === "object" ? a.merchant.merchantId : a.merchant,

    country: typeof a.country === "object" ? a.country.id : a.country,
    state: typeof a.state === "object" ? a.state.id : a.state,
    lga: typeof a.lga === "object" ? a.lga.id : a.lga,
  })

  /* --------------------------------------------
     Fetchers
-------------------------------------------- */
  useEffect(() => {
    fetchTaskforces()
    fetchIdTypes()
    fetchMerchants()
    fetchCountries()
    fetchStates()
  }, [])

  const fetchTaskforces = async () => {
    setLoading(true)
    try {
      const res = await api.get('/taskforce')
      const data = (res.data || []).map(normalizeTaskforce)
      setList(data)
      setFiltered(data)
      setPageCount(Math.max(1, Math.ceil(data.length / 10)))
    } finally {
      setLoading(false)
    }
  }

  const fetchIdTypes = async () => {
    const res = await api.get('/SubSettings/by-setting/615b66b8-5b92-4779-94ab-5013b2e30f42')
    setIdTypes(res.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
  }

  const fetchMerchants = async () => {
    const res = await api.get('/merchants')
    setMerchants(res.data)
  }

  const fetchCountries = async () => {
    const res = await api.get('/SubSettings/by-setting/f8027b7e-5a0c-4624-93ff-f25400a5e58a')
    setCountries(res.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
  }

  const fetchStates = async () => {
    const res = await api.get('/SubSettings/by-setting/0613d3a4-aee9-4bab-bf57-2151b162534a')
    setStates(res.data.map((d: any) => ({ id: d.id, name: d.subDescription })))
  }

  const fetchLGAs = async (stateId: string) => {
    setLoadingLGAs(true)
    try {
      const res = await api.get(`/lga/lga-by-state?state=${encodeURIComponent(stateId)}`)
      setLgas(res.data.map((d: any) => ({ id: d.id, name: d.lgaName })))
    } finally {
      setLoadingLGAs(false)
    }
  }

  useEffect(() => {
    setLgas([])
    if (watchState) fetchLGAs(watchState)
  }, [watchState])

  /* --------------------------------------------
     Search
-------------------------------------------- */
  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        if (!term) return setFiltered(list)

        const lower = term.toLowerCase()

        setFiltered(
          list.filter(
            (a) =>
              a.firstName.toLowerCase().includes(lower) ||
              a.surname.toLowerCase().includes(lower) ||
              a.email.toLowerCase().includes(lower) ||
              a.primaryPhoneNumber.includes(term)
          )
        )
      }, 250),
    [list]
  )

  useEffect(() => {
    handleSearch(search)
    return () => handleSearch.cancel()
  }, [search, handleSearch])

  /* --------------------------------------------
     CRUD
-------------------------------------------- */
  const openCreate = () => {
    setEditing(null)
    reset({
      firstName: '',
      surname: '',
      email: '',
      primaryPhoneNumber: '',
      identificationType: '',
      identificationNumber: '',
      dateOfBirth: '',
      merchant: '',
      country: '',
      state: '',
      lga: '',
    })
    setOpen(true)
  }

  const openEdit = (row: Taskforce) => {
    setEditing(row)
    reset({
      ...row,
      dateOfBirth: row.dateOfBirth || "",
    })
    setOpen(true)
  }

  const save = async (data: Taskforce) => {
    try {
      if (editing?.id) {
        await api.put(`/taskforce/${editing.id}`, data)
        enqueueSnackbar("Taskforce updated", { variant: "success" })
      } else {
        await api.post('/taskforce', data)
        enqueueSnackbar("Taskforce created", { variant: "success" })
      }

      setOpen(false)
      fetchTaskforces()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message, { variant: 'error' })
    }
  }

  const confirmDeleteTaskforce = (id?: string) => {
    setConfirmDelete({ open: true, id })
  }

  const remove = async () => {
    if (!confirmDelete.id) return
    try {
      await api.delete(`/taskforce/${confirmDelete.id}`)
      enqueueSnackbar("Taskforce deleted", { variant: 'success' })
      fetchTaskforces()
    } finally {
      setConfirmDelete({ open: false })
    }
  }

  /* --------------------------------------------
     CSV Export
-------------------------------------------- */
  const exportCSV = () => {
    const csv = Papa.unparse(list)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'taskforces.csv')
    link.click()
  }

  const displayData = filtered.slice((page - 1) * 10, page * 10)

  /* --------------------------------------------
     Render
-------------------------------------------- */
  return (
    <Layout>
      <Navigator />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Taskforce</Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon /> }}
          />

          {isAdmin && (
            <Tooltip title="Export CSV">
              <IconButton onClick={exportCSV}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip title="Add Taskforce">
              <IconButton color="primary" onClick={openCreate}>
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography align="center" sx={{ py: 4 }}>
          No records found
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Surname</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>LGA</TableCell>
                  <TableCell>Merchant</TableCell>
                  <TableCell>DOB</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {displayData.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.firstName}</TableCell>
                    <TableCell>{a.surname}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.primaryPhoneNumber}</TableCell>

                    <TableCell>{countries.find(c => c.id === a.country)?.name}</TableCell>
                    <TableCell>{states.find(s => s.id === a.state)?.name}</TableCell>
                    <TableCell>{lgas.find(l => l.id === a.lga)?.name}</TableCell>

                    <TableCell>{merchants.find(m => m.merchantId === a.merchant)?.name}</TableCell>

                    <TableCell>
                      {a.dateOfBirth
                        ? new Date(a.dateOfBirth).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => openEdit(a)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => confirmDeleteTaskforce(a.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={(p: number) => setPage(p)}
            />
          </Box>
        </>
      )}

      {/* CRUD Modal */}
      <CrudModal
        open={open}
        title={editing ? "Edit Taskforce" : "New Taskforce"}
        onClose={() => setOpen(false)}
        onSave={handleSubmit(save)}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Country */}
            <Controller
              name="country"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Country</InputLabel>
                  <Select {...field} label="Country">
                    {countries.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">
                    {fieldState.error?.message}
                  </Typography>
                </FormControl>
              )}
            />

            {/* State */}
            <Controller
              name="state"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>State</InputLabel>
                  <Select {...field} label="State">
                    {states.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">
                    {fieldState.error?.message}
                  </Typography>
                </FormControl>
              )}
            />

            {/* LGA */}
            <Controller
              name="lga"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>LGA</InputLabel>
                  <Select {...field} label="LGA" disabled={!watchState}>
                    {loadingLGAs ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : (
                      lgas.map(l => (
                        <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                      ))
                    )}
                  </Select>
                  <Typography variant="caption" color="error">
                    {fieldState.error?.message}
                  </Typography>
                </FormControl>
              )}
            />

            {/* Merchant */}
            <Controller
              name="merchant"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Merchant</InputLabel>
                  <Select {...field} label="Merchant">
                    {merchants.map(m => (
                      <MenuItem key={m.merchantId} value={m.merchantId}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">
                    {fieldState.error?.message}
                  </Typography>
                </FormControl>
              )}
            />

            {/* First Name */}
            <Controller
              name="firstName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="First Name"
                  size="small"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Surname */}
            <Controller
              name="surname"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Surname"
                  size="small"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Email"
                  size="small"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Phone Number */}
            <Controller
              name="primaryPhoneNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Phone Number"
                  size="small"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Date of Birth */}
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  label="Date of Birth"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={date => field.onChange(date ? date.format("YYYY-MM-DD") : "")}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message,
                    },
                  }}
                />
              )}
            />

            {/* Identification Type */}
            <Controller
              name="identificationType"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Identification Type</InputLabel>
                  <Select {...field} label="Identification Type">
                    {idTypes.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">
                    {fieldState.error?.message}
                  </Typography>
                </FormControl>
              )}
            />

            {/* Identification Number */}
            <Controller
              name="identificationNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Identification Number"
                  size="small"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

          </Box>
        </LocalizationProvider>
      </CrudModal>

      {/* Delete Confirmation */}
      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this taskforce record?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false })}>Cancel</Button>
          <Button color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
