import os
import json

files_to_patch = {
    'src/pages/Login.jsx': [
        ("Sign In to Your Account", "{t('login.signInTitle')}"),
        ("Apply for an Account (KYC)", "{t('login.applyTitle')}"),
        ("Secure Government Banking Portal", "{t('login.subtitle')}"),
        (">Login<", ">{t('login.loginTab')}<"),
        (">Apply for Account<", ">{t('login.applyTab')}<"),
        (">Username<", ">{t('login.username')}<"),
        ("placeholder=\"Enter your username\"", "placeholder={t('login.usernamePlaceholder')}"),
        (">Password<", ">{t('login.password')}<"),
        (">Full Name<", ">{t('login.fullName')}<"),
        ("placeholder=\"John Doe\"", "placeholder={t('login.fullNamePlaceholder')}"),
        (">Aadhaar Number<", ">{t('login.aadhaar')}<"),
        (">Mobile Number<", ">{t('login.mobile')}<"),
        (">Email ID<", ">{t('login.email')}<"),
        (">Preferred Branch<", ">{t('login.branch')}<"),
        ("-- Select a Branch --", "{t('login.selectBranch')}"),
        ("Remember me", "{t('login.remember')}"),
        (">Forgot password?<", ">{t('login.forgot')}<"),
        (">Sign In<", ">{t('login.signInBtn')}<"),
        (">Submit KYC Application<", ">{t('login.submitKyc')}<"),
        (">Demo Accounts:<", ">{t('login.demo')}:<"),
        ("import DarkModeToggle", "import { useTranslation } from '../i18n/LanguageContext';\nimport DarkModeToggle"),
        ("const auth = useAuth();", "const auth = useAuth();\n  const { t } = useTranslation();")
    ],
    'src/pages/dashboards/DashboardRouter.jsx': [
        ("import DarkModeToggle", "import { useTranslation } from '../../i18n/LanguageContext';\nimport DarkModeToggle"),
        ("const DashboardRouter = () => {", "const DashboardRouter = () => {\n  const { t, language, setLanguage } = useTranslation();"),
        ("<DarkModeToggle />", "<span className=\"lang-switcher\" style={{marginRight: '20px', color: 'var(--text-color)'}}>\n            <span style={{cursor: 'pointer', fontWeight: language === 'en' ? 'bold' : 'normal'}} onClick={() => setLanguage('en')}>EN</span> | \n            <span style={{cursor: 'pointer', fontWeight: language === 'hi' ? 'bold' : 'normal'}} onClick={() => setLanguage('hi')}>HI</span> | \n            <span style={{cursor: 'pointer', fontWeight: language === 'mr' ? 'bold' : 'normal'}} onClick={() => setLanguage('mr')}>MR</span>\n          </span><DarkModeToggle />"),
        ("Welcome,", "{t('dashboard.welcome')},")
    ],
    'src/pages/dashboards/SuperAdminDashboard.jsx': [
        ("import React, { useState }", "import React, { useState } from 'react';\nimport { useTranslation } from '../../i18n/LanguageContext';"),
        ("const SuperAdminDashboard = () => {", "const SuperAdminDashboard = () => {\n  const { t } = useTranslation();"),
        ("System Overview", "{t('dashboard.systemOverview')}"),
        ("Branch Operations", "{t('dashboard.branchOperations')}"),
        ("Staff Management", "{t('dashboard.staffManagement')}"),
        ("Security & AI", "{t('dashboard.securityAi')}")
    ],
    'src/pages/dashboards/BranchManagerDashboard.jsx': [
        ("import React, { useState }", "import React, { useState } from 'react';\nimport { useTranslation } from '../../i18n/LanguageContext';"),
        ("const BranchManagerDashboard = () => {", "const BranchManagerDashboard = () => {\n  const { t } = useTranslation();"),
        (">Branch Overview<", ">{t('dashboard.branchOverview')}<"),
        (">Staff Operations<", ">{t('dashboard.staffOperations')}<"),
        (">Compliance<", ">{t('dashboard.compliance')}<")
    ],
    'src/pages/dashboards/ItAdminDashboard.jsx': [
        ("import React, { useState, useEffect }", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from '../../i18n/LanguageContext';"),
        ("const ItAdminDashboard = () => {", "const ItAdminDashboard = () => {\n  const { t } = useTranslation();"),
        (">System Logs<", ">{t('dashboard.systemLogs')}<"),
        (">AI Threat Engine<", ">{t('dashboard.aiThreatEngine')}<")
    ],
    'src/pages/dashboards/TellerDashboard.jsx': [
        ("import React, { useState, useEffect }", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from '../../i18n/LanguageContext';"),
        ("const TellerDashboard = () => {", "const TellerDashboard = () => {\n  const { t } = useTranslation();"),
        (">New Transaction<", ">{t('dashboard.newTransaction')}<"),
        (">Transaction History<", ">{t('dashboard.transactionHistory')}<")
    ],
    'src/pages/dashboards/CustomerDashboard.jsx': [
        ("import React, { useState, useEffect }", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from '../../i18n/LanguageContext';"),
        ("const CustomerDashboard = () => {", "const CustomerDashboard = () => {\n  const { t } = useTranslation();"),
        (">Accounts<", ">{t('dashboard.accounts')}<"),
        (">Transfers<", ">{t('dashboard.transfers')}<")
    ]
}

for file_path, replacements in files_to_patch.items():
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()

    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

def update_json(path, data):
    with open(path, 'r') as f:
        current = json.load(f)
    current.update(data)
    with open(path, 'w') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

en_data = {
  "login": {
    "signInTitle": "Sign In to Your Account",
    "applyTitle": "Apply for an Account (KYC)",
    "subtitle": "Secure Government Banking Portal",
    "loginTab": "Login",
    "applyTab": "Apply for Account",
    "username": "Username",
    "usernamePlaceholder": "Enter your username",
    "password": "Password",
    "fullName": "Full Name",
    "fullNamePlaceholder": "John Doe",
    "aadhaar": "Aadhaar Number",
    "mobile": "Mobile Number",
    "email": "Email ID",
    "branch": "Preferred Branch",
    "selectBranch": "-- Select a Branch --",
    "remember": "Remember me",
    "forgot": "Forgot password?",
    "signInBtn": "Sign In",
    "submitKyc": "Submit KYC Application",
    "demo": "Demo Accounts"
  },
  "dashboard": {
    "welcome": "Welcome",
    "systemOverview": "System Overview",
    "branchOperations": "Branch Operations",
    "staffManagement": "Staff Management",
    "securityAi": "Security & AI",
    "branchOverview": "Branch Overview",
    "staffOperations": "Staff Operations",
    "compliance": "Compliance",
    "systemLogs": "System Logs",
    "aiThreatEngine": "AI Threat Engine",
    "newTransaction": "New Transaction",
    "transactionHistory": "Transaction History",
    "accounts": "Accounts",
    "transfers": "Transfers"
  }
}

hi_data = {
  "login": {
    "signInTitle": "अपने खाते में साइन इन करें",
    "applyTitle": "खाते के लिए आवेदन करें (KYC)",
    "subtitle": "सुरक्षित सरकारी बैंकिंग पोर्टल",
    "loginTab": "लॉगिन",
    "applyTab": "खाते के लिए आवेदन",
    "username": "उपयोगकर्ता नाम",
    "usernamePlaceholder": "अपना उपयोगकर्ता नाम दर्ज करें",
    "password": "पासवर्ड",
    "fullName": "पूरा नाम",
    "fullNamePlaceholder": "जॉन डो",
    "aadhaar": "आधार नंबर",
    "mobile": "मोबाइल नंबर",
    "email": "ईमेल आईडी",
    "branch": "पसंदीदा शाखा",
    "selectBranch": "-- एक शाखा चुनें --",
    "remember": "मुझे याद रखें",
    "forgot": "पासवर्ड भूल गए?",
    "signInBtn": "साइन इन करें",
    "submitKyc": "KYC आवेदन जमा करें",
    "demo": "डेमो खाते"
  },
  "dashboard": {
    "welcome": "स्वागत है",
    "systemOverview": "सिस्टम अवलोकन",
    "branchOperations": "शाखा संचालन",
    "staffManagement": "कर्मचारी प्रबंधन",
    "securityAi": "सुरक्षा और एआई",
    "branchOverview": "शाखा अवलोकन",
    "staffOperations": "कर्मचारी संचालन",
    "compliance": "अनुपालन",
    "systemLogs": "सिस्टम लॉग",
    "aiThreatEngine": "एआई खतरा इंजन",
    "newTransaction": "नया लेनदेन",
    "transactionHistory": "लेनदेन का इतिहास",
    "accounts": "खाते",
    "transfers": "स्थानान्तरण"
  }
}

mr_data = {
  "login": {
    "signInTitle": "आपल्या खात्यात साइन इन करा",
    "applyTitle": "खात्यासाठी अर्ज करा (KYC)",
    "subtitle": "सुरक्षित सरकारी बँकिंग पोर्टल",
    "loginTab": "लॉगिन",
    "applyTab": "खात्यासाठी अर्ज",
    "username": "वापरकर्ता नाव",
    "usernamePlaceholder": "आपले वापरकर्ता नाव प्रविष्ट करा",
    "password": "पासवर्ड",
    "fullName": "पूर्ण नाव",
    "fullNamePlaceholder": "जॉन डो",
    "aadhaar": "आधार क्रमांक",
    "mobile": "मोबाईल क्रमांक",
    "email": "ईमेल आयडी",
    "branch": "पसंतीची शाखा",
    "selectBranch": "-- एक शाखा निवडा --",
    "remember": "मला लक्षात ठेवा",
    "forgot": "पासवर्ड विसरलात?",
    "signInBtn": "साइन इन करा",
    "submitKyc": "KYC अर्ज सबमिट करा",
    "demo": "डेमो खाती"
  },
  "dashboard": {
    "welcome": "स्वागत आहे",
    "systemOverview": "सिस्टम विहंगावलोकन",
    "branchOperations": "शाखा ऑपरेशन्स",
    "staffManagement": "कर्मचारी व्यवस्थापन",
    "securityAi": "सुरक्षा आणि एआय",
    "branchOverview": "शाखा विहंगावलोकन",
    "staffOperations": "कर्मचारी ऑपरेशन्स",
    "compliance": "अनुपालन",
    "systemLogs": "सिस्टम लॉग",
    "aiThreatEngine": "एआय धोका इंजिन",
    "newTransaction": "नवीन व्यवहार",
    "transactionHistory": "व्यवहाराचा इतिहास",
    "accounts": "खाती",
    "transfers": "हस्तांतरणे"
  }
}

update_json('src/i18n/locales/en.json', en_data)
update_json('src/i18n/locales/hi.json', hi_data)
update_json('src/i18n/locales/mr.json', mr_data)

print("Patching complete!")
