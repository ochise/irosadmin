import React, { useEffect, useState, useMemo } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import {
  Box, TextField, IconButton, Tooltip, Typography,
  MenuItem, Select, InputLabel, FormControl, Card, CardContent,
  CardActions, Button, Grid, Pagination, Chip, Paper,
  Drawer, useTheme, useMediaQuery, Stack, Skeleton
} from '@mui/material'
import CrudModal from '../../components/CrudModal'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { useHasRole } from '../../auth/useRole'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import EditIcon from '@mui/icons-material/Edit'
import FilterListIcon from '@mui/icons-material/FilterList'
import debounce from 'lodash.debounce'
import { Navigator } from '../../components/Navigator'

//
// TYPES
//
type Entity = {
  revenueEntityId?: string
  merchantId: string
  revenueHeadId: string
  subRevenueHeadId?: string
  agentId: string
  accountName: string
  email: string
  phone?: string
  Country: string
  State: string
  Lga: string
  identificationType: string
  meansOfIdentification?: string
  identificationNumber?: string
  nextInvoiceDate: string
  invoiceEndDate?: string
  entityType: string
}

type Country = { id: string; name: string }
type State = { id: string; name: string }
type LGA = { id: string; name: string }
type RevenueHead = { revenueHeadId: string; revenueHeadName: string }
type SubRevenueHead = { subRevenueHeadId: string; subRevenueName: string }
type Merchant = { merchantId: string; name: string }
type Agent = { agentId: string; firstName: string; surname: string; email: string }
type MeansOfIdType = { id: string; subDescription: string }
type EntityType = { id: string; subDescription: string }

//
// VALIDATION
//
const schema = yup.object({
  merchantId: yup.string().required('Merchant is required'),
  revenueHeadId: yup.string().required('Revenue Head is required'),
  subRevenueHeadId: yup.string().required('Sub Revenue Head is required'),
  agentId: yup.string().required('Agent is required'),
  accountName: yup.string().required('Entity name is required'),
  email: yup.string().email().required('Email is required'),
  Country: yup.string().required('Country is required'),
  State: yup.string().required('State is required'),
  Lga: yup.string().required('LGA is required'),
  entityType: yup.string().required('Entity Type is required'),
  nextInvoiceDate: yup.string().required('Start Date is required'),
  
})

