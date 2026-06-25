import { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EmptyStateHelp from './EmptyStateHelp';
import { layout, space } from '../theme/tokens';

export default function VirtualDataGrid({
  columns,
  rows,
  loading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  onRowClick,
  helpTopic,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const { t } = useTranslation();
  const gridColumns = useMemo(() => columns.map((col) => ({
    field: col.field,
    headerName: col.headerName,
    flex: col.flex ?? 1,
    minWidth: col.minWidth ?? 120,
    type: col.type,
    valueFormatter: col.valueFormatter,
    renderCell: col.renderCell,
  })), [columns]);

  if (loading && !rows.length) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={52} sx={{ mb: space.xs }} />
        ))}
      </Box>
    );
  }

  if (!loading && !rows.length) {
    return <EmptyStateHelp topic={helpTopic} message={t('messages.noData')} />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: layout.gridMinHeight,
        height: layout.gridMinHeight,
      }}
    >
      <DataGrid
        rows={rows}
        columns={gridColumns}
        loading={loading}
        rowCount={rowCount ?? rows.length}
        paginationMode={rowCount != null ? 'server' : 'client'}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        sortingMode={rowCount != null ? 'server' : 'client'}
        pageSizeOptions={pageSizeOptions}
        disableRowSelectionOnClick
        onRowClick={onRowClick}
        density="compact"
        sx={{ border: 0, height: '100%' }}
      />
    </Box>
  );
}
