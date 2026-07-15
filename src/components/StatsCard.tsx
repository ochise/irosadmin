import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

export default function StatsCard({ title, value }: { title: string, value: string }){
  return (
    <Card elevation={1} sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="h6">{value}</Typography>
      </CardContent>
    </Card>
  )
}
