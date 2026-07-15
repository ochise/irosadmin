import React, { useState } from 'react'
import { Container, TextField, Button, Box, Typography, Alert } from '@mui/material'
import { useAuth } from '../auth/AuthProvider'
import { useSnackbar } from 'notistack'

export default function Login(){
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()
  const [error, setError] = useState<string | null>(null)
  const { login, user } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const submit = async () => {
    setError(null)
    try{
      await login(username, password)
      if(user?.role == "Admin") window.location.href = '/'
      else  setError("You're not authorized to access this ")
    }catch(err:any){
      setError(err?.response?.data || 'Login failed')
      enqueueSnackbar('Login failed', { variant: 'error' })
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: `url(../assets/images/login-bg.png)`, backgroundSize: 'cover', padding: '2rem', borderRadius: '8px'}} >
    <Container maxWidth="xs" style ={{ backgroundColor:'#fff', borderRadius:'8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'}} >
      <Box sx={{ mt: 2, mb:2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" style={{marginBottom: '50px', textAlign:'center'}}>Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Username" value={username} onChange={e=>setUsername(e.target.value)} fullWidth />
        <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth />
        <Button variant="contained" onClick={submit}>Login</Button>
      </Box>
    </Container>
    </div>
  )
}
