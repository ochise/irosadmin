import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface Step {
  num: string;
  label: string;
}

const HowItWorks: React.FC = () => {
  const steps: Step[] = [
    { num: "01", label: "Register" },
    { num: "02", label: "Setup Collections" },
    { num: "03", label: "Receive Revenue" },
  ];

  return (
    <Box id="how" sx={{ py: 12, px: 4, textAlign: "center" }}>
      <Typography variant="h4" fontWeight={700}>
        How It Works
      </Typography>

      <Box
        sx={{
          mt: 10,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 6,
        }}
      >
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
          >
            <Typography variant="h3" color="primary">
              {step.num}
            </Typography>
            <Typography mt={2} variant="h6">
              {step.label}
            </Typography>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default HowItWorks;
