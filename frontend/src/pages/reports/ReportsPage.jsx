import { useMemo, useState } from 'react';
import { Box, Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useListReportTypesQuery, useListReportTemplatesQuery, useListReportTemplateOptionsQuery,
  useCreateReportTemplateMutation, useUpdateReportTemplateMutation, useDeleteReportTemplateMutation,
  useListSalesQuery, useListPurchasesQuery, useListPaymentsQuery, useListExpensesQuery, useListInvestmentsQuery,
  useListSuppliersQuery, useListCustomersQuery,
} from '../../store/api/services';
import { getApiBaseUrl } from '../../utils/apiBase';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';
import { formatApiError } from '../../utils/formatApiError';
import ReportsHero from './components/ReportsHero';
import PageHeader from '../../components/PageHeader';
import ReportsSummaryStats from './components/ReportsSummaryStats';
import ReportsTabBar from './components/ReportsTabBar';
import StandardReportsTab from './components/StandardReportsTab';
import DocumentsTab from './components/DocumentsTab';
import CustomReportsTab from './components/CustomReportsTab';
import TemplateAdminPanel from './components/TemplateAdminPanel';

const API_URL = getApiBaseUrl();
const defaultTemplateForm = {
  id: null,
  name: '',
  description: '',
  baseReportType: 'sales',
  columns: [],
  filters: [],
  allowedRoles: ['ADMIN', 'FINANCE'],
};

