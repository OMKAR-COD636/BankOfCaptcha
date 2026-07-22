import os
import json
import re

def fix_file(file_path, replacements, inject_t=False, hook_regex=None, hook_replace=None):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r') as f:
        content = f.read()

    if inject_t:
        if 'useTranslation' not in content:
            lines = content.split('\n')
            idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    idx = i
            # For AiModelTab and AccountsTable, they are one level deeper from i18n
            # actually AiModelTab is in src/components/dashboard, so ../../i18n/LanguageContext
            # AccountsTable is in src/components/shared, so ../../i18n/LanguageContext
            lines.insert(idx + 1, "import { useTranslation } from '../../i18n/LanguageContext';")
            content = '\n'.join(lines)
        
        if 'const { t } = useTranslation();' not in content and hook_regex:
            content = re.sub(hook_regex, hook_replace, content, count=1)
            
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

fix_file('src/pages/dashboards/TellerDashboard.jsx', [
    ("> Staff Dashboard", "> {t('dashboard.staffDashboard')}"),
], inject_t=False)

fix_file('src/components/shared/AccountsTable.jsx', [
    (">Customer Accounts Directory<", ">{t('dashboard.customerAccountsDir')}<"),
    (">Account Number<", ">{t('dashboard.accountNumber')}<"),
    (">Owner ID<", ">{t('dashboard.ownerId')}<"),
    (">Balance<", ">{t('dashboard.balance')}<"),
    ("No accounts accessible or access denied.", "{t('dashboard.noAccounts')}")
], inject_t=True, hook_regex=r'(const AccountsTable = \(\{ accounts \}\) => \{)', hook_replace=r'\1\n  const { t } = useTranslation();')

fix_file('src/pages/dashboards/ItAdminDashboard.jsx', [
    (">AI Model &amp; Training<", ">{t('dashboard.aiModelTraining')}<")
], inject_t=False)

fix_file('src/components/dashboard/AiModelTab.jsx', [
    ("> AI Model & Training<", "> {t('dashboard.aiModelTraining')}<"),
    (">Model Description<", ">{t('dashboard.modelDescription')}<"),
    (">Architecture:<", ">{t('dashboard.architecture')}:<"),
    (">Version:<", ">{t('dashboard.version')}:<"),
    ("The AI engine continuously monitors user behavior", "{t('dashboard.modelDescText')}"),
    ("Overall Detection Rate", "{t('dashboard.overallDetectionRate')}"),
    ("Validation Loss (MSE)", "{t('dashboard.validationLoss')}"),
    ("Dynamic Threshold", "{t('dashboard.dynamicThreshold')}"),
    (">Adaptive Training<", ">{t('dashboard.adaptiveTraining')}<"),
    ("Status:", "{t('dashboard.status')}:"),
    ("Triggering adaptive training will fetch alerts", "{t('dashboard.triggerTrainingText')}"),
    (">Training Requested...<", ">{t('dashboard.trainingRequested')}<"),
    (">Trigger Adaptive Training<", ">{t('dashboard.triggerAdaptiveTraining')}<")
], inject_t=True, hook_regex=r'(const AiModelTab = \(\{ aiMetrics, triggerAdaptiveTraining \}\) => \{)', hook_replace=r'\1\n  const { t } = useTranslation();')

def update_json(path, data):
    with open(path, 'r') as f:
        current = json.load(f)
    current['dashboard'].update(data)
    with open(path, 'w') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

en = {
    "customerAccountsDir": "Customer Accounts Directory",
    "accountNumber": "Account Number",
    "ownerId": "Owner ID",
    "balance": "Balance",
    "noAccounts": "No accounts accessible or access denied.",
    "aiModelTraining": "AI Model & Training",
    "modelDescription": "Model Description",
    "architecture": "Architecture",
    "version": "Version",
    "modelDescText": "The AI engine continuously monitors user behavior and reconstructs embeddings using an LSTM Autoencoder. It is designed to detect Temporal Anomalies, Role-Action Violations, Statistical Transaction Bursts, and Behavioral Sequence Anomalies.",
    "overallDetectionRate": "Overall Detection Rate",
    "validationLoss": "Validation Loss (MSE)",
    "dynamicThreshold": "Dynamic Threshold",
    "adaptiveTraining": "Adaptive Training",
    "triggerTrainingText": "Triggering adaptive training will fetch alerts marked as False Positives and incorporate them into the model to prevent future false alarms.",
    "trainingRequested": "Training Requested...",
    "triggerAdaptiveTraining": "Trigger Adaptive Training"
}

