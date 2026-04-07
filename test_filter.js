import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    try {
      // test filtering Tareas by related contact ID (1)
      const res3 = await axios.get('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
        headers: { 'xc-auth': token },
        params: { where: '(Contacto Relacionado,eq,1)' }
      });
      console.log('Tareas related to 1:', res3.data.pageInfo.totalRows);
    } catch(err2) {
      console.error('Fetch error:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
