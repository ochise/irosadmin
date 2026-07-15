import React from "react";
import { AppBar, Toolbar, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { NavLink } from 'react-router-dom'
export const Navigator = () => {
  return (
   <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
        {/* <Toolbar> */}
          <Stack direction="row" spacing={2}>
            {[
              { path: '/merchants', label: 'Merchant' },
               { path: '/taskforce', label: 'Taskforce' },
              { path: '/revenue-heads', label: 'Revenue Head' },
              { path: '/sub-revenue-heads', label: 'Sub Revenue Head' },
              { path: '/agents', label: 'Agent' },
              { path: '/entities', label: 'Entity' }
            ].map((nav) => (
              <Button
                key={nav.path}
                component={NavLink}
                to={nav.path}
                color="inherit"
                sx={{
                  '&.active': { fontWeight: 'bold', borderBottom: 2, borderColor: 'primary.main' },
                }}
              >
                {nav.label}
              </Button>
            ))}
          </Stack>
        {/* </Toolbar> */}
      </AppBar>

  );
}