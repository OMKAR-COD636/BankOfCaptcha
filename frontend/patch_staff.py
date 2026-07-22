import json

def patch_file(file_path, replacements):
    with open(file_path, 'r') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(file_path, 'w') as f:
        f.write(content)

patch_file('src/components/superadmin/StaffManagementTab.jsx', [
    ("> Create New Staff", "> {t('dashboard.createNewStaff')}"),
    ('placeholder="Username"', 'placeholder={t("dashboard.username")}'),
    ('placeholder="Password"', 'placeholder={t("dashboard.password")}'),
    (">Teller<", ">{t('dashboard.roleTeller')}<"),
    (">Branch Manager<", ">{t('dashboard.roleBranchManager')}<"),
    (">Select Branch<", ">{t('dashboard.selectBranch')}<"),
    (">Create Staff<", ">{t('dashboard.createStaffBtn')}<"),
    ("> Assign Staff to Branch", "> {t('dashboard.assignStaff')}"),
    (">Select Staff Member<", ">{t('dashboard.selectStaffMember')}<"),
    (">Assign Staff<", ">{t('dashboard.assignStaffBtn')}<"),
    (">None<", ">{t('dashboard.none')}<")
])

patch_file('src/components/superadmin/BranchOperationsTab.jsx', [
    ("> Create New Branch", "> {t('dashboard.createNewBranch')}"),
    ('placeholder="Branch Name (e.g. South End)"', 'placeholder={t("dashboard.branchNamePlaceholder")}'),
    ('placeholder="Location (e.g. Mumbai)"', 'placeholder={t("dashboard.branchLocationPlaceholder")}'),
    (">Create Branch<", ">{t('dashboard.createBranchBtn')}<")
])

def update_json(path, data):
    with open(path, 'r') as f:
        current = json.load(f)
    current['dashboard'].update(data)
    with open(path, 'w') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

en = {
    "createNewStaff": "Create New Staff",
    "createStaffBtn": "Create Staff",
    "assignStaff": "Assign Staff to Branch",
    "selectStaffMember": "Select Staff Member",
    "assignStaffBtn": "Assign Staff",
    "none": "None",
    "branchNamePlaceholder": "Branch Name (e.g. South End)",
    "branchLocationPlaceholder": "Location (e.g. Mumbai)",
    "createBranchBtn": "Create Branch"
}

hi = {
    "createNewStaff": "नया कर्मचारी बनाएं",
    "createStaffBtn": "कर्मचारी बनाएं",
    "assignStaff": "शाखा में कर्मचारी नियुक्त करें",
    "selectStaffMember": "कर्मचारी चुनें",
    "assignStaffBtn": "कर्मचारी नियुक्त करें",
    "none": "कोई नहीं",
    "branchNamePlaceholder": "शाखा का नाम (उदा. साउथ एंड)",
    "branchLocationPlaceholder": "स्थान (उदा. मुंबई)",
    "createBranchBtn": "शाखा बनाएं"
}

mr = {
    "createNewStaff": "नवीन कर्मचारी तयार करा",
    "createStaffBtn": "कर्मचारी तयार करा",
    "assignStaff": "शाखेत कर्मचारी नियुक्त करा",
    "selectStaffMember": "कर्मचारी निवडा",
    "assignStaffBtn": "कर्मचारी नियुक्त करा",
    "none": "काहीही नाही",
    "branchNamePlaceholder": "शाखेचे नाव (उदा. साऊथ एंड)",
    "branchLocationPlaceholder": "स्थान (उदा. मुंबई)",
    "createBranchBtn": "शाखा तयार करा"
}

update_json('src/i18n/locales/en.json', en)
update_json('src/i18n/locales/hi.json', hi)
update_json('src/i18n/locales/mr.json', mr)

print("Staff & Branch components patched successfully!")
