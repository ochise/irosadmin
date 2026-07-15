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
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
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
   Models
-------------------------------------------- */
type Agent = {
  agentId?: string
  agentNumber?: string
  firstName: string
  surname: string
  email: string
  primaryPhoneNumber?: string
  identificationType: string
  identificationNumber: string
  dateOfBirth?: string
  merchant?: string
  role: string
  country: string
  state: string
  lga: string
  commissionRate: number
  revenueHead?: string,
  isPrincipalAgent: boolean
}

type IdTypeModel = { id: string; name: string }
type MerchantModel = { merchantId: string; name: string }
type RoleModel = { id: string; name: string }
type CountryModel = { id: string; name: string }
type StateModel = { id: string; name: string }
type LGAModel = { id: string; name: string }
type RevenueHeadModel = { id: string; name: string; merchantId: string }   // 👈 Added

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
  revenueHead: yup.string().required('Revenue Head is required'),   // 👈 Added validation
  role: yup.string().required('Role is required'),
  country: yup.string().required('Country is required'),
  state: yup.string().required('State is required'),
  lga: yup.string().required('LGA is required'),
  commissionRate: yup
    .number()
    .typeError("Commission rate must be a number")
    .required("Commission rate is required")
    .min(0, "Commission rate cannot be negative"),

}).required()

