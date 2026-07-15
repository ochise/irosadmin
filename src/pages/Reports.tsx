import React from 'react'
import Layout from '../components/Layout'
import { Typography, Button, Stack } from '@mui/material'
import api from '../utils/api'
import { useSnackbar } from 'notistack'

export default function Reports(){
  const { enqueueSnackbar } = useSnackbar()
  const download = async (type:string, entity:string) => {
    try{
      const res = await api.get(`/reports/${type}/${entity}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${entity}.${type === 'excel' ? 'xlsx' : type === 'pdf' ? 'pdf' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      enqueueSnackbar('Report downloaded', { variant: 'success' })
    }catch(err:any){ enqueueSnackbar(err?.message || 'Failed to download report', { variant: 'error' }) }
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Reports</Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={()=>download('csv','agents')}>Download Agents CSV</Button>
        <Button variant="contained" onClick={()=>download('pdf','agents')}>Download Agents PDF</Button>
      </Stack>
    </Layout>
  )
}
