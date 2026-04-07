const NOCODB_URL = "https://nocodb.lezacconsultoria.com";
const BASE_ID = "pwqcmbzgrz73kd1";

let NOCODB_TOKEN = "";

async function login() {
  console.log("Iniciando sesión en NocoDB...");
  const res = await fetch(`${NOCODB_URL}/api/v1/auth/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lezacconsultoria@gmail.com", password: "Gualeguay2025##" })
  });
  const data = await res.json();
  if (data.token) {
    console.log("¡Autenticación exitosa!");
    return data.token;
  }
  throw new Error("Error en login: " + JSON.stringify(data));
}

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "xc-auth": NOCODB_TOKEN,
      "xc-token": NOCODB_TOKEN,
      "Content-Type": "application/json"
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${NOCODB_URL}/api/v3/${path}`, options);
  
  let data;
  try {
     data = await res.json();
  } catch(e) { /* empty */ }
  
  if (!res.ok) {
    console.error(`Error ${method} ${path}:`, data || res.statusText);
  }
  return data;
}

async function run() {
  try {
    NOCODB_TOKEN = await login();

    // CONTACTOS
    console.log("Creando tabla: Contactos...");
    const contactos = await api(`meta/bases/${BASE_ID}/tables`, 'POST', { title: "Contactos" });
    const tContactos = contactos?.id;
    if (!tContactos) {
      console.log("No se pudo crear la tabla Contactos. ¿Quizás ya existe?");
      return;
    }

    const fieldsContactos = [
      { title: "Fecha importado", type: "Date" },
      { title: "Nombre", type: "SingleLineText" },
      { title: "Apellido", type: "SingleLineText" },
      { title: "Empresa", type: "SingleLineText" },
      { title: "Tipo de empresa", type: "SingleLineText" },
      { title: "Cargo", type: "SingleLineText" },
      { title: "Link de perfil", type: "URL" },
      { title: "Correo Electronico", type: "Email" },
      { title: "Telefono", type: "SingleLineText" },
      { title: "Provincia", type: "SingleLineText" },
      { title: "Pais", type: "SingleLineText" },
      { title: "Origen DB", type: "SingleLineText" },
      { title: "Asignado", type: "SingleLineText" }
    ];
    for (let f of fieldsContactos) {
      console.log(` -> Campo: ${f.title}`);
      await api(`meta/bases/${BASE_ID}/tables/${tContactos}/fields`, 'POST', f);
    }

    // TAREAS
    console.log("Creando tabla: Tareas...");
    const tareas = await api(`meta/bases/${BASE_ID}/tables`, 'POST', { title: "Tareas" });
    const tTareas = tareas?.id;
    const fieldsTareas = [
      { title: "Titulo", type: "SingleLineText" },
      { title: "Fecha Limite", type: "Date" },
      { title: "Completada", type: "Checkbox" },
      { title: "Contacto Relacionado", type: "SingleLineText" } // Usado para enlazar con Contacto manualmente
    ];
    for(let f of fieldsTareas) {
       console.log(` -> Campo: ${f.title}`);
       await api(`meta/bases/${BASE_ID}/tables/${tTareas}/fields`, 'POST', f);
    }

    // NOTAS
    console.log("Creando tabla: Notas...");
    const notas = await api(`meta/bases/${BASE_ID}/tables`, 'POST', { title: "Notas" });
    const tNotas = notas?.id;
    const fieldsNotas = [
      { title: "Etapa", type: "SingleLineText" },
      { title: "Texto", type: "LongText" },
      { title: "Fecha", type: "Date" },
      { title: "Contacto Relacionado", type: "SingleLineText" }
    ];
    for(let f of fieldsNotas) {
       console.log(` -> Campo: ${f.title}`);
       await api(`meta/bases/${BASE_ID}/tables/${tNotas}/fields`, 'POST', f);
    }

    console.log("===================================");
    console.log("Estructura CREADA EXITOSAMENTE!!!");
    console.log("===================================");

  } catch (e) {
    console.error("Excepción fatal:", e);
  }
}
run();
