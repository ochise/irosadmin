import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar: React.FC = () => {
  return (
    <AppBar position="fixed" color="inherit" elevation={1}>
      <Toolbar sx={{ justifyContent: "space-between", px: 4 }}>
        <Typography
          variant="h5"
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          RevenueX
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#pricing">Pricing</a>
        </Box>

        <Button component={Link} to="/login" variant="contained">
          Login
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
