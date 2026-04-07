import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Testing POST to Tareas table to create a task for Contact 1
    try {
      const res2 = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
        'Titulo': 'Call with client',
        'Fecha Limite': '2026-04-05',
        'Completada': false,
        'Contactos_id': 1
      }, {
        headers: { 'xc-auth': token }
      });
      console.log('Created task ID', res2.data.Id);
      
      const res3 = await axios.get('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
        headers: { 'xc-auth': token },
        params: { limit: 5 }
      });
      console.log('Tareas schema:', res3.data.list[0]);
    } catch(err2) {
      console.error('Create error:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
