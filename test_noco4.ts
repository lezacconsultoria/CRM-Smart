import { nocoService } from './src/services/nocoService.js';

async function test() {
    try {
        const user = await nocoService.loginUser("arrativelfacundo1@gmail.com", "123");
        console.log("Returned:", user);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
