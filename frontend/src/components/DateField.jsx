import { TextField } from '@mui/material';

/** Date input with label always floated — avoids overlap with browser date placeholder. */
export default function DateField({ slotProps, InputLabelProps, type: _type, ...props }) {
  return (
    <TextField
      type="date"
      {...props}
      slotProps={{
        ...slotProps,
        inputLabel: {
          shrink: true,
          ...InputLabelProps,
          ...slotProps?.inputLabel,
        },
      }}
    />
  );
}
