import os
import json
import re

files_to_patch = {
    'src/components/RiskActivityGraph.jsx': {
        'import': "import { useTranslation } from '../i18n/LanguageContext';\n",
        'hook_inject': ('const RiskActivityGraph = ({ alerts = [], onDateSelect, selectedDate }) => {', 
                        'const RiskActivityGraph = ({ alerts = [], onDateSelect, selectedDate }) => {\n    const { t } = useTranslation();'),
        'replacements': [
            (">Risk Activity Calendar<", ">{t('dashboard.riskActivityCalendar')}<"),
            (">Clear Date Filter<", ">{t('dashboard.clearDateFilter')}<"),
            (">Peak Severity:<", ">{t('dashboard.peakSeverity')}:<"),
            (">Low<", ">{t('dashboard.low')}<"),
            (">Medium<", ">{t('dashboard.medium')}<"),
            (">High<", ">{t('dashboard.high')}<"),
            (">Opacity = Volume<", ">{t('dashboard.opacityVolume')}<")
        ]
    },
    'src/components/RiskHeatmap.jsx': {
        'import': "import { useTranslation } from '../i18n/LanguageContext';\n",
        'hook_inject': ('const RiskHeatmap = ({ alerts = [], onMatrixSelect, selectedMatrix }) => {',
                        'const RiskHeatmap = ({ alerts = [], onMatrixSelect, selectedMatrix }) => {\n    const { t } = useTranslation();'),
        'replacements': [
            (">Risk Severity Matrix<", ">{t('dashboard.riskSeverityMatrix')}<"),
            (">Clear Matrix Filter<", ">{t('dashboard.clearMatrixFilter')}<")
        ]
    },
    'src/components/superadmin/SecurityTab.jsx': {
        'import': "import { useTranslation } from '../../i18n/LanguageContext';\n",
        'hook_inject': ('const SecurityTab = ({ aiAlerts, setAiAlerts, users, token, logs, transactionRequests }) => {',
                        'const SecurityTab = ({ aiAlerts, setAiAlerts, users, token, logs, transactionRequests }) => {\n  const { t } = useTranslation();'),
        'replacements': [
            (">Filtered Alerts<", ">{t('dashboard.filteredAlerts')}<"),
            (">Filtered Audit Logs<", ">{t('dashboard.filteredAuditLogs')}<"),
            (">Pending Requests<", ">{t('dashboard.pendingRequests')}<"),
            ("> AI Security Alerts<", "> {t('dashboard.aiSecurityAlerts')}<"),
            (">Hide AI Feedback<", ">{t('dashboard.hideAiFeedback')}<"),
            (">AI Feedback<", ">{t('dashboard.aiFeedback')}<"),
            (">Resolve & Unfreeze All<", ">{t('dashboard.resolveAll')}<"),
            ('placeholder="Search by username..."', 'placeholder={t("dashboard.searchUsername")}'),
            (">All Roles<", ">{t('dashboard.allRoles')}<"),
            (">Customer<", ">{t('dashboard.roleCustomer')}<"),
            (">Teller<", ">{t('dashboard.roleTeller')}<"),
            (">Branch Manager<", ">{t('dashboard.roleBranchManager')}<"),
            (">Admin<", ">{t('dashboard.roleAdmin')}<"),
            (">Super Admin<", ">{t('dashboard.roleSuperAdmin')}<"),
            (">Compliance Officer<", ">{t('dashboard.roleComplianceOfficer')}<"),
            (">All Severities<", ">{t('dashboard.allSeverities')}<"),
            (">High<", ">{t('dashboard.high')}<"),
            (">Medium<", ">{t('dashboard.medium')}<"),
            (">Low<", ">{t('dashboard.low')}<"),
            (">All Statuses<", ">{t('dashboard.allStatuses')}<"),
            (">Open<", ">{t('dashboard.statusOpen')}<"),
            (">Resolved<", ">{t('dashboard.statusResolved')}<"),
            (">Flagged User<", ">{t('dashboard.flaggedUser')}<"),
            (">User Role<", ">{t('dashboard.userRole')}<"),
            (">Severity<", ">{t('dashboard.severity')}<"),
            (">Description<", ">{t('dashboard.description')}<"),
            (">Status<", ">{t('dashboard.status')}<"),
            (">Timestamp<", ">{t('dashboard.timestamp')}<"),
            (">Actions<", ">{t('dashboard.actions')}<"),
            (">Resolve<", ">{t('dashboard.resolve')}<"),
            (">Review<", ">{t('dashboard.review')}<")
        ]
    },
    'src/components/superadmin/StaffManagementTab.jsx': {
        'import': "import { useTranslation } from '../../i18n/LanguageContext';\n",
        'hook_inject': ('const StaffManagementTab = ({ users, branches, token }) => {',
                        'const StaffManagementTab = ({ users, branches, token }) => {\n  const { t } = useTranslation();'),
        'replacements': [
            (">Staff Management<", ">{t('dashboard.staffManagement')}<"),
            (">Register New Staff<", ">{t('dashboard.registerNewStaff')}<"),
            (">Full Name<", ">{t('dashboard.fullName')}<"),
            (">Username<", ">{t('dashboard.username')}<"),
            (">Password<", ">{t('dashboard.password')}<"),
            (">Role<", ">{t('dashboard.role')}<"),
            (">Branch<", ">{t('dashboard.branch')}<"),
            ("-- Select Role --", "{t('dashboard.selectRole')}"),
            ("-- Select Branch --", "{t('dashboard.selectBranch')}"),
            (">Register Staff<", ">{t('dashboard.registerStaff')}<"),
            (">Current Staff<", ">{t('dashboard.currentStaff')}<")
        ]
    },
    'src/components/superadmin/BranchOperationsTab.jsx': {
        'import': "import { useTranslation } from '../../i18n/LanguageContext';\n",
        'hook_inject': ('const BranchOperationsTab = ({ branches, setBranches, token }) => {',
                        'const BranchOperationsTab = ({ branches, setBranches, token }) => {\n  const { t } = useTranslation();'),
        'replacements': [
            (">Branch Operations<", ">{t('dashboard.branchOperations')}<"),
            (">Create New Branch<", ">{t('dashboard.createNewBranch')}<"),
            (">Branch Name<", ">{t('dashboard.branchName')}<"),
            (">Location<", ">{t('dashboard.location')}<"),
            (">Create Branch<", ">{t('dashboard.createBranch')}<"),
            (">Existing Branches<", ">{t('dashboard.existingBranches')}<"),
            (">Branch ID<", ">{t('dashboard.branchId')}<")
        ]
    },
    'src/components/shared/AuditLogTable.jsx': {
        'import': "import { useTranslation } from '../../i18n/LanguageContext';\n",
        'hook_inject': ('const AuditLogTable = ({ logs, users, token }) => {',
                        'const AuditLogTable = ({ logs, users, token }) => {\n  const { t } = useTranslation();'),
        'replacements': [
            (">System Audit Logs<", ">{t('dashboard.systemAuditLogs')}<"),
            (">Export CSV<", ">{t('dashboard.exportCsv')}<"),
            ('placeholder="Search logs..."', 'placeholder={t("dashboard.searchLogs")}'),
            (">All Roles<", ">{t('dashboard.allRoles')}<"),
            (">Customer<", ">{t('dashboard.roleCustomer')}<"),
            (">Teller<", ">{t('dashboard.roleTeller')}<"),
            (">Branch Manager<", ">{t('dashboard.roleBranchManager')}<"),
            (">Admin<", ">{t('dashboard.roleAdmin')}<"),
            (">Super Admin<", ">{t('dashboard.roleSuperAdmin')}<"),
            (">Compliance Officer<", ">{t('dashboard.roleComplianceOfficer')}<"),
            (">All Actions<", ">{t('dashboard.allActions')}<"),
            (">Action<", ">{t('dashboard.action')}<"),
            (">User ID<", ">{t('dashboard.userId')}<"),
            (">User Role<", ">{t('dashboard.userRole')}<"),
            (">IP Address<", ">{t('dashboard.ipAddress')}<"),
            (">Timestamp<", ">{t('dashboard.timestamp')}<"),
            (">Details<", ">{t('dashboard.details')}<"),
        ]
    }
}

