import { useMemo, useState } from 'react';
import {
  Autocomplete, TextField, Box, Typography, createFilterOptions,
} from '@mui/material';
import QuickCreateDialog from './QuickCreateDialog';

const filter = createFilterOptions();

const ADD_NEW = '__add_new__';

export default function MasterSelect({
  masterType,
  label,
  value,
  onChange,
  required = false,
  size = 'medium',
  fullWidth = true,
  disabled = false,
  allowNone = false,
  noneLabel = 'None',
  useListQuery,
  getOptionLabel = (opt) => opt?.name || opt?.code || '',
  getOptionValue = (opt) => opt?.id,
  error = false,
  helperText,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useListQuery({ limit: 200 });
  const options = data?.data || [];

  const selected = useMemo(
    () => options.find((o) => getOptionValue(o) === value) || null,
    [options, value, getOptionValue]
  );

  const displayLabel = (opt) => {
    if (!opt) return '';
    if (opt.id === ADD_NEW) return opt.name;
    if (masterType === 'purchase-batches' || masterType === 'sales-batches') {
      return `${opt.code} — ${opt.name}`;
    }
    return getOptionLabel(opt);
  };

  return (
    <>
      <Autocomplete
        key={masterType}
        fullWidth={fullWidth}
        size={size}
        disabled={disabled}
        loading={isLoading}
        options={options}
        value={selected}
        getOptionLabel={displayLabel}
        isOptionEqualToValue={(opt, val) => getOptionValue(opt) === getOptionValue(val)}
        onChange={(_, newVal) => {
          if (newVal?.id === ADD_NEW) {
            setDialogOpen(true);
            return;
          }
          onChange(newVal ? getOptionValue(newVal) : '');
        }}
        filterOptions={(opts, params) => {
          const filtered = filter(opts, params);
          filtered.push({ id: ADD_NEW, name: `+ Add new ${label}` });
          return filtered;
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            {option.id === ADD_NEW ? (
              <Typography color="primary" fontWeight={700}>{option.name}</Typography>
            ) : displayLabel(option)}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={
              helperText
              || (isError
                ? 'Failed to load options'
                : !isLoading && options.length === 0
                  ? `No ${label.toLowerCase()} yet — add one using "+ Add new"`
                  : undefined)
            }
          />
        )}
        {...(allowNone ? { clearOnEscape: true } : {})}
      />
      <QuickCreateDialog
        open={dialogOpen}
        masterType={masterType}
        title={`Add ${label}`}
        onClose={() => setDialogOpen(false)}
        onCreated={(created) => {
          refetch();
          onChange(getOptionValue(created));
          setDialogOpen(false);
        }}
      />
    </>
  );
}
