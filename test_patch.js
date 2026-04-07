import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Testing PATCH using v1 API with table ID
    try {
      // Trying bulk update
      const res2 = await axios.patch('https://nocodb.lezacconsultoria.com/api/v1/db/data/bulk/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8', [{
        Id: 1,
        'Nombre': 'Testing 2 Edit'
      }], {
        headers: { 'xc-auth': token }
      });
      console.log('PATCH bulk v1 success', res2.data);
    } catch(err2) {
      console.error('PATCH bulk v1 error:', err2.response?.status, err2.response?.data);
    }

    try {
      // Trying single update
      const res3 = await axios.patch('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8/1', {
        'Nombre': 'Testing 2 Edit Single'
      }, {
        headers: { 'xc-auth': token }
      });
      console.log('PATCH single v1 success', res3.data);
    } catch(err3) {
      console.error('PATCH single v1 error:', err3.response?.status, err3.response?.data);
    }
    
    try {
      // Trying the one in code
      const res4 = await axios.patch('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8', [{
        Id: 1,
        'Nombre': 'Testing 2 Edit Wrong'
      }], {
        headers: { 'xc-auth': token }
      });
      console.log('PATCH old code success', res4.data);
    } catch(err4) {
      console.error('PATCH old code error:', err4.response?.status, err4.response?.data);
    }

  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
