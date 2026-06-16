const axios = require('axios');

const API = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3001',
  withCredentials: true
});

// Pass session cookie from browser through to backend
function client(req) {
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3001',
    headers: { Cookie: req.headers.cookie || '' },
    withCredentials: true
  });
}

module.exports = { API, client };
