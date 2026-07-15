import React from 'react'
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useThemeMode } from '../theme/ThemeProvider'
import { useAuth } from '../auth/AuthProvider'
import { useSnackbar } from 'notistack'
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Tooltip from '@mui/material/Tooltip';
import ConfigDropdown from './ConfigurationDropdown'

export default function Topbar() {
  const { mode, toggle } = useThemeMode()
  const { logout, user } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const doLogout = () => {
    logout()
    enqueueSnackbar('Logged out', { variant: 'info' })
    window.location.href = '/login'
  }

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: mode === 'light' ? '#e9ecef' : undefined }}>
      <Toolbar>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Dashboard</Typography>
        <ConfigDropdown
          initialDark={mode === 'dark'}
          onDarkChange={(d) => { if ((d && mode === 'light') || (!d && mode === 'dark')) toggle() }}
        />
        <Typography sx={{ ml: 2, mr: 2 }}>{user?.role ?? 'Guest'}</Typography>
        <IconButton onClick={doLogout}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
