import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Testing GET using v2 API
    try {
      const res2 = await axios.get('https://nocodb.lezacconsultoria.com/api/v2/tables/m7t44xu1kj6xal8/records', {
        headers: { 'xc-auth': token }
      });
      console.log('GET success, count v2:', res2.data.list.length);
    } catch(err2) {
      console.error('GET error v2:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
