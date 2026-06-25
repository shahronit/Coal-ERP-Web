const DEFAULT_COMPANY_PROFILE = {
  name: process.env.COMPANY_NAME || 'TradeCRM Pro',
  legalName: process.env.COMPANY_LEGAL_NAME || 'TradeCRM Pro Trading Business',
  address: process.env.COMPANY_ADDRESS || 'Business Address, India',
  phone: process.env.COMPANY_PHONE || '+91 00000 00000',
  email: process.env.COMPANY_EMAIL || 'accounts@tradecrm.local',
  gstin: process.env.COMPANY_GSTIN || 'GSTIN-NOT-SET',
  footerNote: 'This is a computer-generated document.',
};

const getCompanyProfile = () => DEFAULT_COMPANY_PROFILE;

module.exports = { DEFAULT_COMPANY_PROFILE, getCompanyProfile };
