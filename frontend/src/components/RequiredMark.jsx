import { Box } from '@mui/material';

/** Red asterisk for mandatory labels outside MUI TextField (e.g. ProfileField, file upload). */
export default function RequiredMark() {
  return (
    <Box component="span" sx={{ color: 'error.main' }} aria-hidden="true">
      {' *'}
    </Box>
  );
}