export default function AgentsPage() {
  /* --------------------------------------------
     State
  -------------------------------------------- */
  
  const [list, setList] = useState<Agent[]>([])
  const [filtered, setFiltered] = useState<Agent[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Agent | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>({ open: false })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [idTypes, setIdTypes] = useState<IdTypeModel[]>([])
  const [agentRoles, setAgentRoles] = useState<RoleModel[]>([])
  const [merchants, setMerchants] = useState<MerchantModel[]>([])
  const [countries, setCountries] = useState<CountryModel[]>([])
  const [states, setStates] = useState<StateModel[]>([])
  const [lgas, setLgas] = useState<LGAModel[]>([])
  const [loadingLGAs, setLoadingLGAs] = useState(false)

  const [revenueHeads, setRevenueHeads] = useState<RevenueHeadModel[]>([])   // 👈 Added

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin', 'Agent'])
  const isAdmin = useHasRole(['Admin'])
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };


  const { control, handleSubmit, reset, watch } = useForm<Agent>({
    resolver: yupResolver(schema),
  })

  const watchState = watch("state")
  const watchMerchant = watch("merchant")

  /* --------------------------------------------
     Normalizer
  -------------------------------------------- */
  const normalizeAgent = (a: any): Agent => ({
    ...a,
    merchant: typeof a.merchant === "object" ? a.merchant.merchantId : a.merchant,
    role: typeof a.role === "object" ? a.role.id : a.role,
    revenueHead: typeof a.revenueHead === "object" ? a.revenueHead.id : a.revenueHead,   // 👈 Added
  })

  /* --------------------------------------------
     Fetchers
-------------------------------------------- */
  useEffect(() => {
    fetchAgents()
    fetchIdTypes()
    fetchRoles()
    fetchMerchants()
    fetchCountries()
    fetchStates()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/agents')
      const data = (res.data || []).map(normalizeAgent)
      setList(data)
      setFiltered(data)
      setPageCount(Math.max(1, Math.ceil(data.length / 10)))
    } finally {
      setLoading(false)
    }
  }

  const fetchIdTypes = async () => {
    const res = await api.get('/SubSettings/by-setting/0006b218-0038-4579-bda9-475bbd204362')
    setIdTypes(res.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
  }

  const fetchRoles = async () => {
    const res = await api.get('/SubSettings/by-setting/e168bc4d-e1eb-4006-97b6-66e9d440264f')
    setAgentRoles(res.data.map((r: any) => ({ id: r.subDescription, name: r.subDescription })))
  }

  const fetchMerchants = async () => {
    const res = await api.get('/merchants')
    setMerchants(res.data)
  }

  const fetchCountries = async () => {
    const res = await api.get('/SubSettings/by-setting/7cefeea2-914b-412c-8912-6c7370050309')
    setCountries(res.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
  }

  const fetchStates = async () => {
    const res = await api.get('/SubSettings/by-setting/856e503a-b133-4c0d-9fcc-bb282939f94e')
    setStates(res.data.map((d: any) => ({ id: d.id, name: d.subDescription })))
  }

  const fetchLGAs = async (state: string) => {
    setLoadingLGAs(true)
    try {
      const res = await api.get(`/lga/lga-by-state?state=${state}`)
      setLgas(res.data.map((d: any) => ({ id: d.id, name: d.lgaName })))
    } finally {
      setLoadingLGAs(false)
    }
  }

  /* ---------------------
     Revenue Heads Fetch
  ------------------------ */
  const fetchRevenueHeads = async (merchantId: string) => {

    if (!merchantId) return setRevenueHeads([])

    const res = await api.get(`/revenueheads/by-merchant/${merchantId}`)

    setRevenueHeads(res.data.map((r: any) => ({
      id: r.revenueHeadId,
      name: r.revenueHeadName,
      merchantId: r.merchant
    })))
  }

  /* Load LGAs when state changes */
  useEffect(() => {
    setLgas([])
    if (watchState) fetchLGAs(watchState)
  }, [watchState])

  /* Load Revenue Heads when merchant changes */
  useEffect(() => {
    setRevenueHeads([])
    if (watchMerchant) {
      fetchRevenueHeads(watchMerchant)
      reset((prev) => ({ ...prev, revenueHead: "" }))
    }
  }, [watchMerchant])

  /* --------------------------------------------
     Search Filtering
-------------------------------------------- */
  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        if (!term) return setFiltered(list)
        const lower = term.toLowerCase()
        setFiltered(
          list.filter(
            (a) =>
              a.firstName?.toLowerCase().includes(lower) ||
              a.surname?.toLowerCase().includes(lower) ||
              a.email?.toLowerCase().includes(lower) ||
              a.primaryPhoneNumber?.includes(term)
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
     CRUD Handlers
-------------------------------------------- */
  const openCreate = () => {
    setEditing(null)
    reset({
      agentNumber: '',
      firstName: '',
      surname: '',
      email: '',
      primaryPhoneNumber: '',
      identificationType: '',
      identificationNumber: '',
      dateOfBirth: '',
      merchant: '',
      revenueHead: '',            // 👈 Added
      role: '',
      country: '',
      state: '',
      lga: '',
      commissionRate: 0
    })
    setOpen(true)
  }

  const openEdit = (agent: Agent) => {
    setEditing(agent)
    reset({
      ...agent,
      dateOfBirth: agent.dateOfBirth || "",
      revenueHead: agent.revenueHead || ""     // 👈 Added
    })
    setOpen(true)
  }

  const save = async (data: Agent) => {
    try {      
      data.isPrincipalAgent = isChecked;
            
      if (editing?.agentId) {
        await api.put(`/agents/${editing.agentId}`, data)
        enqueueSnackbar("Agent updated successfully", { variant: "success" })
      } else {
        await api.post('/agents', data)
        enqueueSnackbar("Agent created successfully", { variant: "success" })
      }

      setOpen(false)
      fetchAgents()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message, { variant: "error" })
    }
  }

  const confirmDeleteAgent = (id?: string) => {
    if (!id) return
    setConfirmDelete({ open: true, id })
  }

  const remove = async () => {
    if (!confirmDelete.id) return
    try {
      await api.delete(`/agents/${confirmDelete.id}`)
      enqueueSnackbar("Agent deleted successfully", { variant: "success" })
      fetchAgents()
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
    link.setAttribute('download', 'agents.csv')
    link.click()
  }

  const displayData = filtered.slice((page - 1) * 10, page * 10)

  /* --------------------------------------------
     RENDER
-------------------------------------------- */
  return (
    <Layout>
      <Navigator />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Agents</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon />,
            }}
          />

          {isAdmin && (
            <Tooltip title="Export CSV">
              <IconButton onClick={exportCSV}><FileDownloadIcon /></IconButton>
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip title="Add Agent">
              <IconButton color="primary" onClick={openCreate}>
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography align="center" sx={{ py: 4 }}>
          No agents found
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent Number</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Surname</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>

                <TableCell>Country</TableCell>
                <TableCell>State</TableCell>
                <TableCell>LGA</TableCell>

                <TableCell>Merchant</TableCell>
                <TableCell>Revenue Head</TableCell>   {/* 👈 Added here */}
                <TableCell>Role</TableCell>

                <TableCell>Commission Rate (%)</TableCell>
                <TableCell>DOB</TableCell>

                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayData.map((a) => (
                <TableRow key={a.agentId}>
                  <TableCell>{a.agentNumber}</TableCell>
                  <TableCell>{a.firstName}</TableCell>
                  <TableCell>{a.surname}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.primaryPhoneNumber}</TableCell>

                  <TableCell>{countries.find((c) => c.id === a.country)?.name}</TableCell>
                  <TableCell>{states.find((s) => s.id === a.state)?.name}</TableCell>
                  <TableCell>{lgas.find((l) => l.id === a.lga)?.name}</TableCell>

                  <TableCell>{merchants.find((m) => m.merchantId === a.merchant)?.name}</TableCell>

                  {/* Display Revenue Head */}
                  <TableCell>
                    {revenueHeads.find((rh) => rh.id === a.revenueHead)?.name || "-"}
                  </TableCell>

                  <TableCell>{agentRoles.find((r) => r.id === a.role)?.name}</TableCell>

                  <TableCell>{a.commissionRate}%</TableCell>
                  <TableCell>{a.dateOfBirth ? new Date(a.dateOfBirth).toLocaleDateString() : "-"}</TableCell>

                  {canEdit && (
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => openEdit(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => confirmDeleteAgent(a.agentId)}>
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
      )}

      {/* CRUD Modal */}
      <CrudModal
        open={open}
        title={editing ? 'Edit Agent' : 'New Agent'}
        onClose={() => setOpen(false)}
        onSave={handleSubmit(save)}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>         
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="isPrincipalAgent"
              control={control}
              render={({ field, fieldState }) => (
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={isChecked }
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Is a principal agent"
                  />
                </FormGroup>
              )}
            />
            {/* Country */}
            <Controller
              name="country"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Country</InputLabel>
                  <Select {...field} label="Country">
                    {countries.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
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
                    {states.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
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
                    {loadingLGAs
                      ? <MenuItem disabled>Loading...</MenuItem>
                      : lgas.map((l) => (
                        <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                      ))
                    }
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
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
                    {merchants.map((m) => (
                      <MenuItem key={m.merchantId} value={m.merchantId}>{m.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                </FormControl>
              )}
            />

            {/* Revenue Head */}
            <Controller
              name="revenueHead"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Revenue Head</InputLabel>
                  <Select {...field} label="Revenue Head" disabled={!watchMerchant}>
                    {revenueHeads.length === 0 && watchMerchant && (
                      <MenuItem disabled>Loading...</MenuItem>
                    )}

                    {revenueHeads.map((rh) => (
                      <MenuItem key={rh.id} value={rh.id}>{rh.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                </FormControl>
              )}
            />

            {/* Role */}
            <Controller
              name="role"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    {agentRoles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                </FormControl>
              )}
            />

            {/* Commission Rate */}
            <Controller
              name="commissionRate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  type="number"
                  size="small"
                  label="Commission Rate (%)"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Text Inputs */}
            <Controller name="agentNumber" control={control} render={({ field, fieldState }) => (
              <TextField size="small" label="Agent Number" {...field}
                error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
            )} />

            <Controller name="firstName" control={control} render={({ field, fieldState }) => (
              <TextField size="small" label="First Name" {...field}
                error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
            )} />

            <Controller name="surname" control={control} render={({ field, fieldState }) => (
              <TextField size="small" label="Surname" {...field}
                error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
            )} />

            <Controller name="email" control={control} render={({ field, fieldState }) => (
              <TextField size="small" label="Email" {...field}
                error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
            )} />

            <Controller
              name="primaryPhoneNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField size="small" label="Phone Number" {...field}
                  error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
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
                  onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : "")}
                  slotProps={{
                    textField: {
                      size: "small",
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />

            {/* Means of ID */}
            <Controller
              name="identificationType"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl size="small" fullWidth error={!!fieldState.error}>
                  <InputLabel>Identification Type</InputLabel>
                  <Select {...field} label="ID Type">
                    {idTypes.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                </FormControl>
              )}
            />

            <Controller
              name="identificationNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField size="small" label="ID Number" {...field}
                  error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )}
            />

          </Box>
        </LocalizationProvider>
      </CrudModal>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this agent?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false })}>Cancel</Button>
          <Button color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