for file_path, config in files_to_patch.items():
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        continue
    with open(file_path, 'r') as f:
        content = f.read()

    # Inject import if needed
    if "useTranslation" not in content:
        lines = content.split('\n')
        lines.insert(1, config['import'].strip())
        content = '\n'.join(lines)
        
        # Inject hook
        content = content.replace(config['hook_inject'][0], config['hook_inject'][1])

    for old, new in config['replacements']:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)


def update_json(path, data):
    with open(path, 'r') as f:
        current = json.load(f)
    current['dashboard'].update(data)
    with open(path, 'w') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

en_additions = {
    "riskActivityCalendar": "Risk Activity Calendar",
    "clearDateFilter": "Clear Date Filter",
    "peakSeverity": "Peak Severity",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "opacityVolume": "Opacity = Volume",
    "riskSeverityMatrix": "Risk Severity Matrix",
    "clearMatrixFilter": "Clear Matrix Filter",
    "filteredAlerts": "Filtered Alerts",
    "filteredAuditLogs": "Filtered Audit Logs",
    "pendingRequests": "Pending Requests",
    "aiSecurityAlerts": "AI Security Alerts",
    "hideAiFeedback": "Hide AI Feedback",
    "aiFeedback": "AI Feedback",
    "resolveAll": "Resolve & Unfreeze All",
    "searchUsername": "Search by username...",
    "allRoles": "All Roles",
    "roleCustomer": "Customer",
    "roleTeller": "Teller",
    "roleBranchManager": "Branch Manager",
    "roleAdmin": "Admin",
    "roleSuperAdmin": "Super Admin",
    "roleComplianceOfficer": "Compliance Officer",
    "allSeverities": "All Severities",
    "allStatuses": "All Statuses",
    "statusOpen": "Open",
    "statusResolved": "Resolved",
    "flaggedUser": "Flagged User",
    "userRole": "User Role",
    "severity": "Severity",
    "description": "Description",
    "status": "Status",
    "timestamp": "Timestamp",
    "actions": "Actions",
    "resolve": "Resolve",
    "review": "Review",
    "registerNewStaff": "Register New Staff",
    "fullName": "Full Name",
    "username": "Username",
    "password": "Password",
    "role": "Role",
    "branch": "Branch",
    "selectRole": "-- Select Role --",
    "selectBranch": "-- Select Branch --",
    "registerStaff": "Register Staff",
    "currentStaff": "Current Staff",
    "createNewBranch": "Create New Branch",
    "branchName": "Branch Name",
    "location": "Location",
    "createBranch": "Create Branch",
    "existingBranches": "Existing Branches",
    "branchId": "Branch ID",
    "systemAuditLogs": "System Audit Logs",
    "exportCsv": "Export CSV",
    "searchLogs": "Search logs...",
    "allActions": "All Actions",
    "action": "Action",
    "userId": "User ID",
    "ipAddress": "IP Address",
    "details": "Details"
}

