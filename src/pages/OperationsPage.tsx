import React from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import CategoryIcon from '@mui/icons-material/Category'
import GroupsIcon from '@mui/icons-material/Groups'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

export default function OperationsPage() {
  const navigate = useNavigate()

  const operations = [
    {
      title: 'Manage Agents',
      description: 'View and manage revenue agents',
      icon: <PeopleIcon sx={{ fontSize: 48, color: '#0b5cff' }} />,
      path: '/agents',
    },
    {
      title: 'Manage Entities',
      description: 'View and manage revenue entities',
      icon: <BusinessIcon sx={{ fontSize: 48, color: '#0b5cff' }} />,
      path: '/entities',
    },
    {
      title: 'Revenue Heads',
      description: 'Manage revenue heads',
      icon: <CategoryIcon sx={{ fontSize: 48, color: '#0b5cff' }} />,
      path: '/revenue-heads',
    },
    {
      title: 'Sub Revenue Heads',
      description: 'Manage sub revenue heads',
      icon: <CategoryIcon sx={{ fontSize: 48, color: '#0b5cff' }} />,
      path: '/sub-revenue-heads',
    },
    {
      title: 'Task Force',
      description: 'Manage task force operations',
      icon: <GroupsIcon sx={{ fontSize: 48, color: '#0b5cff' }} />,
      path: '/taskforce',
    },
    {
      title: 'Delete Invoice',
      description: 'Search and delete invoices',
      icon: <DeleteForeverIcon sx={{ fontSize: 48, color: '#d32f2f' }} />,
      path: '/invoices/delete',
    },
  ]

  return (
    <Layout>
      <Box>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Operations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage all operational aspects of the system
        </Typography>

        <Grid container spacing={3}>
          {operations.map((operation, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card elevation={2}>
                <CardActionArea onClick={() => navigate(operation.path)}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    {operation.icon}
                    <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                      {operation.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {operation.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  )
}
