import { Box, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface Feature {
  emoji: string;
  title: string;
  text: string;
}

const Features: React.FC = () => {
  const items: Feature[] = [
    { emoji: "💳", title: "Seamless Payments", text: "Cards, Transfer, USSD, QR." },
    { emoji: "📊", title: "Real-Time Dashboard", text: "Track revenue instantly." },
    { emoji: "🔐", title: "High Security", text: "Bank-grade encryption." },
  ];

  return (
    <Box id="features" sx={{ py: 12, px: 4, textAlign: "center" }}>
      <Typography variant="h4" fontWeight={700}>
        Powerful Features
      </Typography>

      <Box
        sx={{
          mt: 8,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 4,
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <Card elevation={3}>
              <CardContent>
                <Typography fontSize={40}>{item.emoji}</Typography>
                <Typography variant="h6" fontWeight={600}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" mt={1}>
                  {item.text}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default Features;
