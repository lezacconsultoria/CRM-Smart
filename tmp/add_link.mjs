const NOCODB_URL = "https://nocodb.lezacconsultoria.com";
const BASE_ID = "pwqcmbzgrz73kd1";
let NOCODB_TOKEN = "";

async function login() {
  const res = await fetch(`${NOCODB_URL}/api/v1/auth/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lezacconsultoria@gmail.com", password: "Gualeguay2025##" })
  });
  const data = await res.json();
  if (data.token) return data.token;
  throw new Error("Error en login: " + JSON.stringify(data));
}

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "xc-auth": NOCODB_TOKEN,
      "Content-Type": "application/json"
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${NOCODB_URL}/api/v3/meta/bases/pwqcmbzgrz73kd1/tables/m7t44xu1kj6xal8/fields`, options);
  
  if (!res.ok) {
     const txt = await res.text();
     console.error(`Error ${method} ${path}:`, txt);
     return;
  }
  const data = await res.json();
  return data;
}

async function run() {
  try {
    NOCODB_TOKEN = await login();

    const payload = {
      title: "Usuarios_id",
      type: "LinkToAnotherRecord",
      options: {
        related_table_id: "m7itnn4o516xej9",
        relation_type: "bt"
      }
    };
    
    console.log("Creando columna enlace...");
    await api(`columns`, 'POST', payload);
    
  } catch (e) {
    console.error("Excepción fatal:", e);
  }
}
run();
