import axios from 'axios';
import { nocoService } from './src/services/nocoService.js';

async function test() {
    try {
        await nocoService.masterLogin();
        // let's just query m7itnn4o516xej9 without where
        const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
        const BASE_ID = 'pwqcmbzgrz73kd1';
        
        const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
            headers: { 'xc-auth': (nocoService as any).ADMIN_TOKEN },
            params: {
                where: `(Email,eq,arrativelfacundo1@gmail.com)`
            }
        });
        
        console.log("Response no quote:", res.data.list.length);

        const res2 = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
            headers: { 'xc-auth': (nocoService as any).ADMIN_TOKEN },
            params: {
                where: `(Email,eq,'arrativelfacundo1@gmail.com')`
            }
        });
        
        console.log("Response single quote:", res2.data.list.length);
        
        const res3 = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
            headers: { 'xc-auth': (nocoService as any).ADMIN_TOKEN },
            params: {
                where: `(Email,eq,arrativelfacundo1@gmail.com)~and(Password,eq,123)`
            }
        });
        
        console.log("Response multiple no quote:", res3.data.list.length);
    } catch(e) {
        console.error("Error:", e.response?.data || e.message);
    }
}
test();
