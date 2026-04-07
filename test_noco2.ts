import { nocoService } from './src/services/nocoService.js';
import axios from 'axios';

async function test() {
    try {
        await nocoService.masterLogin();
        const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
        const BASE_ID = 'pwqcmbzgrz73kd1';
        
        // Let's call loginUser with wrong password to see what happens
        const u = await nocoService.loginUser("admin1@lezac.com", "wrong");
        console.log("Returned:", u);

        const res = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
          email: 'lezacconsultoria@gmail.com',
          password: 'Gualeguay2025##'
        });
        const ADMIN_TOKEN = res.data.token;
        const res2 = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
            headers: { 'xc-auth': ADMIN_TOKEN }
        });
        
        console.log("Users:", res2.data.list);

    } catch(e) {
        console.error("Error:", Object.keys(e));
    }
}
test();
