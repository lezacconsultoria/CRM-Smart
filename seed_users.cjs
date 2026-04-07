const axios = require('axios');

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const EMAIL = 'lezacconsultoria@gmail.com';
const PASSWORD = 'Gualeguay2025##';
const BASE_ID = 'pwqcmbzgrz73kd1';

// Definición de los usuarios a insertar
const USERS_TO_ADD = [
  { Nombre: 'Admin 1', Email: 'admin1@lezac.com', Password: 'password123', Rol: 'admin' },
  { Nombre: 'Admin 2', Email: 'admin2@lezac.com', Password: 'password123', Rol: 'admin' },
  { Nombre: 'Roberto M.', Email: 'roberto@lezac.com', Password: 'password123', Rol: 'user' }
];

async function run() {
  try {
    console.log('Iniciando sesión en NocoDB...');
    const authRes = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
      email: EMAIL,
      password: PASSWORD
    });
    const token = authRes.data.token;
    console.log('¡Autenticación exitosa!');

    const headers = { 'xc-auth': token };

    // 1. Crear la tabla Usuarios usando el endpoint REST API
    console.log('Creating table: Usuarios...');
    try {
      await axios.post(`${NOCODB_URL}/api/v1/db/meta/projects/${BASE_ID}/tables`, {
        table_name: 'Usuarios',
        title: 'Usuarios',
        columns: [
          { column_name: 'Nombre', title: 'Nombre', uidt: 'SingleLineText' },
          { column_name: 'Email', title: 'Email', uidt: 'Email', pk: true },
          { column_name: 'Password', title: 'Password', uidt: 'SingleLineText' },
          { column_name: 'Rol', title: 'Rol', uidt: 'SingleSelect', 
            colOptions: { 
              options: [
                { title: 'admin', color: '#ff0000' },
                { title: 'user', color: '#0000ff' }
              ] 
            } 
          }
        ]
      }, { headers });
      console.log('Tabla Usuarios creada con éxito.');
    } catch (e) {
      if (e.response && e.response.data && (e.response.data.error === 'ERR_DUPLICATE_IN_ALIAS' || e.response.data.message?.includes('Duplicate'))) {
        console.log('La tabla Usuarios ya existe.');
      } else {
        console.error('Error creando tabla:', JSON.stringify(e.response?.data || e.message, null, 2));
      }
    }

    // 2. Obtener la lista de tablas para encontrar el ID
    const tablesRes = await axios.get(`${NOCODB_URL}/api/v1/db/meta/projects/${BASE_ID}/tables`, { headers });
    const userTable = tablesRes.data.list.find(t => t.title === 'Usuarios' || t.table_name === 'Usuarios');
    
    if (!userTable) {
        throw new Error('No se pudo encontrar la tabla Usuarios.');
    }

    console.log(`Tabla ${userTable.title} ID: ${userTable.id}`);

    // 3. Insertar datos usando el endpoint de datos estandar
    for (const user of USERS_TO_ADD) {
        try {
            await axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/${userTable.id}`, user, { headers });
            console.log(`Usuario ${user.Email} insertado.`);
        } catch (e) {
            console.error(`Error insertando ${user.Email}:`, e.response?.data?.message || e.message);
        }
    }

  } catch (error) {
    console.error('Error general:', error.response?.data || error.message);
  }
}

run();
