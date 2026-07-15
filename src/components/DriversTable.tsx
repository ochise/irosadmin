import React from 'react'
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'

const rows = [
  { name: 'Ogidel Expert Ltd', phone: '09088393783', email: 'info@ogidel.com', status: 'Active' },
  { name: 'Amina Yusuf', phone: '09088393784', email: 'amina@ogidel.com', status: 'Active' },
  { name: 'Emeka Okafor', phone: '09088393785', email: 'emeka@ogidel.com', status: 'Active' },
]

export default function DriversTable(){
  return (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="subtitle1">Entities</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Account Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r,i)=> (
              <TableRow key={i}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
