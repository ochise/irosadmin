import React from 'react'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function NewLayout({ children } : { children: React.ReactNode }){
  return (
    <Box sx={{ display:'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow:1 }}>
        <Topbar />
        <Box sx={{ p:3 }}>{children}</Box>
      </Box>
    </Box>
  )
}
