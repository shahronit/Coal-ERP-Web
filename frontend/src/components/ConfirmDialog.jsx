import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider,
} from '@mui/material';
import { space } from '../theme/tokens';

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: space.sm }}>{title}</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText sx={{ pt: space.sm }}>{message}</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}
