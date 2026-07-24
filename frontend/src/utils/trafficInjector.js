import { 
  login, 
  fetchAccounts, 
  submitTransfer, 
  approveTransaction, 
  applyKyc, 
  fetchAiAlerts, 
  fetchAuditLogs, 
  fetchAdminStaff, 
  containAlert 
} from '../api/client';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const injectTellerLow = async () => {
  try {
    const cTokResp = await login("customer", "password");
    const accounts = await fetchAccounts(cTokResp.token);
    if (!accounts || accounts.length === 0) return;
    const src = accounts[0].accountNumber;
    const dst = accounts.length > 1 ? accounts[1].accountNumber : src;

    const tTokResp = await login("teller", "password");
    const tTok = tTokResp.token;

    for (let i = 0; i < 15; i++) {
      submitTransfer(tTok, { sourceAccountNumber: src, destAccountNumber: dst, amount: 20 + i }).catch(() => {});
      await sleep(50);
    }
  } catch (e) {
    console.error("Injection failed:", e);
  }
};

export const injectManagerLow = async () => {
  try {
    const mTokResp = await login("branch_manager", "password");
    const mTok = mTokResp.token;

    for (let i = 0; i < 8; i++) {
      approveTransaction(mTok, 1).catch(() => {});
      approveTransaction(mTok, 2).catch(() => {});
      await sleep(50);
    }
  } catch (e) {
    console.error("Injection failed:", e);
  }
};

export const injectTellerMed = async () => {
  try {
    const tTokResp = await login("teller", "password");
    const tTok = tTokResp.token;

    for (let i = 0; i < 10; i++) {
      const data = {
        fullName: `Test User ${Math.floor(Math.random() * 9000) + 1000}`,
        email: `test${Math.floor(Math.random() * 999) + 1}@example.com`,
        aadhaarNumber: `${Math.floor(Math.random() * 899999999999) + 100000000000}`,
        mobileNumber: `9${Math.floor(Math.random() * 899999999) + 100000000}`
      };
      applyKyc(tTok, 1, data).catch(() => {});
      await sleep(50);
    }
  } catch (e) {
    console.error("Injection failed:", e);
  }
};

export const injectManagerMed = async () => {
  try {
    const cTokResp = await login("customer", "password");
    const accounts = await fetchAccounts(cTokResp.token);
    if (!accounts || accounts.length === 0) return;
    const src = accounts[0].accountNumber;
    const dst = accounts.length > 1 ? accounts[1].accountNumber : src;

    const mTokResp = await login("branch_manager", "password");
    await submitTransfer(mTokResp.token, { sourceAccountNumber: src, destAccountNumber: dst, amount: 1000000 }).catch(() => {});
  } catch (e) {
    console.error("Injection failed:", e);
  }
};

export const injectTellerHigh = async () => {
  try {
    const tTokResp = await login("teller", "password");
    const tTok = tTokResp.token;

    fetchAdminStaff(tTok).catch(() => {});
    await sleep(100);
    fetchAuditLogs(tTok).catch(() => {});
    await sleep(100);
    fetchAiAlerts(tTok).catch(() => {});
    await sleep(100);
    containAlert(tTok, 1).catch(() => {});
    await sleep(100);
    fetchAdminStaff(tTok).catch(() => {});
  } catch (e) {
    console.error("Injection failed:", e);
  }
};

export const injectManagerHigh = async () => {
  try {
    const mTokResp = await login("branch_manager", "password");
    const mTok = mTokResp.token;

    for (let i = 0; i < 5; i++) {
      containAlert(mTok, 1).catch(() => {});
      await sleep(100);
    }
  } catch (e) {
    console.error("Injection failed:", e);
  }
};
