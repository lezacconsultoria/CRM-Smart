const axios = require('axios');

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const BASE_ID = 'pwqcmbzgrz73kd1';
const TABLE_ID = 'm7t44xu1kj6xal8';

async function run() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = loginRes.data.token;
    console.log('Logged in successfully.');

    const headers = {
      'xc-auth': token,
      'Content-Type': 'application/json'
    };

    const columns = [
      { title: 'ids_origen', uidt: 'SingleLineText' },
      { title: 'Actividad', uidt: 'SingleLineText' },
      { title: 'Email válido', uidt: 'Checkbox' }
    ];

    for (const col of columns) {
      console.log(`Creating column: ${col.title}...`);
      try {
        // Try v1 first as it's what the app uses for auth
        await axios.post(`${NOCODB_URL}/api/v1/db/meta/tables/${TABLE_ID}/columns`, col, { headers });
        console.log(`Column ${col.title} created.`);
      } catch (e) {
        if (e.response && e.response.status === 404) {
             // Try v2 meta if v1 fails
             console.log('v1 failed with 404, trying v2 meta...');
             await axios.post(`${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}/columns`, col, { 
                headers: { 'xc-auth': token, 'Content-Type': 'application/json' } 
             });
             console.log(`Column ${col.title} created via v2.`);
        } else {
            console.error(`Failed to create ${col.title}:`, e.response ? e.response.data : e.message);
        }
      }
    }

  } catch (e) {
    console.error('Fatal error:', e.response ? e.response.data : e.message);
  }
}

run();
