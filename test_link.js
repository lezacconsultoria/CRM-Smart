import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Create a Tarea
    const res2 = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69', {
      'Titulo': 'Link Test Task',
      'Fecha Limite': '2026-04-05',
      'Completada': false
    }, { headers: { 'xc-auth': token } });
    
    const taskId = res2.data.Id;
    console.log('Task created', taskId);
    
    // Link Tarea to Contacto 1
    // POST /api/v1/db/data/noco/{projectId}/{tableId}/{recordId}/{relationType}/{columnName}/{relatedRecordId}
    // Relation type for Has Many is 'hm' or 'mm'. Column name is 'Contacto Relacionado'
    try {
      await axios.post(`https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69/${taskId}/hm/Contacto Relacionado/1`, {}, {
        headers: { 'xc-auth': token }
      });
      console.log('Linked successfully');
      
      // Now let's try to fetch tasks and see if we can get the related contacts
      const res3 = await axios.get(`https://nocodb.lezacconsultoria.com/api/v1/db/data/noco/pwqcmbzgrz73kd1/m8q1qw7saff4m69/${taskId}/hm/Contacto Relacionado`, {
        headers: { 'xc-auth': token }
      });
      console.log('Related contacts length:', res3.data.pageInfo?.totalRows);
      
    } catch(errLink) {
      console.error('Link Error:', errLink.response?.status, errLink.response?.data);
    }
    
  } catch (err) {
    console.error('Login error:', err.message);
  }
}
test();
