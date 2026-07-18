import React from 'react'
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Avatar, Typography } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { useNavigate } from 'react-router-dom'
import StorefrontIcon from '@mui/icons-material/Storefront';
import WalletIcon from '@mui/icons-material/Wallet';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { useAuth } from '../auth/AuthProvider'

export default function Sidebar() {
   const { user } = useAuth()
   
  const navigate = useNavigate()
  return (
    <Drawer variant="permanent" open sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box', background: '#0e5a77', color: '#fff' } }}>
      <Box sx={{ display: 'flex', mt: 2, mb: 3, alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
        <img src="../assets/images/logo.png" alt="logo" width={80} height={50} />
      </Box>

      <List>
        <ListItemButton onClick={() => navigate('/')}><ListItemIcon><DashboardIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Dashboard" /></ListItemButton>
        <ListItemButton onClick={() => navigate('/merchants')}><ListItemIcon><StorefrontIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Merchant" /></ListItemButton>
         {/* <ListItemButton onClick={() => navigate('/Wallets')}><ListItemIcon><WalletIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Wallet" /></ListItemButton> */}
        <ListItemButton onClick={() => navigate('/invoices')}><ListItemIcon><FileCopyIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Invoice" /></ListItemButton>
        <ListItemButton onClick={() => navigate('/receipts')}><ListItemIcon><ReceiptIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Payments" /></ListItemButton>
        <ListItemButton onClick={() => navigate('/operations')}><ListItemIcon><SettingsApplicationsIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Operations" /></ListItemButton>
        <ListItemButton onClick={() => navigate('/reports')}><ListItemIcon><AccountTreeIcon sx={{ color: '#fff' }} /></ListItemIcon><ListItemText primary="Reports" /></ListItemButton>
        
      </List>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, position: 'absolute', bottom: 0 }}>
        {/* <Avatar sx={{ bgcolor:'transparent' }} /> */}
       
        <Avatar sx={{ bgcolor: 'transparent' }} />
        <Typography variant="h6">{user?.username}</Typography>
      </Box>
    </Drawer>
  )
}
