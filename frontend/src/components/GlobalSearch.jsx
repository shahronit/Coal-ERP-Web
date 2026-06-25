import { useMemo, useState } from 'react';
import { Autocomplete, TextField, Box, Typography, alpha, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGlobalSearchQuery } from '../store/api/services';
import { selectCurrentUser } from '../store/slices/authSlice';
import { canAccessSearchResult } from '../utils/permissions';
import { headerSearchInputHeight } from './header/headerGlass';

export default function GlobalSearch({ fullWidth = false, variant = 'sidebar' }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [trigger, { data, isFetching }] = useLazyGlobalSearchQuery();
  const isLight = theme.palette.mode === 'light';
  const isHeader = variant === 'header';

  const options = useMemo(
    () => (data?.data || []).filter((opt) => canAccessSearchResult(user?.role, opt.type)),
    [data, user?.role]
  );

  const handleInput = (_, value, reason) => {
    setInput(value);
    if (reason === 'input') {
      if (value.trim().length >= 2) {
        trigger({ q: value.trim(), limit: 20 });
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
    if (reason === 'clear') {
      setOpen(false);
    }
  };

  const inputSx = isHeader ? {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      minHeight: headerSearchInputHeight,
      bgcolor: isLight ? alpha('#fff', 0.65) : alpha('#fff', 0.06),
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      border: '1px solid',
      borderColor: isLight ? alpha(theme.palette.primary.main, 0.14) : alpha('#fff', 0.12),
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      '& fieldset': { border: 'none' },
      '&:hover': {
        bgcolor: isLight ? alpha('#fff', 0.78) : alpha('#fff', 0.08),
        borderColor: isLight ? alpha(theme.palette.primary.main, 0.22) : alpha('#fff', 0.18),
      },
      '&.Mui-focused': {
        bgcolor: isLight ? alpha('#fff', 0.88) : alpha('#fff', 0.1),
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, isLight ? 0.14 : 0.26)}`,
      },
    },
    '& .MuiOutlinedInput-input': {
      py: 1.15,
      fontSize: '0.9375rem',
    },
    '& .MuiAutocomplete-endAdornment': { display: 'none' },
  } : {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: 'background.paper',
      transition: 'box-shadow 0.2s ease',
      '&.Mui-focused': {
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, isLight ? 0.16 : 0.24)}`,
      },
    },
  };

  return (
    <Autocomplete
      freeSolo
      disableClearable
      forcePopupIcon={false}
      openOnFocus={false}
      open={open && input.trim().length >= 2}
      onOpen={() => input.trim().length >= 2 && setOpen(true)}
      onClose={() => setOpen(false)}
      sx={{
        width: fullWidth ? '100%' : { xs: 180, sm: 280, md: 360 },
        mr: fullWidth ? 0 : 1,
      }}
      size={isHeader ? 'medium' : 'small'}
      loading={isFetching}
      options={options}
      inputValue={input}
      onInputChange={handleInput}
      getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || '')}
      isOptionEqualToValue={(opt, val) => opt?.id === val?.id && opt?.type === val?.type}
      filterOptions={(x) => x}
      noOptionsText={input.length < 2 ? 'Type 2+ characters…' : 'No results'}
      onChange={(_, option) => {
        if (option && typeof option === 'object' && option.route) {
          navigate(option.route);
          setInput('');
          setOpen(false);
        }
      }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.75,
            borderRadius: 2.5,
            bgcolor: isLight ? alpha('#fff', 0.96) : alpha('#1A2235', 0.98),
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid',
            borderColor: isLight ? alpha(theme.palette.primary.main, 0.1) : alpha('#fff', 0.1),
            boxShadow: isLight
              ? '0 12px 32px rgba(15, 23, 42, 0.12)'
              : '0 12px 32px rgba(0, 0, 0, 0.45)',
          },
        },
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={`${option.type}-${option.id}`}>
          <Box>
            <Typography variant="body2" fontWeight={700}>{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">{option.subtitle}</Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => {
        const { slotProps: paramsSlotProps = {}, ...textFieldParams } = params;
        const inputSlot = paramsSlotProps.input ?? {};

        return (
          <TextField
            {...textFieldParams}
            placeholder="Search transactions, parties, batches…"
            aria-label="Global search"
            slotProps={{
              ...paramsSlotProps,
              input: {
                ...inputSlot,
                startAdornment: (
                  <>
                    <SearchIcon
                      fontSize="small"
                      sx={{
                        ml: 0.5,
                        mr: 1,
                        color: isHeader ? theme.palette.primary.main : 'text.secondary',
                        opacity: isHeader ? 0.88 : 1,
                      }}
                    />
                    {inputSlot.startAdornment}
                  </>
                ),
              },
            }}
            sx={inputSx}
          />
        );
      }}
    />
  );
}
