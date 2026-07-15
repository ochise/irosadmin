import React, { useEffect, useMemo, useState, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Tooltip, TableSortLabel, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, ClickAwayListener
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
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import Papa from 'papaparse'
import debounce from 'lodash.debounce'
import { Navigator } from '../../components/Navigator'

type Head = {
  revenueHeadId?: number
  revenueHeadName?: string
  merchant?: string // merchantId
}

type OwnerModel = { merchantId: string; name: string }
type Order = 'asc' | 'desc'

const schema = yup.object({
  revenueHeadName: yup.string().required('Revenue Head Name is required'),
  merchant: yup.string().required('Merchant is required'),
}).required()

/** Collapsible Search Box Component */
function SearchBox({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'search',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  ariaLabel?: string
}) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
        onMouseDown={(e) => e.button === 0 && e.preventDefault()}
        onClick={expand}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          transition: 'width 0.25s ease',
          width: focused || value ? 240 : 40,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          height: 36,
        }}
        role="search"
        aria-label={ariaLabel}
      >
        <SearchIcon
          sx={{
            position: 'absolute',
            left: 8,
            color: 'text.secondary',
            pointerEvents: 'none',
          }}
        />
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
            '& .MuiInputBase-input': {
              py: 0.5,
              width: '100%',
            },
            opacity: focused || value ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      </Box>
    </ClickAwayListener>
  )
}

export default function RevenueHeadsPage() {
  const [list, setList] = useState<Head[]>([])
  const [filtered, setFiltered] = useState<Head[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [editing, setEditing] = useState<Head | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<keyof Head>('revenueHeadName')
  const [owners, setOwners] = useState<OwnerModel[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)

  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin'])
  const isAdmin = useHasRole(['Admin'])

  const { control, handleSubmit, reset } = useForm<Head>({
    resolver: yupResolver(schema),
  })

  // Debounced search
  const runSearch = useMemo(
    () =>
      debounce((term: string, src: Head[]) => {
        if (!term) return setFiltered(src)
        const lower = term.toLowerCase()
        setFiltered(
          src.filter(
            (h) =>
              h.revenueHeadName?.toLowerCase().includes(lower) ||
              h.merchant?.toLowerCase().includes(lower)
          )
        )
      }, 250),
    []
  )

  useEffect(() => {
    runSearch(search, list)
  }, [search, list, runSearch])

  useEffect(() => {
    fetchAll()
    fetchOwners()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/revenueheads')
      const data = res.data || []
      setList(data)
      setFiltered(data)
      setPageCount(Math.max(1, Math.ceil(data.length / 10)))
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to load Revenue Heads', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    setLoadingOwners(true)
    try {
      const res = await api.get('/Merchants')
      setOwners(res.data || [])
    } catch {
      enqueueSnackbar('Failed to load merchants', { variant: 'error' })
    } finally {
      setLoadingOwners(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    reset({ revenueHeadName: '', merchant: '' })
    setOpen(true)
  }

  const openEdit = (head: Head) => {
    setEditing(head)
    reset({
      ...head,
      merchant:
        typeof head.merchant === 'object'
          ? (head.merchant as any).merchantId
          : head.merchant || '',
    })
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async (data: Head) => {
    try {
      if (editing?.revenueHeadId) {
        await api.put(`/revenueheads/${editing.revenueHeadId}`, data)
        enqueueSnackbar('Revenue Head updated successfully', { variant: 'success' })
      } else {
        await api.post('/revenueheads', data)
        enqueueSnackbar('Revenue Head created successfully', { variant: 'success' })
      }
      close()
      fetchAll()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Save failed', { variant: 'error' })
    }
  }

  const confirmDeleteHead = (id?: number) => {
    if (!id) return
    setConfirmDelete({ open: true, id })
  }

  const remove = async () => {
    if (!confirmDelete.id) return
    try {
      await api.delete(`/revenueheads/${confirmDelete.id}`)
      enqueueSnackbar('Revenue Head deleted successfully', { variant: 'success' })
      fetchAll()
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data || err?.message || 'Delete failed', { variant: 'error' })
    } finally {
      setConfirmDelete({ open: false })
    }
  }

  const exportCSV = () => {
    if (!filtered.length) return enqueueSnackbar('No data to export', { variant: 'info' })
    const formatted = filtered.map(h => ({
      'Revenue Head': h.revenueHeadName,
      'Merchant': owners.find(o => o.merchantId === h.merchant)?.name || h.merchant,
    }))
    const csv = Papa.unparse(formatted)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'revenue_heads_export.csv'
    link.click()
    enqueueSnackbar('Exported successfully', { variant: 'success' })
  }

  const handleSort = (property: keyof Head) => {
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

  const displayData = sortedData.slice((page - 1) * 10, page * 10)

  return (
    <Layout>
      <Navigator />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Revenue Heads</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search heads..." ariaLabel="Search Revenue Heads" />
          {isAdmin && (
            <Tooltip title="Export CSV">
              <IconButton color="secondary" onClick={exportCSV}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Add new Revenue Head">
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
          <Typography variant="body2" sx={{ mt: 1 }}>Loading Revenue Heads...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1">No Revenue Heads found</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[{ id: 'revenueHeadName', label: 'Revenue Head' }, { id: 'revenueOwner', label: 'Merchant' }].map(col => (
                    <TableCell key={col.id}>
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id as keyof Head)}
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
                  <TableRow key={h.revenueHeadId ?? Math.random()}>
                    <TableCell>{h.revenueHeadName}</TableCell>
                    <TableCell>{owners.find(o => o.merchantId === h.merchant)?.name || h.merchant}</TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(h)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => confirmDeleteHead(h.revenueHeadId)}>
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
          <Pagination page={page} count={pageCount} onChange={setPage} />
        </>
      )}

      {/* CRUD Modal */}
      <CrudModal
        open={open}
        title={editing?.revenueHeadId ? 'Edit Revenue Head' : 'New Revenue Head'}
        onClose={close}
        onSave={handleSubmit(save)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Controller
            name="merchant"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth size="small" error={!!fieldState.error}>
                <InputLabel>Merchant</InputLabel>
                <Select
                  {...field}
                  label="Merchant"
                  disabled={loadingOwners}
                  value={field.value || ''}
                >
                  {loadingOwners ? (
                    <MenuItem disabled><em>Loading...</em></MenuItem>
                  ) : owners.length > 0 ? (
                    owners.map((o) => (
                      <MenuItem key={o.merchantId} value={o.merchantId}>
                        {o.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled><em>No merchants available</em></MenuItem>
                  )}
                </Select>
                {fieldState.error && (
                  <Typography variant="caption" color="error">
                    {fieldState.error.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="revenueHeadName"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                size="small"
                label="Revenue Head Name"
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        </Box>
      </CrudModal>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this Revenue Head?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false })}>Cancel</Button>
          <Button color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
