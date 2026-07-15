import { Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";

const Hero: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: 20,
        pb: 10,
        display: "flex",
        alignItems: "center",
        flexDirection: { xs: "column", md: "row" },
        gap: 6,
        px: 4,
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ flex: 1 }}
      >
        <Typography variant="h3" fontWeight={800}>
          Smart, Fast & Secure{" "}
          <span style={{ color: "#1976d2" }}>Revenue Collection</span>
        </Typography>

        <Typography mt={3} color="text.secondary">
          Automate payments & track collections with ease.
        </Typography>

        <Box mt={4} display="flex" gap={2}>
          <Button variant="contained" size="large">
            Get Started
          </Button>
          <Button variant="outlined" size="large">
            Learn More
          </Button>
        </Box>
      </motion.div>

      <motion.img
        src="https://images.unsplash.com/photo-1642790106054-907f0ccf8461?auto=format&fit=crop&w=800"
        alt="App Mockup"
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 20,
          boxShadow: "0px 8px 30px rgba(0,0,0,0.2)",
        }}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      />
    </Box>
  );
};

export default Hero;
