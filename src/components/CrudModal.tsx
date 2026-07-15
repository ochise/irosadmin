import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

export default function CrudModal({ open, title, children, onClose, onSave } : { open:boolean, title:string, children:React.ReactNode, onClose:()=>void, onSave:()=>void }){
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