hi = {
    "customerAccountsDir": "ग्राहक खाता निर्देशिका",
    "accountNumber": "खाता संख्या",
    "ownerId": "स्वामी आईडी",
    "balance": "बैलेंस",
    "noAccounts": "कोई खाता उपलब्ध नहीं है या पहुंच से वंचित किया गया है।",
    "aiModelTraining": "एआई मॉडल और प्रशिक्षण",
    "modelDescription": "मॉडल विवरण",
    "architecture": "वास्तुकला",
    "version": "संस्करण",
    "modelDescText": "एआई इंजन लगातार उपयोगकर्ता के व्यवहार की निगरानी करता है और एलएसटीएम ऑटोरएनकोडर का उपयोग करके एम्बेडिंग का पुनर्निर्माण करता है। यह समय संबंधी विसंगतियों, भूमिका-कार्रवाई उल्लंघन, सांख्यिकीय लेनदेन वृद्धि और व्यवहार अनुक्रम विसंगतियों का पता लगाने के लिए डिज़ाइन किया गया है।",
    "overallDetectionRate": "कुल मिलाकर पहचान दर",
    "validationLoss": "सत्यापन हानि (MSE)",
    "dynamicThreshold": "गतिशील सीमा (Threshold)",
    "adaptiveTraining": "अनुकूली प्रशिक्षण (Adaptive Training)",
    "triggerTrainingText": "अनुकूली प्रशिक्षण को ट्रिगर करने से फॉल्स पॉजिटिव के रूप में चिह्नित अलर्ट प्राप्त होंगे और भविष्य में गलत अलार्म को रोकने के लिए उन्हें मॉडल में शामिल किया जाएगा।",
    "trainingRequested": "प्रशिक्षण का अनुरोध किया गया...",
    "triggerAdaptiveTraining": "अनुकूली प्रशिक्षण ट्रिगर करें"
}

mr = {
    "customerAccountsDir": "ग्राहक खाते निर्देशिका",
    "accountNumber": "खाते क्रमांक",
    "ownerId": "मालक आयडी",
    "balance": "शिल्लक",
    "noAccounts": "कोणतेही खाते उपलब्ध नाही किंवा प्रवेश नाकारला आहे.",
    "aiModelTraining": "एआय मॉडेल आणि प्रशिक्षण",
    "modelDescription": "मॉडेल वर्णन",
    "architecture": "वास्तुकला",
    "version": "आवृत्ती",
    "modelDescText": "एआय इंजिन सतत वापरकर्त्याच्या वर्तनाचे निरीक्षण करते आणि एलएसटीएम ऑटोरएनकोडर वापरून एम्बेडिंगची पुनर्रचना करते. हे वेळेशी संबंधित विसंगती, भूमिका-कृती उल्लंघन, सांख्यिकीय व्यवहार वाढ आणि वर्तन अनुक्रम विसंगती शोधण्यासाठी डिझाइन केलेले आहे.",
    "overallDetectionRate": "एकूण शोध दर",
    "validationLoss": "प्रमाणीकरण तोटा (MSE)",
    "dynamicThreshold": "डायनॅमिक थ्रेशोल्ड",
    "adaptiveTraining": "अनुकूल प्रशिक्षण (Adaptive Training)",
    "triggerTrainingText": "अडॅप्टिव्ह ट्रेनिंग ट्रिगर केल्याने फॉल्स पॉझिटिव्ह म्हणून चिन्हांकित केलेले अलर्ट मिळतील आणि भविष्यातील खोटे अलार्म टाळण्यासाठी त्यांना मॉडेलमध्ये समाविष्ट केले जाईल.",
    "trainingRequested": "प्रशिक्षणाची विनंती केली...",
    "triggerAdaptiveTraining": "अडॅप्टिव्ह ट्रेनिंग ट्रिगर करा"
}

update_json('src/i18n/locales/en.json', en)
update_json('src/i18n/locales/hi.json', hi)
update_json('src/i18n/locales/mr.json', mr)

print("Teller and IT Admin successfully patched")
