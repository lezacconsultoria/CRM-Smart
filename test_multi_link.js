import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Create Task A
    const resA = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
      'Titulo': 'Task A',
      'Fecha Limite': '2026-04-05'
    }, { headers: { 'xc-auth': token } });
    
    // Create Task B
    const resB = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
      'Titulo': 'Task B',
      'Fecha Limite': '2026-04-06'
    }, { headers: { 'xc-auth': token } });
    
    console.log('Task A:', resA.data.Id, 'Task B:', resB.data.Id);
    
    // Link both to Contact 1
    await axios.post(`https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69/${resA.data.Id}/hm/Contacto Relacionado/1`, {}, { headers: { 'xc-auth': token } });
    await axios.post(`https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69/${resB.data.Id}/hm/Contacto Relacionado/1`, {}, { headers: { 'xc-auth': token } });
    
    // Check Contact 1's Tareas_id
    const resC = await axios.get(`https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m7t44xu1kj6xal8/1`, { headers: { 'xc-auth': token } });
    console.log('Contact 1 Tareas_id:', resC.data.Tareas_id);
    
  } catch (err) {
    console.error('Error:', err.message, err.response?.data);
  }
}
test();
