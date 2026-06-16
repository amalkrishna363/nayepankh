require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_KEY  = process.env.API_KEY  || 'vms_live_demo0000';

// For all calls — always attaches API key
function client(req) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'X-Api-Key': API_KEY,
      'Cookie': req ? (req.headers.cookie || '') : ''
    },
    withCredentials: true
  });
}

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'X-Api-Key': API_KEY }
});

module.exports = { API, client };
