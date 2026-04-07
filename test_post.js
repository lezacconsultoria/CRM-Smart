import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Testing POST using v1 API with table ID
    try {
      const res2 = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8', {
        'Nombre': 'Testing 2',
        'Apellido': 'API'
      }, {
        headers: { 'xc-auth': token }
      });
      console.log('Created record ID', res2.data.Id);
    } catch(err2) {
      console.error('Create error:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
