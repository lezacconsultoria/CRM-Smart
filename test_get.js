import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Testing GET
    try {
      const res2 = await axios.get('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/Contactos', {
        headers: { 'xc-auth': token }
      });
      console.log('GET success, count:', res2.data.list.length);
    } catch(err2) {
      console.error('GET error:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
