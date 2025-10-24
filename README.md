# Mastra Smart Forms

[🇪🇸 Español](#español) | [🇬🇧 English](#english)

---

https://github.com/user-attachments/assets/c2eb3d95-8892-4636-92d1-98f8d54a6a68

## Español

### ¿Que es Smart Forms?
Es una demostración de como convertir cualquier formulario existente en un formulario inteligente que puede rellenarse con voz.

¿Como lo hacemos?

- Usamos el motor de reconocimiento de voz del navegador, pero puede ser susituido por un servicio como whisper.
- Utilizamos mastra.ai para procesar el texto con un output formateado.
- Leemos el output formateado para asignar cada campo al formulario.
- Con el fichero src/mastra/agents/voice-form-agent.ts creamos el agente y a traves del API de mastra lo consumimos.
- Con el fichero src/services/mastraService.js tenemos el servicio que puede consumir el agente creado, este servicio se importa en la vista App.vue y esta pensado para funcionar en cualquier formulario. Recibe como parametro los diferentes inputs que tiene el formulario el tipo y el valor que deben contener.
- En el fichero src/App.vue tenemos importado el servicio mastraService.js y hacemos uso del mismo para consumir el API del agente, en esa misma vista tenemo el esquema mencionado anteriormente en la constante FORM_SCHEMA

### ¿Que usamos en este proyecto?

Estamos usando Vuejs 3, Vite y Mastra

- [Mastra Documentation](https://mastra.ai/)
- [Vue.js Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

### ¿Como ejecuto todo esto?

- Clona el proyecto
- Ejecuta npm install
- Ejecuta en un terminal npm run dev
- Ejecuta en otra terminal npm run mastra:dev

---

https://github.com/user-attachments/assets/a92ca41b-a42c-4cfc-928f-83c82bb83c74

## English

### What is Smart Forms?
It's a demonstration of how to convert any existing form into an intelligent form that can be filled with voice.

How do we do it?

- We use the browser's speech recognition engine, but it can be replaced with a service like Whisper.
- We use mastra.ai to process the text with formatted output.
- We read the formatted output to assign each field to the form.
- With the file src/mastra/agents/voice-form-agent.ts we create the agent and consume it through the mastra API.
- With the file src/services/mastraService.js we have the service that can consume the created agent, this service is imported in the App.vue view and is designed to work with any form. It receives as parameters the different inputs that the form has, the type and the value they should contain.
- In the file src/App.vue we have imported the mastraService.js service and make use of it to consume the agent's API, in that same view we have the schema mentioned above in the FORM_SCHEMA constant.

### What do we use in this project?

We are using Vue.js 3, Vite and Mastra

- [Mastra Documentation](https://mastra.ai/)
- [Vue.js Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

### How do I run all this?

- Clone the project
- Run npm install
- Run in one terminal npm run dev
- Run in another terminal npm run mastra:dev
