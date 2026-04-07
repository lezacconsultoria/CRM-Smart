import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://nocodb.lezacconsultoria.com/api/v1/auth/user/signin', {
      email: 'lezacconsultoria@gmail.com',
      password: 'Gualeguay2025##'
    });
    const token = res.data.token;
    
    // Add TasksJSON
    try {
      await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/meta/tables/m7t44xu1kj6xal8/columns', {
        column_name: 'TasksJSON',
        title: 'TasksJSON',
        dt: 'longtext',
        uidt: 'LongText'
      }, { headers: { 'xc-auth': token } });
      console.log('Added TasksJSON');
    } catch(e) { console.error('Add TasksJSON err', e.response?.data); }
    
    // Add StagesJSON
    try {
      await axios.post('https://nocodb.lezacconsultoria.com/api/v1/db/meta/tables/m7t44xu1kj6xal8/columns', {
        column_name: 'StagesJSON',
        title: 'StagesJSON',
        dt: 'longtext',
        uidt: 'LongText'
      }, { headers: { 'xc-auth': token } });
      console.log('Added StagesJSON');
    } catch(e) { console.error('Add StagesJSON err', e.response?.data); }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
