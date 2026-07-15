import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";

interface Plan {
  title: string;
  price: string;
  highlight?: boolean;
}

const Pricing: React.FC = () => {
  const plans: Plan[] = [
    { title: "Starter", price: "Free" },
    { title: "Pro", price: "₦5,000/mo", highlight: true },
    { title: "Enterprise", price: "Custom" },
  ];

  return (
    <Box id="pricing" sx={{ py: 12, px: 4, textAlign: "center" }}>
      <Typography variant="h4" fontWeight={700}>
        Simple Pricing
      </Typography>

      <Box
        sx={{
          mt: 8,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 4,
        }}
      >
        {plans.map((p, i) => (
          <motion.div key={i} whileHover={{ scale: 1.05 }}>
            <Card
              sx={{
                borderRadius: 4,
                bgcolor: p.highlight ? "primary.main" : "white",
                color: p.highlight ? "white" : "black",
              }}
              elevation={4}
            >
              <CardContent>
                <Typography variant="h6">{p.title}</Typography>
                <Typography variant="h4" fontWeight={700} mt={2}>
                  {p.price}
                </Typography>
                <Button
                  variant={p.highlight ? "contained" : "outlined"}
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default Pricing;
