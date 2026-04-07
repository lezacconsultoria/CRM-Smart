const axios = require('axios');

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const EMAIL = 'lezacconsultoria@gmail.com';
const PASSWORD = 'Gualeguay2025##';
const BASE_ID = 'pwqcmbzgrz73kd1';

// Contactos: m7t44xu1kj6xal8
// Usuarios: m7itnn4o516xej9

async function run() {
  try {
    const authRes = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, { email: EMAIL, password: PASSWORD });
    const headers = { 'xc-auth': authRes.data.token };
    
    // Create BelongsTo (bt) relation on Contactos pointing to Usuarios
    const payload = {
      title: "Usuario_Asignado",
      column_name: "Usuario_Asignado",
      fk_related_model_id: "m7itnn4o516xej9",
      uidt: "LinkToAnotherRecord",
      type: "LinkToAnotherRecord",
      relation_type: "bt"
    };

    console.log("Creating relations...");
    const res = await axios.post(`${NOCODB_URL}/api/v1/db/meta/tables/m7t44xu1kj6xal8/columns`, payload, { headers });
    console.log("Success!", res.data);
  } catch(e) { 
      console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message); 
  }
}
run();
