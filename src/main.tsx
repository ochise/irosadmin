import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { SnackbarProvider } from 'notistack'
import { ThemeModeProvider } from './theme/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeModeProvider>
          <SnackbarProvider maxSnack={3}>
            <App />
          </SnackbarProvider>
        </ThemeModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
