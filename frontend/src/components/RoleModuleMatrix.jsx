import { useState } from 'react';
import {
  Box, Checkbox, FormControlLabel, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import { CONFIGURABLE_ROLES, DEFAULT_ROLE_MODULES, MODULES, ROLE_LABELS } from '../utils/roles';

export default function RoleModuleMatrix({ value = {}, onChange, disabled = false }) {
  const [tab, setTab] = useState(0);
  const role = CONFIGURABLE_ROLES[tab];
  const selected = value[role] ?? DEFAULT_ROLE_MODULES[role] ?? [];

  const toggle = (moduleKey) => {
    if (disabled) return;
    const next = selected.includes(moduleKey)
      ? selected.filter((m) => m !== moduleKey)
      : [...selected, moduleKey];
    onChange({ ...value, [role]: next });
  };

  const selectAll = () => { if (!disabled) onChange({ ...value, [role]: MODULES.map((m) => m.key) }); };
  const clearAll = () => { if (!disabled) onChange({ ...value, [role]: ['dashboard'] }); };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {CONFIGURABLE_ROLES.map((r) => (
          <Tab key={r} label={ROLE_LABELS[r]} />
        ))}
      </Tabs>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose which modules <strong>{ROLE_LABELS[role]}</strong> users can see and access.
        Super Admin and Admin always have full access.
      </Typography>
      <Stack direction="row" spacing={1} mb={2}>
        {!disabled && (
          <>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={selectAll}>Select all</Typography>
            <Typography variant="body2" color="text.secondary">·</Typography>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={clearAll}>Dashboard only</Typography>
          </>
        )}
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 0.5,
        }}
      >
        {MODULES.map((module) => (
          <FormControlLabel
            key={module.key}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(module.key)}
                onChange={() => toggle(module.key)}
                disabled={disabled}
              />
            }
            label={module.label}
          />
        ))}
      </Box>
    </Box>
  );
}
