const axios = require('axios');

async function test() {
  const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
  try {
    console.log('Testing connection to NocoDB...');
    const res = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    console.log('Success! Token received:', res.data.token.substring(0, 10) + '...');
  } catch (e) {
    console.error('Connection failed!');
    console.error('Code:', e.code);
    console.error('Message:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', e.response.data);
    }
  }
}

test();
