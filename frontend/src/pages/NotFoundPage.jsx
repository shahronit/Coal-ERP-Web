import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box textAlign="center" py={10}>
      <Typography variant="h3">404</Typography>
      <Typography variant="h6" mt={1}>Page not found</Typography>
      <Typography color="text.secondary" mb={3}>The page you opened does not exist in TradeCRM Pro.</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
    </Box>
  );
}
