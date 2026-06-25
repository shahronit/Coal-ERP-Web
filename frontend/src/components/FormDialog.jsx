import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { space } from '../theme/tokens';

export default function FormDialog({
  open,
  onClose,
  title,
  onValidSubmit,
  children,
  saveLabel,
  cancelLabel,
  maxWidth = 'sm',
  fullWidth = true,
  saveDisabled = false,
  loading = false,
}) {
  const { t } = useTranslation('common');

  const handleSubmit = (e) => {
    e.preventDefault();
    onValidSubmit(e);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <form onSubmit={handleSubmit} noValidate>
        {title ? (
          <DialogTitle sx={{ pb: space.sm }}>
            {title}
          </DialogTitle>
        ) : null}
        {title && <Divider />}
        <DialogContent>
          <Stack spacing={space.md} sx={{ pt: title ? space.sm : 0 }}>
            {children}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {cancelLabel || t('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={saveDisabled || loading}>
            {saveLabel || t('actions.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
