const mailer = require("mailer");

cronAdd("sendDailyReminders", "0 11 * * *", () => {
    // 0 11 * * * en UTC es 8 AM en Argentina (UTC-3)
    try {
        const userEmail = "arrativelfacundo1@gmail.com";
        let count = 0;

        // In PocketBase v0.22+ you can query multiple records easily
        // Recordar que SQLite guarda el JSON como texto, asique traemos todos los del usuario
        const contacts = $app.dao().findRecordsByFilter(
            "contactos", 
            "asignado = {:email}",
            null, 
            -1,  // limit (-1 para todos)
            0,   // offset
            { "email": userEmail }
        );

        // Obtenemos inicio del dia de hoy y de mañana para comparar
        // Nota: en Goja (el motor JS de PB), las Date funcionan pero usan zona horaria UTC por defecto
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);

        for (let contact of contacts) {
            const stagesJsonStr = contact.getString("stages_json");
            if (!stagesJsonStr) continue;

            try {
                const stagesData = JSON.parse(stagesJsonStr);
                const stages = stagesData.stages || stagesData;

                for (let stage of stages) {
                    if (stage.notes && Array.isArray(stage.notes)) {
                        for (let note of stage.notes) {
                            if (note.reminderTimestamp) {
                                // reminderTimestamp se guarda usualmente en milisegundos
                                if (note.reminderTimestamp >= startOfToday.getTime() && note.reminderTimestamp < startOfTomorrow.getTime()) {
                                    count++;
                                }
                            }
                        }
                    }
                }
            } catch (parseError) {
                // Ignorar contacto si el JSON está malformado
            }
        }

        if (count > 0) {
            const message = new mailer.Message({
                from: {
                    address: $app.settings().meta.senderAddress,
                    name: $app.settings().meta.senderName || "CRM Smart",
                },
                to: [{address: userEmail}],
                subject: "Recordatorios de hoy en CRM Smart",
                html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #222;">
                    <p>Hola,</p>
                    <p>Tienes <b>${count} recordatorios</b> programados para el día de hoy.</p>
                    <p>Ingresa al <a href="https://crm-smart.vercel.app">CRM</a> para revisarlos.</p>
                    <br/>
                    <p>Saludos,<br><b>Equipo CRM Smart</b></p>
                </div>`,
            });

            $app.newMailClient().send(message);
            console.log(`[Reminders] Correo enviado a ${userEmail} con ${count} recordatorios.`);
        } else {
            console.log(`[Reminders] Cero recordatorios para ${userEmail} hoy, no se envía correo.`);
        }
    } catch (err) {
        console.error("[Reminders] Fallo al procesar recordatorios diarios:", err);
    }
});
