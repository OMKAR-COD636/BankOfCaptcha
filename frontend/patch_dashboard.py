import os
import json
import re

def fix_file(file_path, hook_regex, hook_replace, replacements):
    with open(file_path, 'r') as f:
        content = f.read()

    if 'useTranslation' not in content:
        lines = content.split('\n')
        idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                idx = i
        lines.insert(idx + 1, "import { useTranslation } from '../../i18n/LanguageContext';")
        content = '\n'.join(lines)
    
    if 'const { t } = useTranslation();' not in content:
        content = re.sub(hook_regex, hook_replace, content, count=1)
        
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

fix_file('src/components/shared/AuditLogTable.jsx',
         r'(const AuditLogTable = \(\{ logs, users, token, selectedDate = null \}\) => \{)',
         r'\1\n  const { t } = useTranslation();',
         [
             (">System Audit Logs<", ">{t('dashboard.systemAuditLogs')}<"),
             (">Verify Integrity<", ">{t('dashboard.verifyIntegrity')}<"),
             (">Verify<", ">{t('dashboard.verify')}<"),
             ("No audit logs found for the selected filters.", "{t('dashboard.noAuditLogs')}")
         ])

fix_file('src/pages/dashboards/SuperAdminDashboard.jsx',
         r'(const SuperAdminDashboard = \(\) => \{)',
         r'\1\n  const { t } = useTranslation();',
         [
             ("label: 'Security & Intelligence'", "label: t('dashboard.securityAi')"),
             ("label: 'Compliance & Audit'", "label: t('dashboard.compliance')"),
         ])

fix_file('src/pages/dashboards/TellerDashboard.jsx',
         r'(const TellerDashboard = \(\) => \{)',
         r'\1\n  const { t } = useTranslation();',
         [
             (">Staff Dashboard<", ">{t('dashboard.staffDashboard')}<"),
             (">Teller Transfer Portal<", ">{t('dashboard.tellerTransferPortal')}<"),
             ('placeholder="Source Account"', 'placeholder={t("dashboard.sourceAccount")}'),
             ('placeholder="Dest Account"', 'placeholder={t("dashboard.destAccount")}'),
             ('placeholder="Amount"', 'placeholder={t("dashboard.amount")}'),
             (">Submit Transfer<", ">{t('dashboard.submitTransfer')}<"),
             (">New Account Applications (KYC Queue)<", ">{t('dashboard.kycQueue')}<"),
             ("<th>Name</th>", "<th>{t('dashboard.name')}</th>"),
             ("<th>Email</th>", "<th>{t('dashboard.email')}</th>"),
             ("<th>Aadhaar (Encrypted)</th>", "<th>{t('dashboard.aadhaarEncrypted')}</th>"),
             (">Approve Account<", ">{t('dashboard.approveAccount')}<"),
             (">No pending KYC applications.<", ">{t('dashboard.noPendingKyc')}<")
         ])

fix_file('src/pages/dashboards/ComplianceOfficerDashboard.jsx',
         r'(const ComplianceOfficerDashboard = \(\) => \{)',
         r'\1\n  const { t } = useTranslation();',
         [
             ("> Compliance Audit Logs<", "> {t('dashboard.complianceAuditLogs')}<")
         ])

fix_file('src/pages/dashboards/AdminDashboard.jsx',
         r'(const AdminDashboard = \(\) => \{)',
         r'\1\n  const { t } = useTranslation();',
         [
             ("> Admin Dashboard<", "> {t('dashboard.adminDashboard')}<")
         ])

def update_json(path, data):
    with open(path, 'r') as f:
        current = json.load(f)
    current['dashboard'].update(data)
    with open(path, 'w') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

en = {
    "verifyIntegrity": "Verify Integrity",
    "verify": "Verify",
    "noAuditLogs": "No audit logs found for the selected filters.",
    "staffDashboard": "Staff Dashboard",
    "tellerTransferPortal": "Teller Transfer Portal",
    "sourceAccount": "Source Account",
    "destAccount": "Dest Account",
    "amount": "Amount",
    "submitTransfer": "Submit Transfer",
    "kycQueue": "New Account Applications (KYC Queue)",
    "name": "Name",
    "email": "Email",
    "aadhaarEncrypted": "Aadhaar (Encrypted)",
    "approveAccount": "Approve Account",
    "noPendingKyc": "No pending KYC applications.",
    "complianceAuditLogs": "Compliance Audit Logs",
    "adminDashboard": "Admin Dashboard"
}

hi = {
    "verifyIntegrity": "सत्यता जाँचे",
    "verify": "सत्यापित करें",
    "noAuditLogs": "चयनित फ़िल्टर के लिए कोई ऑडिट लॉग नहीं मिला।",
    "staffDashboard": "कर्मचारी डैशबोर्ड",
    "tellerTransferPortal": "टेलर स्थानांतरण पोर्टल",
    "sourceAccount": "स्रोत खाता",
    "destAccount": "गंतव्य खाता",
    "amount": "रकम",
    "submitTransfer": "स्थानांतरण जमा करें",
    "kycQueue": "नया खाता आवेदन (KYC कतार)",
    "name": "नाम",
    "email": "ईमेल",
    "aadhaarEncrypted": "आधार (एन्क्रिप्टेड)",
    "approveAccount": "खाता स्वीकृत करें",
    "noPendingKyc": "कोई लंबित KYC आवेदन नहीं।",
    "complianceAuditLogs": "अनुपालन ऑडिट लॉग",
    "adminDashboard": "एडमिन डैशबोर्ड"
}

mr = {
    "verifyIntegrity": "सत्यता तपासा",
    "verify": "सत्यापित करा",
    "noAuditLogs": "निवडलेल्या फिल्टरसाठी कोणतेही ऑडिट लॉग सापडले नाहीत.",
    "staffDashboard": "कर्मचारी डॅशबोर्ड",
    "tellerTransferPortal": "टेलर ट्रान्सफर पोर्टल",
    "sourceAccount": "स्रोत खाते",
    "destAccount": "गंतव्य खाते",
    "amount": "रक्कम",
    "submitTransfer": "ट्रान्सफर सबमिट करा",
    "kycQueue": "नवीन खाते अर्ज (KYC रांग)",
    "name": "नाव",
    "email": "ईमेल",
    "aadhaarEncrypted": "आधार (एनक्रिप्टेड)",
    "approveAccount": "खाते मंजूर करा",
    "noPendingKyc": "कोणतेही प्रलंबित KYC अर्ज नाहीत.",
    "complianceAuditLogs": "अनुपालन ऑडिट लॉग",
    "adminDashboard": "अ‍ॅडमिन डॅशबोर्ड"
}

update_json('src/i18n/locales/en.json', en)
update_json('src/i18n/locales/hi.json', hi)
update_json('src/i18n/locales/mr.json', mr)

print("Dashboard scripts fixed")
