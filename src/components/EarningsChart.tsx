import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, Typography } from '@mui/material'

const data = [
  { day: 'Mon', value: 100 },
  { day: 'Tue', value: 150 },
  { day: 'Wed', value: 180 },
  { day: 'Thu', value: 220 },
  { day: 'Fri', value: 300 },
  { day: 'Sat', value: 350 },
  { day: 'Sun', value: 400 }
]

export default function EarningsChart(){
  return (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="subtitle1">Earnings</Typography>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0b5cff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
