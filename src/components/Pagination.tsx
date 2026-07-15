import React from 'react'
import { Pagination as MuiPagination, Stack } from '@mui/material'

export default function Pagination({ page, count, onChange } : { page:number, count:number, onChange:(p:number)=>void }){
  return (
    <Stack alignItems="center" sx={{ mt:2 }}>
      <MuiPagination page={page} count={count} onChange={(_,p)=>onChange(p)} />
    </Stack>
  )
}
