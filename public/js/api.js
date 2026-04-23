const API_BASE = '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Server trả về dữ liệu không hợp lệ.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Yêu cầu thất bại.');
  }

  return data;
}

export function getChain() {
  return request('/chain');
}

export function getPendingTransactions() {
  return request('/pending');
}

export function getBalance(address) {
  return request(`/balance/${encodeURIComponent(address)}`);
}

export function getDifficulty() {
  return request('/difficulty');
}

export function validateChain() {
  return request('/is-valid');
}

export function addTransaction(payload) {
  return request('/add-transaction', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function mineBlock(minerAddress) {
  return request('/mine', {
    method: 'POST',
    body: JSON.stringify({ minerAddress })
  });
}

export function tamperBlock(index, newData) {
  return request(`/tamper/${index}`, {
    method: 'POST',
    body: JSON.stringify({ newData })
  });
}

export function resetChain() {
  return request('/reset', {
    method: 'POST'
  });
}
export function registerNode(nodeUrl) {
  return request('/register-node', {
    method: 'POST',
    body: JSON.stringify({ nodeUrl })
  });
}

export function resolveConflicts() {
  return request('/resolve-conflicts');
}
