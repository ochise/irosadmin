import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SignIn: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "grey.100",
        p: 3,
      }}
    >
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
        <Paper sx={{ p: 5, width: 380, borderRadius: 4 }} elevation={4}>
          <Typography variant="h4" textAlign="center" color="primary" fontWeight={700}>
            Login
          </Typography>

          <Box mt={4} display="flex" flexDirection="column" gap={3}>
            <TextField label="Email" type="email" fullWidth />
            <TextField label="Password" type="password" fullWidth />

            <Button variant="contained" fullWidth size="large">
              Login
            </Button>

            <Typography textAlign="center" mt={2}>
              <Link to="/" style={{ color: "#1976d2" }}>
                ← Back to Home
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default SignIn;
