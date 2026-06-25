import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';

const video = (file) => ({
  en: `/help/videos/en/${file}`,
  hi: `/help/videos/hi/${file}`,
});

const thumbnail = '/help/thumbnails/training.svg';

export const HELP_TOPICS = [
  { id: 'getting-started', guideKey: 'getting-started', icon: PlayCircleIcon, video: video('01-getting-started.mp4'), thumbnail, duration: '3:00', route: '/dashboard' },
  { id: 'login-profile', guideKey: 'login-profile', icon: LoginIcon, video: video('02-login-profile.mp4'), thumbnail, duration: '2:30', route: '/change-password' },
  { id: 'master-data', guideKey: 'master-data', icon: PeopleIcon, video: video('03-master-data.mp4'), thumbnail, duration: '4:00', route: '/masters/customers' },
  { id: 'purchases', guideKey: 'purchases', icon: ShoppingCartIcon, video: video('04-purchases.mp4'), thumbnail, duration: '4:20', route: '/purchases' },
  { id: 'sales', guideKey: 'sales', icon: PointOfSaleIcon, video: video('05-sales.mp4'), thumbnail, duration: '4:00', route: '/sales' },
  { id: 'inventory', guideKey: 'inventory', icon: InventoryIcon, video: video('06-inventory.mp4'), thumbnail, duration: '3:30', route: '/inventory' },
  { id: 'payments', guideKey: 'payments', icon: PaymentIcon, video: video('07-payments.mp4'), thumbnail, duration: '3:30', route: '/payments' },
  { id: 'reports', guideKey: 'reports', icon: AssessmentIcon, video: video('08-reports.mp4'), thumbnail, duration: '2:45', route: '/reports' },
  { id: 'documents', guideKey: 'documents', icon: DescriptionIcon, video: video('09-documents.mp4'), thumbnail, duration: '2:40', route: '/documents' },
  { id: 'dashboard', guideKey: 'dashboard', icon: DashboardIcon, video: video('10-dashboard.mp4'), thumbnail, duration: '2:00', route: '/dashboard' },
  { id: 'profit-loss', guideKey: 'profit-loss', icon: LeaderboardIcon, video: video('11-profit-loss.mp4'), thumbnail, duration: '3:10', route: '/profit-loss' },
  { id: 'batch-pl', guideKey: 'batch-pl', icon: InventoryIcon, video: video('12-batch-pl.mp4'), thumbnail, duration: '3:00', route: '/profit-loss' },
  { id: 'pl-statement', guideKey: 'pl-statement', icon: AccountBalanceIcon, video: video('13-pl-statement.mp4'), thumbnail, duration: '2:50', route: '/accounting/pl-statement' },
  { id: 'aging', guideKey: 'aging', icon: PaymentIcon, video: video('14-aging.mp4'), thumbnail, duration: '2:30', route: '/accounting/aging' },
  { id: 'day-book', guideKey: 'day-book', icon: ReceiptIcon, video: video('15-day-book.mp4'), thumbnail, duration: '2:30', route: '/accounting/day-book' },
  { id: 'gst-summary', guideKey: 'gst-summary', icon: AssessmentIcon, video: video('16-gst-summary.mp4'), thumbnail, duration: '2:15', route: '/accounting/gst-summary' },
  { id: 'leads-pipeline', guideKey: 'leads-pipeline', icon: AssignmentIcon, video: video('17-leads-pipeline.mp4'), thumbnail, duration: '3:00', route: '/crm/leads' },
  { id: 'activities', guideKey: 'activities', icon: EventNoteIcon, video: video('18-activities.mp4'), thumbnail, duration: '2:40', route: '/crm/activities' },
];

export const findHelpTopic = (topicId) => HELP_TOPICS.find(topic => topic.id === topicId);
