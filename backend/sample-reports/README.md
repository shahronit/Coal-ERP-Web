# Sample Reports

Sample PDF and Excel reports are generated at runtime via the Reports module.

To generate sample reports after starting the application:

1. Login as Super Admin
2. Navigate to Reports
3. Click Excel or PDF for any report type

Or via API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/reports/purchases/export?format=pdf" \
  -o sample-purchase-report.pdf
```
