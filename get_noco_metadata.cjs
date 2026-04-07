const axios = require('axios');

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const EMAIL = 'lezacconsultoria@gmail.com';
const PASSWORD = 'Gualeguay2025##';
const BASE_ID = 'pwqcmbzgrz73kd1';

async function run() {
  try {
    const authRes = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, { email: EMAIL, password: PASSWORD });
    const headers = { 'xc-auth': authRes.data.token };
    
    const colsRes = await axios.get(`${NOCODB_URL}/api/v1/db/meta/tables/m7t44xu1kj6xal8/columns`, { headers });
    
    console.log("=== COLUMNS FOR CONTACTOS ===");
    for (const c of colsRes.data.list) {
        console.log(`- ${c.title} -> Name: ${c.column_name}, Type: ${c.uidt}`);
    }
  } catch(e) { console.error(e.message); }
}
run();
