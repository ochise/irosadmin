import { createTheme } from '@mui/material/styles'

const getTheme = (mode: 'light'|'dark') => createTheme({
  palette: { mode, primary: { main: '#0b5cff' }, background: { default: mode === 'light' ? '#f4f6f8' : '#121212' } },
  components: { MuiDrawer: { styleOverrides: { paper: { width: 240 } } } }
})

export default getTheme
