import axios from 'axios';

export async function getJson(url, opts = {}) {
  const res = await axios.get(url, { timeout: 30000, ...opts });
  return res.data;
}

export async function postJson(url, body = {}, opts = {}) {
  const res = await axios.post(url, body, { timeout: 45000, ...opts });
  return res.data;
}
