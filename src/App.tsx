import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useThemeMode } from './theme/ThemeProvider'
import theme from './theme/theme'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agents from './pages/agents/AgentsPage'
import Entities from './pages/entities/EntitiesPage'
import RevenueHeads from './pages/revenue/RevenueHeadsPage'
import SubRevenueHeads from './pages/revenue/SubRevenueHeadsPage'
import Reports from './pages/Reports'
import PrivateRoute from './components/PrivateRoute'
import ReceiptsPage from './pages/receipts/ReceiptsPage'
import InvoicesPage from './pages/Invoices/InvoicesPage'
import WalletsPage from './pages/wallets/WalletsPage'
import MerchantsPage from './pages/merchants/MerchantsPage'
import TaskforcePage from './pages/taskforce/TaskforcePage'
import "./App.css";
import InvoicePage from './pages/Invoices/InvoicePage';
import { UsersDashboard } from './pages/non-admin/UsersDashboard';
import  ServiceProviderPage  from './pages/serviceProvider/ServiceProviderPage';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';

export default function App() {
  const { mode } = useThemeMode()
  return (
    <ThemeProvider theme={theme(mode)}>
      <CssBaseline />
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/agents" element={<PrivateRoute><Agents /></PrivateRoute>} />
        <Route path="/entities" element={<PrivateRoute><Entities /></PrivateRoute>} />
        <Route path="/revenue-heads" element={<PrivateRoute><RevenueHeads /></PrivateRoute>} />
        <Route path="/receipts" element={<PrivateRoute><ReceiptsPage /></PrivateRoute>} />
        <Route path="/invoices" element={<PrivateRoute><InvoicesPage /></PrivateRoute>} />
        <Route path="/wallets" element={<PrivateRoute><WalletsPage /></PrivateRoute>} />
        <Route path="/merchants" element={<PrivateRoute><MerchantsPage /></PrivateRoute>} />
        <Route path="/sub-revenue-heads" element={<PrivateRoute><SubRevenueHeads /></PrivateRoute>} />
        <Route path="/taskforce" element={<PrivateRoute><TaskforcePage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/invoice/invoice-page" element={<PrivateRoute><InvoicePage /></PrivateRoute>} />
        <Route path="/users-dashboard" element={<PrivateRoute><UsersDashboard /></PrivateRoute>} />
        <Route path="/admin/service-provider" element={<PrivateRoute><ServiceProviderPage /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to='/' replace />} />
      </Routes>
    </ThemeProvider>
  )
}
