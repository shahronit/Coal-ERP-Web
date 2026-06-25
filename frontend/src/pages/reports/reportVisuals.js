import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const REPORT_VISUALS = {
  purchases: { color: 'primary.main', Icon: ShoppingCartIcon },
  sales: { color: 'success.main', Icon: ReceiptLongIcon },
  inventory: { color: 'info.main', Icon: InventoryIcon },
  profit: { color: 'warning.main', Icon: TrendingUpIcon },
  'profit-loss': { color: 'warning.main', Icon: TrendingUpIcon },
  gst: { color: 'secondary.main', Icon: RequestQuoteIcon },
  'partner-roi': { color: 'secondary.main', Icon: AccountBalanceIcon },
  expenses: { color: 'error.main', Icon: RequestQuoteIcon },
  payments: { color: 'info.main', Icon: PaymentsIcon },
  default: { color: 'primary.main', Icon: AssessmentIcon },
};

export const DOCUMENT_VISUALS = {
  sales: { color: 'success.main', Icon: ReceiptLongOutlinedIcon },
  purchases: { color: 'primary.main', Icon: ShoppingCartIcon },
  payments: { color: 'info.main', Icon: PaymentsIcon },
  expenses: { color: 'warning.main', Icon: RequestQuoteIcon },
  investments: { color: 'secondary.main', Icon: AccountBalanceIcon },
};

export const getReportVisual = (id) => REPORT_VISUALS[id] || REPORT_VISUALS.default;

export const getDocumentVisual = (key) => DOCUMENT_VISUALS[key] || REPORT_VISUALS.default;

export const CUSTOM_TEMPLATE_VISUAL = { color: 'secondary.main', Icon: AutoAwesomeIcon };

export const staggerClass = (index) => `stagger-${(index % 7) + 1}`;

export const DOCUMENT_TYPE_COUNT = 5;
