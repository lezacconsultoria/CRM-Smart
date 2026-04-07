import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Test fetch nested
    try {
      const res3 = await axios.get('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8/1?nested[Tareas]=true', {
        headers: { 'xc-auth': token }
      });
      console.log('Contact 1 with Tareas:', res3.data);
    } catch(err2) {
      console.error('Fetch error:', err2.response?.status, err2.response?.data);
    }
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