hi_additions = {
    "riskActivityCalendar": "जोखिम गतिविधि कैलेंडर",
    "clearDateFilter": "दिनांक फ़िल्टर साफ़ करें",
    "peakSeverity": "अधिकतम गंभीरता",
    "low": "कम",
    "medium": "मध्यम",
    "high": "उच्च",
    "opacityVolume": "पारदर्शिता = मात्रा",
    "riskSeverityMatrix": "जोखिम गंभीरता मैट्रिक्स",
    "clearMatrixFilter": "मैट्रिक्स फ़िल्टर साफ़ करें",
    "filteredAlerts": "फ़िल्टर किए गए अलर्ट",
    "filteredAuditLogs": "फ़िल्टर किए गए ऑडिट लॉग",
    "pendingRequests": "लंबित अनुरोध",
    "aiSecurityAlerts": "एआई सुरक्षा अलर्ट",
    "hideAiFeedback": "एआई फ़ीडबैक छिपाएँ",
    "aiFeedback": "एआई फ़ीडबैक",
    "resolveAll": "सभी को हल करें और अनफ्रीज़ करें",
    "searchUsername": "उपयोगकर्ता नाम से खोजें...",
    "allRoles": "सभी भूमिकाएँ",
    "roleCustomer": "ग्राहक",
    "roleTeller": "टेलर",
    "roleBranchManager": "शाखा प्रबंधक",
    "roleAdmin": "व्यवस्थापक",
    "roleSuperAdmin": "सुपर व्यवस्थापक",
    "roleComplianceOfficer": "अनुपालन अधिकारी",
    "allSeverities": "सभी गंभीरताएँ",
    "allStatuses": "सभी स्थितियाँ",
    "statusOpen": "खुला",
    "statusResolved": "हल किया गया",
    "flaggedUser": "चिह्नित उपयोगकर्ता",
    "userRole": "उपयोगकर्ता की भूमिका",
    "severity": "गंभीरता",
    "description": "विवरण",
    "status": "स्थिति",
    "timestamp": "समय (Timestamp)",
    "actions": "कार्रवाई",
    "resolve": "हल करें",
    "review": "समीक्षा करें",
    "registerNewStaff": "नए कर्मचारी को पंजीकृत करें",
    "fullName": "पूरा नाम",
    "username": "उपयोगकर्ता नाम",
    "password": "पासवर्ड",
    "role": "भूमिका",
    "branch": "शाखा",
    "selectRole": "-- भूमिका चुनें --",
    "selectBranch": "-- शाखा चुनें --",
    "registerStaff": "कर्मचारी पंजीकृत करें",
    "currentStaff": "वर्तमान कर्मचारी",
    "createNewBranch": "नई शाखा बनाएँ",
    "branchName": "शाखा का नाम",
    "location": "स्थान",
    "createBranch": "शाखा बनाएँ",
    "existingBranches": "मौजूदा शाखाएँ",
    "branchId": "शाखा आईडी",
    "systemAuditLogs": "सिस्टम ऑडिट लॉग",
    "exportCsv": "सीएसवी (CSV) निर्यात करें",
    "searchLogs": "लॉग खोजें...",
    "allActions": "सभी कार्रवाइयाँ",
    "action": "कार्रवाई",
    "userId": "उपयोगकर्ता आईडी",
    "ipAddress": "आईपी (IP) पता",
    "details": "विवरण"
}

