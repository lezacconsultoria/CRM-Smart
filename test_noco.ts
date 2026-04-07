import { nocoService } from './src/services/nocoService.js';

async function test() {
    try {
        const user = await nocoService.loginUser('admin1@lezac.com', 'password');
        console.log("Logged in user:", user);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
