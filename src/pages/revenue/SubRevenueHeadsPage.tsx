import React, { useEffect, useState, useMemo, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Tooltip,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, TableSortLabel, ClickAwayListener,
  Autocomplete
} from '@mui/material'
import Pagination from '../../components/Pagination'
import CrudModal from '../../components/CrudModal'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { useHasRole } from '../../auth/useRole'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import debounce from 'lodash.debounce'
import { Navigator } from '../../components/Navigator'

type Sub = {
  subRevenueHeadId?: string
  revenueHead?: string
  subRevenueName?: string
  revenueLevy?: number
  revenueFrequency?: string
  unit?: number
}

type RevenueHead = { id: string; name: string }
type Frequency = { id: string; name: string }
type Order = 'asc' | 'desc'

const schema = yup.object({
  revenueHead: yup.string().required('Revenue Head is required'),
  subRevenueName: yup.string().required('Sub Revenue Name is required'),
  revenueLevy: yup
    .number()
    .typeError('Must be a number')
    .required('Levy is required'),
  revenueFrequency: yup.string().required('Frequency is required'),
  unit: yup
    .number()
    .typeError('Unit must be a number')
    .required('Unit is required'),
}).required()

/** Reusable Search Input */
function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const expand = () => {
    setFocused(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const collapseIfEmpty = () => {
    if (!value) setFocused(false)
  }

  return (
    <ClickAwayListener onClickAway={collapseIfEmpty}>
      <Box
        onClick={expand}
        sx={{
          display: 'flex',
          alignItems: 'center',
          transition: 'width 0.3s',
          width: focused || value ? 240 : 40,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          height: 36,
          position: 'relative'
        }}
      >
        <SearchIcon sx={{ position: 'absolute', left: 8, color: 'text.secondary' }} />
        <TextField
          inputRef={inputRef}
          variant="standard"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={collapseIfEmpty}
          placeholder={placeholder}
          InputProps={{ disableUnderline: true }}
          sx={{
            pl: 4,
            pr: 1,
            width: '100%',
            opacity: focused || value ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      </Box>
    </ClickAwayListener>
  )
}

export default function SubRevenueHeadsPage() {

  const [list, setList] = useState<Sub[]>([])
  const [filtered, setFiltered] = useState<Sub[]>([])
  const [revenueHeads, setRevenueHeads] = useState<RevenueHead[]>([])
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [loadingFreq, setLoadingFreq] = useState(false)
  const [loadingHeads, setLoadingHeads] = useState(false)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: undefined })
  const [editing, setEditing] = useState<Sub | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<keyof Sub>('subRevenueName')

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin'])

  const { control, handleSubmit, reset } = useForm<Sub>({
    resolver: yupResolver(schema),
    defaultValues: {
      revenueHead: '',
      subRevenueName: '',
      revenueLevy: 0,
      revenueFrequency: '',
      unit: 0
    }
  })

  /** Debounced Search */
  const runSearch = useMemo(
    () =>
      debounce((term: string, src: Sub[]) => {
        if (!term) return setFiltered(src)

        const lower = term.toLowerCase()

        setFiltered(
          src.filter(
            (s) =>
              s.subRevenueName?.toLowerCase().includes(lower) ||
              s.revenueFrequency?.toLowerCase().includes(lower) ||
              s.unit?.toString().includes(lower)
          )
        )
      }, 300),
    []
  )

  useEffect(() => runSearch(search, list), [search, list, runSearch])

  useEffect(() => {
    fetchAll()
    fetchRevenueHeads()
    fetchFrequencies()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/revenuesubheads')
      const data = res.data || []
      setList(data)
      setFiltered(data)
    } catch (error) {
      enqueueSnackbar('Failed to load Sub Revenue Heads', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueHeads = async () => {
    setLoadingHeads(true)
    try {
      const res = await api.get('/revenueheads')
      const data = res.data || []
      setRevenueHeads(data.map((r: any) => ({
        id: r.revenueHeadId,
        name: r.revenueHeadName
      })))
    } catch {
      enqueueSnackbar('Failed to load Revenue Heads', { variant: 'error' })
    } finally {
      setLoadingHeads(false)
    }
  }

  const fetchFrequencies = async () => {
    setLoadingFreq(true)
    try {
      const res = await api.get('/SubSettings/by-setting/e9aff450-79d3-4264-a324-c44365f01cbb')
      const data = res.data || []

      setFrequencies(
        data.map((f: any) => ({
          id: f.subSettingId || f.id,
          name: f.subDescription || f.name
        }))
      )
    } catch {
      enqueueSnackbar('Failed to load Frequencies', { variant: 'error' })
    } finally {
      setLoadingFreq(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    reset({
      revenueHead: '',
      subRevenueName: '',
      revenueLevy: 0,
      revenueFrequency: '',
      unit: 0
    })
    setOpen(true)
  }

  const openEdit = (a: Sub) => {
    setEditing(a)
    reset(a)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async (data: Sub) => {
    try {
      if (editing?.subRevenueHeadId) {
        await api.put(`/subrevenueheads/${editing.subRevenueHeadId}`, data)
        enqueueSnackbar('Sub Revenue Head updated', { variant: 'success' })
      } else {
        await api.post('/revenuesubheads', data)
        enqueueSnackbar('Sub Revenue Head created', { variant: 'success' })
      }
      close()
      fetchAll()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Save failed', { variant: 'error' })
    }
  }

  const confirmDeleteSubHead = (id?: string) =>
    setConfirmDelete({ open: true, id })

  const remove = async () => {
    if (!confirmDelete.id) return
    try {
      await api.delete(`/subrevenueheads/${confirmDelete.id}`)
      enqueueSnackbar('Deleted successfully', { variant: 'success' })
      fetchAll()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Delete failed', { variant: 'error' })
    } finally {
      setConfirmDelete({ open: false })
    }
  }

  const handleSort = (property: keyof Sub) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[orderBy]
      const bv = b[orderBy]

      if (typeof av === 'number' && typeof bv === 'number') {
        return order === 'asc' ? av - bv : bv - av
      }

      const aStr = (av || '').toString().toLowerCase()
      const bStr = (bv || '').toString().toLowerCase()

      return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filtered, order, orderBy])

  const displayData = sortedData.slice((page - 1) * 10, page * 10)

  return (
    <Layout>
      <Navigator />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Sub Revenue Heads</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search sub heads..." />
          {canEdit && (
            <Tooltip title="Add new Sub Revenue Head">
              <IconButton color="primary" onClick={openCreate}>
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1 }}>Loading Sub Revenue Heads...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography>No Sub Revenue Heads found</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'subRevenueName', label: 'Sub Revenue Head' },
                    { id: 'revenueHead', label: 'Revenue Head' },
                    { id: 'revenueLevy', label: 'Levy' },
                    { id: 'revenueFrequency', label: 'Frequency' },
                    { id: 'unit', label: 'Unit' }
                  ].map((col) => (
                    <TableCell key={col.id}>
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id as keyof Sub)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {displayData.map((h) => (
                  <TableRow key={h.subRevenueHeadId}>
                    <TableCell>{h.subRevenueName}</TableCell>
                    <TableCell>
                      {revenueHeads.find((r) => r.id === h.revenueHead)?.name || h.revenueHead}
                    </TableCell>
                    <TableCell>{h.revenueLevy}</TableCell>
                    <TableCell>
                      {frequencies.find((f) => f.id === h.revenueFrequency)?.name ||
                        h.revenueFrequency}
                    </TableCell>
                    <TableCell>{h.unit}</TableCell>

                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(h)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDeleteSubHead(h.subRevenueHeadId)}
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

          <Pagination page={page} count={Math.ceil(filtered.length / 10)} onChange={setPage} />
        </>
      )}

      {/* CRUD Modal */}
      <CrudModal
        open={open}
        title={editing?.subRevenueHeadId ? 'Edit Sub Revenue Head' : 'New Sub Revenue Head'}
        onClose={close}
        onSave={handleSubmit(save)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

          {/* Revenue Head */}
          <Controller
            name="revenueHead"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl size="small" fullWidth error={!!fieldState.error}>
                <InputLabel>Revenue Head</InputLabel>
                <Select {...field} label="Revenue Head" value={field.value || ''} disabled={loadingHeads}>
                  {loadingHeads ? (
                    <MenuItem disabled><em>Loading...</em></MenuItem>
                  ) : (
                    revenueHeads.map((h) => (
                      <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                    ))
                  )}
                </Select>
                {fieldState.error && (
                  <Typography variant="caption" color="error">{fieldState.error.message}</Typography>
                )}
              </FormControl>
            )}
          />

          {/* Sub Revenue Name */}
          <Controller
            name="subRevenueName"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                size="small"
                label="Sub Revenue Name"
                {...field}
                value={field.value || ''}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />

          {/* Levy */}
          <Controller
            name="revenueLevy"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                size="small"
                label="Revenue Levy"
                type="number"
                {...field}
                value={field.value ?? ''}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />

          {/* Frequency */}
          <Controller
            name="revenueFrequency"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete
                options={frequencies}
                loading={loadingFreq}
                getOptionLabel={(opt) => opt.name}
                value={frequencies.find((f) => f.id === field.value) || null}
                onChange={(_, val) => field.onChange(val?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Frequency"
                    size="small"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingFreq && <CircularProgress color="inherit" size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />

          {/* Unit */}
          <Controller
            name="unit"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                size="small"
                label="Unit"
                type="number"
                {...field}
                value={field.value ?? ''}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />

        </Box>
      </CrudModal>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: confirmDelete.id })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this Sub Revenue Head?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: confirmDelete.id })}>Cancel</Button>
          <Button color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