mr_additions = {
    "riskActivityCalendar": "जोखीम क्रियाकलाप कॅलेंडर",
    "clearDateFilter": "तारीख फिल्टर साफ करा",
    "peakSeverity": "कमाल तीव्रता",
    "low": "कमी",
    "medium": "मध्यम",
    "high": "उच्च",
    "opacityVolume": "पारदर्शकता = प्रमाण",
    "riskSeverityMatrix": "जोखीम तीव्रता मॅट्रिक्स",
    "clearMatrixFilter": "मॅट्रिक्स फिल्टर साफ करा",
    "filteredAlerts": "फिल्टर केलेले अलर्ट",
    "filteredAuditLogs": "फिल्टर केलेले ऑडिट लॉग",
    "pendingRequests": "प्रलंबित विनंत्या",
    "aiSecurityAlerts": "एआय सुरक्षा अलर्ट",
    "hideAiFeedback": "एआय फीडबॅक लपवा",
    "aiFeedback": "एआय फीडबॅक",
    "resolveAll": "सर्व सोडवा आणि अनफ्रीज करा",
    "searchUsername": "वापरकर्ता नावाने शोधा...",
    "allRoles": "सर्व भूमिका",
    "roleCustomer": "ग्राहक",
    "roleTeller": "टेलर",
    "roleBranchManager": "शाखा व्यवस्थापक",
    "roleAdmin": "प्रशासक",
    "roleSuperAdmin": "सुपर प्रशासक",
    "roleComplianceOfficer": "अनुपालन अधिकारी",
    "allSeverities": "सर्व तीव्रता",
    "allStatuses": "सर्व स्थिती",
    "statusOpen": "उघडा",
    "statusResolved": "सोडवले",
    "flaggedUser": "चिन्हांकित वापरकर्ता",
    "userRole": "वापरकर्त्याची भूमिका",
    "severity": "तीव्रता",
    "description": "वर्णन",
    "status": "स्थिती",
    "timestamp": "वेळ (Timestamp)",
    "actions": "क्रिया",
    "resolve": "सोडवा",
    "review": "पुनरावलोकन",
    "registerNewStaff": "नवीन कर्मचारी नोंदणीकृत करा",
    "fullName": "पूर्ण नाव",
    "username": "वापरकर्ता नाव",
    "password": "पासवर्ड",
    "role": "भूमिका",
    "branch": "शाखा",
    "selectRole": "-- भूमिका निवडा --",
    "selectBranch": "-- शाखा निवडा --",
    "registerStaff": "कर्मचारी नोंदणी करा",
    "currentStaff": "सध्याचे कर्मचारी",
    "createNewBranch": "नवीन शाखा तयार करा",
    "branchName": "शाखेचे नाव",
    "location": "स्थान",
    "createBranch": "शाखा तयार करा",
    "existingBranches": "विद्यमान शाखा",
    "branchId": "शाखा आयडी",
    "systemAuditLogs": "सिस्टम ऑडिट लॉग",
    "exportCsv": "सीएसव्ही (CSV) निर्यात करा",
    "searchLogs": "लॉग शोधा...",
    "allActions": "सर्व क्रिया",
    "action": "क्रिया",
    "userId": "वापरकर्ता आयडी",
    "ipAddress": "आयपी (IP) पत्ता",
    "details": "तपशील"
}

update_json('src/i18n/locales/en.json', en_additions)
update_json('src/i18n/locales/hi.json', hi_additions)
update_json('src/i18n/locales/mr.json', mr_additions)

print("Inner components patched!")