export default function EntitiesPage() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const [list, setList] = useState<Entity[]>([])
  const [filtered, setFiltered] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [heads, setHeads] = useState<RevenueHead[]>([])
  const [subHeads, setSubHeads] = useState<SubRevenueHead[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [agents, setAgents] = useState<Agent[]>([])

  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])

  const [meansTypes, setMeansTypes] = useState<MeansOfIdType[]>([])
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([])

  // Filters state
  const [filterMerchant, setFilterMerchant] = useState<string>('')
  const [filterEntityType, setFilterEntityType] = useState<string>('')
  const [filterCountry, setFilterCountry] = useState<string>('')
  const [filterState, setFilterState] = useState<string>('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  const [filtersOpen, setFiltersOpen] = useState(isMdUp)
  const toggleFilters = () => setFiltersOpen(v => !v)

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin', 'Entity'])
  const isAdmin = useHasRole(['Admin'])

  const { control, handleSubmit, reset } = useForm<Entity>({
    resolver: yupResolver(schema),
    defaultValues: {
      merchantId: '',
      revenueHeadId: '',
      subRevenueHeadId: '',
      agentId: '',
      accountName: '',
      email: '',
      phone: '',
      Country: '',
      State: '',
      Lga: '',
      meansOfIdentification: '',
      identificationNumber: '',
      nextInvoiceDate: '',
      entityType: ''
    }
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Entity | null>(null)

  // WATCH cascading
  const selectedMerchantId = useWatch({ control, name: 'merchantId' })
  const selectedHeadId = useWatch({ control, name: 'revenueHeadId' })
  const selectedCountryId = useWatch({ control, name: 'Country' })
  const selectedStateId = useWatch({ control, name: 'State' })

  //
  // GRADIENTS
  //
  const gradients = [
    'linear-gradient(135deg, rgba(79,70,229,0.65), rgba(59,130,246,0.65), rgba(6,182,212,0.65))',
    'linear-gradient(135deg, rgba(168,85,247,0.65), rgba(236,72,153,0.65), rgba(244,63,94,0.65))',
    'linear-gradient(135deg, rgba(16,185,129,0.65), rgba(20,184,166,0.65), rgba(59,130,246,0.65))',
    'linear-gradient(135deg, rgba(251,191,36,0.65), rgba(251,146,60,0.65), rgba(244,63,94,0.65))',
    'linear-gradient(135deg, rgba(14,165,233,0.65), rgba(6,182,212,0.65), rgba(16,185,129,0.65))',
    'linear-gradient(135deg, rgba(236,72,153,0.65), rgba(244,63,94,0.65), rgba(251,113,133,0.65))',
  ]
  const getGradient = (index: number) => gradients[index % gradients.length]

  //
  // PAGINATION
  //
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => setPage(1), [search, filterMerchant, filterEntityType, filterCountry, filterState, pageSize])

  //
  // SEARCH
  //
  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        if (!term) {
          setFiltered(list)
          return
        }
        const lower = term.toLowerCase()
        setFiltered(list.filter(e =>
          e.accountName.toLowerCase().includes(lower) ||
          e.email.toLowerCase().includes(lower) ||
          e.phone?.includes(term)
        ))
      }, 300),
    [list]
  )
  useEffect(() => handleSearch(search), [search, handleSearch])

  //
  // INITIAL LOAD
  //
  useEffect(() => {
    fetchEntities()
    fetchMerchants()
    fetchCountries()
    fetchMeansOfIdentification()
    fetchEntityTypes()
  }, [])

  //
  // API CALLS
  //
  const fetchEntities = async () => {
    setLoading(true)
    try {
      const res = await api.get('/entities')
      setList(res.data ?? [])
      setFiltered(res.data ?? [])
    } catch {
      enqueueSnackbar('Failed to fetch entities', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchMerchants = async () => {
    const res = await api.get('/merchants')
    setMerchants(res.data ?? [])
  }

  const fetchMeansOfIdentification = async () => {
    const res = await api.get('/SubSettings/by-setting/0006b218-0038-4579-bda9-475bbd204362')
    setMeansTypes(res.data ?? [])
  }

  const fetchEntityTypes = async () => {
    const res = await api.get('/SubSettings/by-setting/45d460d7-370e-4c5c-9c61-8e408d2c7113')
    setEntityTypes(res.data ?? [])
  }

  const fetchCountries = async () => {
    const res = await api.get('/SubSettings/by-setting/7cefeea2-914b-412c-8912-6c7370050309')
    setCountries(res.data.map((d: any) => ({ id: d.subDescription, name: d.subDescription })))
  }

  const fetchStates = async () => {
    const res = await api.get(`/SubSettings/by-setting/856e503a-b133-4c0d-9fcc-bb282939f94e`)
    setStates(res.data.map((d: any) => ({ id: d.id, name: d.subDescription })))
  }

  const fetchLgas = async (stateId: string) => {
    const res = await api.get(`/lga/lga-by-state?state=${stateId}`)
    setLgas(res.data.map((d: any) => ({ id: d.id, name: d.lgaName })))
  }

  const fetchRevenueHeadsForMerchant = async (merchantId: string) => {
    const res = await api.get(`/revenueheads/by-merchant/${merchantId}`)
    setHeads(res.data ?? [])
  }

  const fetchAgentsForMerchant = async (merchantId: string) => {
    const res = await api.get(`/agents/by-merchant/${merchantId}`)
    setAgents(res.data ?? [])
  }

  const fetchSubHeadsForHead = async (headId: string) => {
    const res = await api.get(`/revenuesubheads/by-head/${headId}`)
    setSubHeads(res.data ?? [])
  }

  //
  // CASCADING DROPDOWNS
  //
  useEffect(() => {
    if (!selectedMerchantId) {
      setHeads([])
      setAgents([])
      return
    }
    fetchRevenueHeadsForMerchant(selectedMerchantId)
    fetchAgentsForMerchant(selectedMerchantId)
  }, [selectedMerchantId])

  useEffect(() => {
    if (!selectedHeadId) {
      setSubHeads([])
      return
    }
    fetchSubHeadsForHead(selectedHeadId)
  }, [selectedHeadId])

  useEffect(() => {
    if (selectedCountryId) fetchStates()
    else setStates([])
  }, [selectedCountryId])

  useEffect(() => {
    if (selectedStateId) fetchLgas(selectedStateId)
    else setLgas([])
  }, [selectedStateId])

  //
  // APPLY FILTERS
  //
  useEffect(() => {
    let s = [...list]
    if (filterMerchant) s = s.filter(e => e.merchantId === filterMerchant)
    if (filterEntityType) s = s.filter(e => e.entityType === filterEntityType)
    if (filterCountry) s = s.filter(e => e.Country === filterCountry)
    if (filterState) s = s.filter(e => e.State === filterState)

    if (search) {
      const lower = search.toLowerCase()
      s = s.filter(e =>
        e.accountName.toLowerCase().includes(lower) ||
        e.email.toLowerCase().includes(lower) ||
        e.phone?.includes(search)
      )
    }
    setFiltered(s)
  }, [list, filterMerchant, filterEntityType, filterCountry, filterState, search])

  //
  // CRUD
  //
  const openCreate = () => {
    setEditing(null)
    reset()
    setOpen(true)
  }

  const openEdit = (entity: Entity) => {
    setEditing(entity)
    reset(entity)
    setOpen(true)
  }

  const close = () => {
    setEditing(null)
    setOpen(false)
  }

  const save = async (data: Entity) => {
    try {
      
      if (editing?.revenueEntityId) {
        
        await api.put(`/entities/${editing.revenueEntityId}`, data)
        enqueueSnackbar('Entity updated', { variant: 'success' })
      } else {
        await api.post('/entities', data)
        enqueueSnackbar('Entity created', { variant: 'success' })
      }
      fetchEntities()
      close()
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to save', { variant: 'error' })
    }
  }

  //
  // UI
  //
  return (
    <Layout>
      <Navigator />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1 }}>
            <Typography variant="h5" sx={{ alignSelf: 'center' }}>Entities</Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              />

              <FormControl size="small">
                <Select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                >
                  <MenuItem value={6}>6</MenuItem>
                  <MenuItem value={9}>9</MenuItem>
                  <MenuItem value={12}>12</MenuItem>
                </Select>
              </FormControl>

              {isAdmin && (
                <Tooltip title="Export CSV">
                  <IconButton color="secondary">
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              )}

              {canEdit && (
                <Tooltip title="Add Entity">
                  <IconButton color="primary" onClick={openCreate}>
                    <AddCircleIcon />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Filters">
                <IconButton onClick={toggleFilters}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* CARD DISPLAY */}
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: Math.max(3, pageSize) }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Paper sx={{ borderRadius: 3, height: 280, p: 2 }}>
                    <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
                    <Box sx={{ mt: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" />
                      <Skeleton width="80%" />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginated.map((entity, idx) => {
                  const globalIndex = (page - 1) * pageSize + idx
                  return (
                    <Grid item xs={12} sm={6} md={4} key={entity.revenueEntityId}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          height: 280,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          background: getGradient(globalIndex),
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          backdropFilter: 'blur(4px)',
                          transition: 'transform 0.35s',
                          backgroundSize: '200% 200%',
                          p: 1
                        }}
                      >
                        <CardContent sx={{ pb: 0 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                            {entity.accountName}
                          </Typography>

                          <Chip
                            label={entityTypes.find(t => t.id === entity.entityType)?.subDescription || '—'}
                            size="small"
                            sx={{ bgcolor: 'rgba(10,1,1,0.12)', color: 'white', borderRadius: 10, mt: .5 }}
                          />

                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
                            Email: {entity.email}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Phone: {entity.phone}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={merchants.find(m => m.merchantId === entity.merchantId)?.name || '—'}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', borderRadius: 10 }}
                            />
                          </Stack>

                          <Typography variant="body2" mt={1}>
                            <Chip
                              label={'Next Invoice Date: ' + entity.nextInvoiceDate}
                              size="small"
                              sx={{ bgcolor: 'rgba(34,14,14,0.16)', color: 'white', borderRadius: 10 }}
                            />
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          {canEdit && (
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => openEdit(entity)}
                              sx={{
                                color: 'white',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.max(1, Math.ceil(filtered.length / pageSize))}
                  page={page}
                  onChange={(e, val) => setPage(val)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            </>
          )}

          {/* MODAL */}
          <CrudModal
            open={open}
            title={editing ? 'Edit Entity' : 'New Entity'}
            onClose={close}
            onSave={handleSubmit(save)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt:2 }}>

              {/* ENTITY TYPE */}
              <Controller
                name="entityType"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Entity Type</InputLabel>
                    <Select {...field} label="Entity Type">
                      {entityTypes.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.subDescription}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* COUNTRY */}
              <Controller
                name="Country"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country">
                      {countries.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* STATE */}
              <Controller
                name="State"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>State</InputLabel>
                    <Select {...field} label="State">
                      {states.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* LGA */}
              <Controller
                name="Lga"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>LGA</InputLabel>
                    <Select {...field} label="LGA" disabled={!selectedStateId}>
                      {lgas.map(l => (
                        <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* MERCHANT */}
              <Controller
                name="merchantId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Merchant</InputLabel>
                    <Select {...field} label="Merchant">
                      {merchants.map(m => (
                        <MenuItem key={m.merchantId} value={m.merchantId}>{m.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* REVENUE HEAD */}
              <Controller
                name="revenueHeadId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Revenue Head</InputLabel>
                    <Select {...field} label="Revenue Head" disabled={!selectedMerchantId}>
                      {heads.map(h => (
                        <MenuItem key={h.revenueHeadId} value={h.revenueHeadId}>{h.revenueHeadName}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* SUB HEAD */}
              <Controller
                name="subRevenueHeadId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Sub Revenue Head</InputLabel>
                    <Select {...field} label="Sub Revenue Head" disabled={!selectedHeadId}>
                      {subHeads.map(s => (
                        <MenuItem key={s.subRevenueHeadId} value={s.subRevenueHeadId}>{s.subRevenueName}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* AGENT */}
              <Controller
                name="agentId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Agent</InputLabel>
                    <Select {...field} label="Agent" disabled={!selectedMerchantId}>
                      {agents.map(a => (
                        <MenuItem key={a.agentId} value={a.agentId}>
                          {a.firstName} {a.surname} ({a.email})
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* ENTITY NAME */}
              <Controller
                name="accountName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    label="Entity Name"
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              {/* EMAIL */}
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    label="Email"
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              {/* PHONE */}
              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    label="Phone"
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              {/* ID TYPE */}
              <Controller
                name="identificationType"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl size="small" fullWidth error={!!fieldState.error}>
                    <InputLabel>Means of Identification</InputLabel>
                    <Select {...field} label="Means of ID">
                      {meansTypes.map(m => (
                        <MenuItem key={m.id} value={m.id}>{m.subDescription}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="error">{fieldState.error?.message}</Typography>
                  </FormControl>
                )}
              />

              {/* ID NUMBER */}
              <Controller
                name="identificationNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    label="Identification Number"
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              {/* START DATE */}
              <Controller
                name="nextInvoiceDate"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    type="date"
                    label="Revenue Start Date"
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
               {/* END DATE */}
              <Controller
                name="invoiceEndDate"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    size="small"
                    type="date"
                    label="Revenue End Date"
                    InputLabelProps={{ shrink: true }}
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

            </Box>
          </CrudModal>
        </Box>

        {/* FILTER PANEL */}
        {isMdUp ? (
          filtersOpen && (
            <Paper
              elevation={2}
              sx={{
                width: 260,
                p: 2,
                position: 'sticky',
                top: 80,
                height: 'fit-content'
              }}
            >
              <Typography variant="h6" mb={1}>Filters</Typography>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Merchant</InputLabel>
                <Select
                  value={filterMerchant}
                  onChange={(e) => setFilterMerchant(e.target.value)}
                  label="Merchant"
                >
                  <MenuItem value="">All</MenuItem>
                  {merchants.map(m => <MenuItem key={m.merchantId} value={m.merchantId}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                  label="Entity Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {entityTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.subDescription}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Country</InputLabel>
                <Select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  label="Country"
                >
                  <MenuItem value="">All</MenuItem>
                  {countries.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>State</InputLabel>
                <Select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  label="State"
                >
                  <MenuItem value="">All</MenuItem>
                  {states.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFilterMerchant('')
                  setFilterEntityType('')
                  setFilterCountry('')
                  setFilterState('')
                }}
              >
                Clear
              </Button>
            </Paper>
          )
        ) : (
          <Drawer anchor="right" open={filtersOpen} onClose={toggleFilters}>
            <Box sx={{ width: 260, p: 2 }}>
              <Typography variant="h6" mb={1}>Filters</Typography>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Merchant</InputLabel>
                <Select
                  value={filterMerchant}
                  onChange={(e) => setFilterMerchant(e.target.value)}
                  label="Merchant"
                >
                  <MenuItem value="">All</MenuItem>
                  {merchants.map(m => <MenuItem key={m.merchantId} value={m.merchantId}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                  label="Entity Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {entityTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.subDescription}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Country</InputLabel>
                <Select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  label="Country"
                >
                  <MenuItem value="">All</MenuItem>
                  {countries.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>State</InputLabel>
                <Select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  label="State"
                >
                  <MenuItem value="">All</MenuItem>
                  {states.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFilterMerchant('')
                  setFilterEntityType('')
                  setFilterCountry('')
                  setFilterState('')
                }}
              >
                Clear
              </Button>
            </Box>
          </Drawer>
        )}
      </Box>
    </Layout>
  )
}
