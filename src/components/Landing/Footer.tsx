import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <Box sx={{ py: 6, bgcolor: "#111", color: "white", textAlign: "center" }}>
      <Typography variant="h6">RevenueX</Typography>
      <Typography mt={1} color="gray">
        Smart revenue automation
      </Typography>
      <Typography mt={2} fontSize={14} color="gray">
        © 2025 RevenueX. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
