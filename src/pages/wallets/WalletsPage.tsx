import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton } from '@mui/material'
import Pagination from '../../components/Pagination'
import CrudModal from '../../components/CrudModal'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSnackbar } from 'notistack'
import { useHasRole } from '../../auth/useRole'
import AddCircleIcon from '@mui/icons-material/AddCircle';

type Entity = { revenueEntityId?:number, accountName?:string, email?:string, phone?:string, identificationNumber?:string }

const schema = yup.object({ accountName: yup.string().required(), email: yup.string().email().required() }).required()

export default function WalletsPage(){
  const [list, setList] = useState<Entity[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Entity | null>(null)
  const { enqueueSnackbar } = useSnackbar()
  const canEdit = useHasRole(['Admin','Entity'])

  const { control, handleSubmit, reset } = useForm<Entity>({ resolver: yupResolver(schema) })

  useEffect(()=>{ fetchPage(page) },[page])

  const fetchPage = async (p:number)=>{
    try{
      const res = await api.get('/entities')
      setList(res.data)
      setPageCount(Math.max(1, Math.ceil(res.data.length / 10)))
    }catch(err:any){ enqueueSnackbar(err?.message || 'Failed to load entities', { variant: 'error' }) }
  }

  const openCreate = ()=>{ setEditing({}); reset({}); setOpen(true) }
  const openEdit = (a:Entity)=>{ setEditing(a); reset(a); setOpen(true) }
  const close = ()=>{ setOpen(false); setEditing(null) }

  const save = async (data:Entity) => {
    try{
      if(editing?.revenueEntityId){
        const prev = [...list]; setList(list.map(l => l.revenueEntityId === editing.revenueEntityId ? { ...l, ...data } : l))
        await api.put(`/entities/${editing.revenueEntityId}`, { ...data })
        enqueueSnackbar('Entity updated', { variant: 'success' })
      } else {
        const temp = { ...data, revenueEntityId: Math.floor(Math.random()*1000000) }
        setList([temp, ...list])
        const res = await api.post('/entities', data)
        setList(prev => prev.map(p => p.revenueEntityId === temp.revenueEntityId ? res.data : p))
        enqueueSnackbar('Entity created', { variant: 'success' })
      }
      close(); fetchPage(page)
    }catch(err:any){
      enqueueSnackbar(err?.response?.data || err?.message || 'Save failed', { variant: 'error' })
      fetchPage(page)
    }
  }

  const remove = async (id?:number)=>{
    if(!id) return;
    const prev = [...list]
    setList(list.filter(l=>l.revenueEntityId !== id))
    try{
      await api.delete(`/entities/${id}`)
      enqueueSnackbar('Entity deleted', { variant: 'success' })
      fetchPage(page)
    }catch(err:any){
      enqueueSnackbar(err?.response?.data || err?.message || 'Delete failed', { variant: 'error' })
      setList(prev)
    }
  }

  return (
    <Layout>
      <Box sx={{ display:'flex', justifyContent:'space-between'}}>
        <h2>Wallets</h2>
        {canEdit &&  <IconButton  onClick={openCreate}><AddCircleIcon /></IconButton>}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Account Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {list.slice((page-1)*10, page*10).map(e=> (
              <TableRow key={e.revenueEntityId ?? Math.random()}>
                <TableCell>{e.revenueEntityId}</TableCell>
                <TableCell>{e.accountName}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.phone}</TableCell>
                <TableCell>
                  {canEdit && <Button size="small" onClick={()=>openEdit(e)}>Edit</Button>}
                  {canEdit && <Button size="small" color="error" onClick={()=>remove(e.revenueEntityId)}>Delete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination page={page} count={pageCount} onChange={setPage} />
      <CrudModal open={open} title={editing?.revenueEntityId ? 'Edit Entity' : 'New Entity'} onClose={close} onSave={handleSubmit(save)}>
        <Box sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
          <Controller name="accountName" control={control} defaultValue="" render={({ field })=> <TextField label="Account Name" {...field} fullWidth />} />
          <Controller name="email" control={control} defaultValue="" render={({ field })=> <TextField label="Email" {...field} fullWidth />} />
          <Controller name="phone" control={control} defaultValue="" render={({ field })=> <TextField label="Phone" {...field} fullWidth />} />
          <Controller name="identificationNumber" control={control} defaultValue="" render={({ field })=> <TextField label="Identification Number" {...field} fullWidth />} />
        </Box>
      </CrudModal>
    </Layout>
  )
}
