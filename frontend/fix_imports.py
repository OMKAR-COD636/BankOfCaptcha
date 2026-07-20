import os

files = [
    'src/pages/dashboards/SuperAdminDashboard.jsx',
    'src/pages/dashboards/BranchManagerDashboard.jsx',
    'src/pages/dashboards/ItAdminDashboard.jsx',
    'src/pages/dashboards/TellerDashboard.jsx',
    'src/pages/dashboards/CustomerDashboard.jsx',
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    if "import { useTranslation }" not in content:
        # insert after the first line (or right at the top)
        lines = content.split('\n')
        lines.insert(1, "import { useTranslation } from '../../i18n/LanguageContext';")
        with open(file_path, 'w') as f:
            f.write('\n'.join(lines))
