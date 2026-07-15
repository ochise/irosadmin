import React from 'react'
import Layout from '../components/Layout'
import { Typography, Grid, Box } from '@mui/material'
import StatsCard from '../components/StatsCard'
import EarningsChart from '../components/EarningsChart'
import DriversTable from '../components/DriversTable'
import { useAuth } from '../auth/AuthProvider'

export default function Dashboard(){

//    const { user } = useAuth()
// let jss = JSON.parse(user?.profiles || '{}');
//    console.log('Logged in user:',  jss);

  return (
    <Layout>
      <Typography variant="h6" gutterBottom>Today's Statistics</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><StatsCard title="Total Agents" value="50" /></Grid>
        <Grid item xs={12} md={3}><StatsCard title="Total Entities" value="1,000" /></Grid>
        <Grid item xs={12} md={3}><StatsCard title="Total Merchants" value="100" /></Grid>
        <Grid item xs={12} md={3}><StatsCard title="Total Earnings" value="₦1,250,000" /></Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><EarningsChart /></Grid>
          <Grid item xs={12} md={6}><DriversTable /></Grid>
        </Grid>
      </Box>
    </Layout>
  )
}
