import React from 'react'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children } : { children: React.ReactNode }){
  return (
    <Box sx={{ display:'flex'}} className="app-container">
      <Sidebar />
      <Box component="main" sx={{ flexGrow:1 }}>
        <Topbar />
        <Box sx={{ p:3 }}>{children}</Box>
      </Box>
    </Box>
  )
}
