import axios from 'axios';

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

    // Note: for Meta API, sometimes xc-token (API Token) is preferred, 
    // but xc-auth (User JWT) should work if the user is super-admin.
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
        // According to NocoDB docs, for Meta API it's usually /api/v2/meta/
        await axios.post(`${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}/columns`, col, { headers });
        console.log(`Column ${col.title} created.`);
      } catch (e) {
        if (e.response) {
            console.error(`Failed to create ${col.title}:`, JSON.stringify(e.response.data));
        } else {
            console.error(`Failed to create ${col.title}:`, e.message);
        }
      }
    }

  } catch (e) {
    console.error('Fatal error:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

run();
