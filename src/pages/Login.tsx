import React, { useState } from 'react'
import { Container, TextField, Button, Box, Typography, Alert } from '@mui/material'
import { useAuth } from '../auth/AuthProvider'
import { useSnackbar } from 'notistack'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const submit = async () => {
    if (!username || !password) {
      setError('Please enter username and password')
      return
    }

    setError(null)
    setLoading(true)
    
    try {
      const token = await login(username, password)
      
      if (token) {
        enqueueSnackbar('Login successful', { variant: 'success' })
        window.location.href = '/'
      } else {
        setError('Invalid credentials')
        enqueueSnackbar('Login failed', { variant: 'error' })
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err?.response?.data?.message || err?.response?.data || err?.message || 'Login failed'
      setError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: `url(../assets/images/login-bg.png)`, backgroundSize: 'cover', padding: '2rem', borderRadius: '8px'}} >
    <Container maxWidth="xs" style ={{ backgroundColor:'#fff', borderRadius:'8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'}} >
      <Box sx={{ mt: 2, mb:2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" style={{marginBottom: '50px', textAlign:'center'}}>Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField 
          label="Username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          fullWidth 
          disabled={loading}
        />
        <TextField 
          label="Password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          fullWidth 
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              submit()
            }
          }}
        />
        <Button 
          variant="contained" 
          onClick={submit}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Box>
    </Container>
    </div>
  )
}