export default function ReportsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector(selectCurrentUser);
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const [tab, setTab] = useState(0);
  const [standardFilters, setStandardFilters] = useState({ from: '', to: '', supplierId: '', customerId: '', status: '' });
  const [standardQuery, setStandardQuery] = useState({});
  const [templateFilters, setTemplateFilters] = useState({ from: '', to: '' });
  const [templateForm, setTemplateForm] = useState(defaultTemplateForm);
  const [templateErrors, setTemplateErrors] = useState({});
  const { data: reportTypes } = useListReportTypesQuery(undefined, { skip: tab !== 0 });
  const { data: templates } = useListReportTemplatesQuery(undefined, { skip: tab !== 2 && tab !== 3 });
  const { data: templateOptions } = useListReportTemplateOptionsQuery(undefined, { skip: !isAdmin || tab !== 3 });
  const { data: sales } = useListSalesQuery({ page: 1, limit: 20 }, { skip: tab !== 1 });
  const { data: purchases } = useListPurchasesQuery({ page: 1, limit: 20 }, { skip: tab !== 1 });
  const { data: payments } = useListPaymentsQuery({ page: 1, limit: 20 }, { skip: tab !== 1 });
  const { data: expenses } = useListExpensesQuery({ page: 1, limit: 20 }, { skip: tab !== 1 });
  const { data: investments } = useListInvestmentsQuery({ page: 1, limit: 20 }, { skip: tab !== 1 });
  const { data: suppliersData } = useListSuppliersQuery({ limit: 200 }, { skip: tab !== 0 });
  const { data: customersData } = useListCustomersQuery({ limit: 200 }, { skip: tab !== 0 });
  const [createTemplate, { isLoading: creatingTemplate }] = useCreateReportTemplateMutation();
  const [updateTemplate, { isLoading: updatingTemplate }] = useUpdateReportTemplateMutation();
  const [deleteTemplate] = useDeleteReportTemplateMutation();

  const standardReports = reportTypes?.data || [];
  const visibleTemplates = templates?.data || [];
  const baseReports = useMemo(() => templateOptions?.data?.baseReports || [], [templateOptions]);
  const selectedBaseReport = useMemo(
    () => baseReports.find((report) => report.id === templateForm.baseReportType),
    [baseReports, templateForm.baseReportType],
  );

  const downloadBlob = async (url, filename, options = {}) => {
    const token = JSON.parse(localStorage.getItem('tradecrm_auth') || '{}').accessToken;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(objectUrl);
  };

  const handleStandardDownload = async (type, format) => {
    const params = new URLSearchParams({ format });
    Object.entries(standardQuery).forEach(([key, value]) => value && params.set(key, value));
    await downloadBlob(
      `${API_URL}/reports/${type}/export?${params}`,
      `${type}-report.${format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'}`,
    );
  };

  const handleDocumentDownload = async (documentType, id, format) => {
    const pathByType = {
      sales: `/reports/documents/sales/${id}/invoice`,
      purchases: `/reports/documents/purchases/${id}/bill`,
      payments: `/reports/documents/payments/${id}/receipt`,
      expenses: `/reports/documents/expenses/${id}/voucher`,
      investments: `/reports/documents/investments/${id}/statement`,
    };
    await downloadBlob(
      `${API_URL}${pathByType[documentType]}?format=${format}`,
      `${documentType}-document.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    );
  };

  const handleTemplateRun = async (template, format) => {
    await downloadBlob(
      `${API_URL}/reports/templates/${template.id}/run?format=${format}`,
      `${template.name}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      { method: 'POST', body: JSON.stringify(templateFilters) },
    );
  };

  const setBaseReport = (baseReportType) => {
    const base = baseReports.find((report) => report.id === baseReportType);
    setTemplateForm({
      ...templateForm,
      baseReportType,
      columns: base?.columns?.map((column) => column.key) || [],
      filters: base?.filters || [],
    });
  };

  const templateRules = {
    name: (values) => validators.required(values.name, tCommon),
    baseReportType: (values) => validators.select(values.baseReportType, tCommon),
    columns: (values) => validators.arrayMin(values.columns, tCommon, { min: 1 }),
    allowedRoles: (values) => validators.arrayMin(values.allowedRoles, tCommon, { min: 1 }),
  };

  const saveTemplate = async () => {
    const nextErrors = validateFields(templateRules, templateForm, tCommon);
    setTemplateErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (templateForm.id) {
        await updateTemplate(templateForm).unwrap();
        enqueueSnackbar(t('reports.templateUpdated'), { variant: 'success' });
      } else {
        await createTemplate(templateForm).unwrap();
        enqueueSnackbar(t('reports.templateCreated'), { variant: 'success' });
      }
      setTemplateForm(defaultTemplateForm);
      setTemplateErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setTemplateErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, t('reports.templateSaveFailed')), { variant: 'error' });
    }
  };

  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return (
          <StandardReportsTab
            standardFilters={standardFilters}
            onFiltersChange={setStandardFilters}
            onApply={() => setStandardQuery(standardFilters)}
            onReset={() => {
              setStandardFilters({ from: '', to: '', supplierId: '', customerId: '', status: '' });
              setStandardQuery({});
            }}
            suppliers={suppliersData?.data || []}
            customers={customersData?.data || []}
            standardReports={standardReports}
            onDownload={handleStandardDownload}
          />
        );
      case 1:
        return (
          <DocumentsTab
            sales={sales?.data || []}
            purchases={purchases?.data || []}
            payments={payments?.data || []}
            expenses={expenses?.data || []}
            investments={investments?.data || []}
            onDownload={handleDocumentDownload}
          />
        );
      case 2:
        return (
          <CustomReportsTab
            templateFilters={templateFilters}
            onFiltersChange={setTemplateFilters}
            templates={visibleTemplates}
            isAdmin={isAdmin}
            onDownload={handleTemplateRun}
          />
        );
      case 3:
        return isAdmin ? (
          <TemplateAdminPanel
            templateForm={templateForm}
            templateErrors={templateErrors}
            baseReports={baseReports}
            selectedBaseReport={selectedBaseReport}
            visibleTemplates={visibleTemplates}
            creatingTemplate={creatingTemplate}
            updatingTemplate={updatingTemplate}
            onFormChange={setTemplateForm}
            onBaseReportChange={setBaseReport}
            onClearFieldError={(field) => clearFieldError(setTemplateErrors, field)}
            onSave={saveTemplate}
            onEdit={(template) => {
              setTemplateForm({
                id: template.id,
                name: template.name,
                description: template.description || '',
                baseReportType: template.baseReportType,
                columns: template.columns || [],
                filters: template.filters || [],
                allowedRoles: template.allowedRoles || [],
              });
              setTemplateErrors({});
            }}
            onDelete={(id) => deleteTemplate(id)}
            onNew={() => {
              setTemplateForm(defaultTemplateForm);
              setTemplateErrors({});
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
      />
      <ReportsHero />
      <ReportsSummaryStats
        standardCount={standardReports.length}
        templateCount={visibleTemplates.length}
      />
      <ReportsTabBar tab={tab} onChange={setTab} isAdmin={isAdmin} />

      <Fade in key={tab} timeout={220}>
        <Box>{renderTabContent()}</Box>
      </Fade>
    </Box>
  );
}
