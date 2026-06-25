import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, TableSortLabel, TextField, Box, IconButton, Skeleton, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import EmptyStateHelp from './EmptyStateHelp';
import { glassPaperSx, layout, radius, space } from '../theme/tokens';
import { useTheme } from '@mui/material/styles';

export default function DataTable({
  columns, rows, loading, page, limit, total, onPageChange, onLimitChange,
  sort, order, onSort, search, onSearch, onEdit, onDelete, actions = true, helpTopic,
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleSort = (field) => {
    if (!onSort) return;
    const isAsc = sort === field && order === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={48} sx={{ mb: space.xs, borderRadius: radius.md / 8 }} />
        ))}
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        ...glassPaperSx(theme),
        width: '100%',
        overflow: 'hidden',
        p: 0,
      }}
    >
      {onSearch && (
        <Box sx={{ p: layout.cardPaddingCompact, pb: 0 }}>
          <TextField
            size="small"
            placeholder={t('actions.search')}
            value={search || ''}
            onChange={(e) => onSearch(e.target.value)}
            fullWidth
          />
        </Box>
      )}
      <TableContainer sx={{ mt: onSearch ? space.md : 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field}>
                  {col.sortable !== false && onSort ? (
                    <TableSortLabel
                      active={sort === col.field}
                      direction={sort === col.field ? order : 'asc'}
                      onClick={() => handleSort(col.field)}
                    >
                      {col.headerName}
                    </TableSortLabel>
                  ) : col.headerName}
                </TableCell>
              ))}
              {actions && <TableCell align="right">{t('actions.actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center">
                  {helpTopic ? (
                    <EmptyStateHelp topicId={helpTopic} />
                  ) : (
                    <Typography color="text.secondary" py={layout.cardPadding}>
                      {t('table.noRecords')}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((col) => (
                  <TableCell key={col.field}>
                    {col.render ? col.render(row) : row[col.field]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {onEdit && (
                      <IconButton size="small" onClick={() => onEdit(row)} aria-label="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton size="small" color="error" onClick={() => onDelete(row)} aria-label="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {total !== undefined && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={limit}
          onPageChange={(_, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onLimitChange?.(parseInt(e.target.value, 10))}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Paper>
  );
}
