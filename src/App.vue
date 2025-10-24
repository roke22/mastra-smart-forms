<script setup>
import { ref, onMounted } from 'vue'
import { mastraService } from './services/mastraService.js'
import './styles/App.css'

// Schema del formulario para structured output
const FORM_SCHEMA = {
  type: "object",
  properties: {
    nombre: {
      type: "string",
      description: "Sera el nombre del cliente"
    },
    direccion: {
      type: "string",
      description: "Sera la direccion del cliente"
    },
    telefono: {
      type: "string",
      description: "Sera el telefono del cliente"
    },
    email: {
      type: "string",
      description: "Sera el email del cliente"
    }
  },
  additionalProperties: false,
  required: ["nombre", "email", "direccion", "telefono"]
}

const formData = ref({
  nombre: '',
  telefono: '',
  email: '',
  direccion: ''
})

const formErrors = ref({
  nombre: '',
  telefono: '',
  email: '',
  direccion: ''
})

const submitted = ref(false)
const isListening = ref(false)
const recognition = ref(null)
const browserSupported = ref(true)
const isProcessing = ref(false)

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  }

  // Validar nombre
  if (!formData.value.nombre.trim()) {
    formErrors.value.nombre = 'El nombre es requerido'
    isValid = false
  }

  // Validar teléfono
  if (!formData.value.telefono.trim()) {
    formErrors.value.telefono = 'El teléfono es requerido'
    isValid = false
  } else if (!/^\d{9,15}$/.test(formData.value.telefono.replace(/\s/g, ''))) {
    formErrors.value.telefono = 'El teléfono debe contener entre 9 y 15 dígitos'
    isValid = false
  }

  // Validar email
  if (!formData.value.email.trim()) {
    formErrors.value.email = 'El email es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    formErrors.value.email = 'El email no es válido'
    isValid = false
  }

  // Validar dirección
  if (!formData.value.direccion.trim()) {
    formErrors.value.direccion = 'La dirección es requerida'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    submitted.value = true
  }
}

const resetForm = () => {
  formData.value = {
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  }
  submitted.value = false
}

// Inicializar Web Speech API
onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    console.warn('Web Speech API no soportada en este navegador')
    browserSupported.value = false
    return
  }

  recognition.value = new SpeechRecognition()
  recognition.value.lang = 'es-ES'
  recognition.value.continuous = true
  recognition.value.interimResults = true

  // Configurar callbacks del sistema de cola
  mastraService.setProcessingCallbacks({
    onStart: () => {
      isProcessing.value = true
    },
    onComplete: (result) => {
      isProcessing.value = false
      
      if (result.success) {
        // Limpiar espacios en blanco de email y teléfono
        if (formData.value.email) {
          formData.value.email = formData.value.email.replace(/\s/g, '')
        }
        if (formData.value.telefono) {
          formData.value.telefono = formData.value.telefono.replace(/\s/g, '')
        }
        
        if (validateForm()) {
          console.log('✅ Formulario completo')
        }
      }
    },
    onError: (error) => {
      isProcessing.value = false
      console.error('❌ Error al procesar:', error)
    }
  })

  recognition.value.onresult = (event) => {
    let finalTranscript = ''
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '
      }
    }
    
    if (finalTranscript.trim()) {
      mastraService.processVoiceToFormQueued(
        finalTranscript.trim(),
        formData,
        FORM_SCHEMA
      )
    }
  }

  recognition.value.onend = () => {
    if (isListening.value) {
      // Si todavía está en modo escucha, reiniciar
      recognition.value.start()
    }
  }

  recognition.value.onerror = (event) => {
    console.error('❌ Error de reconocimiento:', event.error)
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      if (isListening.value) {
        setTimeout(() => {
          if (isListening.value) {
            recognition.value.start()
          }
        }, 100)
      }
    }
  }
})

// Iniciar/detener reconocimiento de voz
const toggleVoiceInput = () => {
  if (!recognition.value) {
    alert('El reconocimiento de voz no está disponible en este navegador. Por favor, usa Google Chrome.')
    return
  }

  if (isListening.value) {
    isListening.value = false
    recognition.value.stop()
    mastraService.clearProcessingQueue()
  } else {
    isListening.value = true
    recognition.value.start()
  }
}
</script>

<template>
  <div class="container">
    <div class="form-wrapper">
      <h1>Formulario de Registro</h1>
      
      <div v-if="!submitted" class="form-card">
        <div v-if="browserSupported" class="voice-info">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="info-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>Usa el botón <strong>"Rellenar Formulario"</strong> para dictar toda la información</p>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="nombre">Nombre Completo</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              placeholder="Ingresa tu nombre completo"
              :class="{ 'error': formErrors.nombre }"
            />
            <span v-if="formErrors.nombre" class="error-message">{{ formErrors.nombre }}</span>
          </div>

          <div class="form-group">
            <label for="telefono">Teléfono</label>
            <input
              id="telefono"
              v-model="formData.telefono"
              type="tel"
              placeholder="Ingresa tu teléfono"
              :class="{ 'error': formErrors.telefono }"
            />
            <span v-if="formErrors.telefono" class="error-message">{{ formErrors.telefono }}</span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="ejemplo@correo.com"
              :class="{ 'error': formErrors.email }"
            />
            <span v-if="formErrors.email" class="error-message">{{ formErrors.email }}</span>
          </div>

          <div class="form-group">
            <label for="direccion">Dirección</label>
            <textarea
              id="direccion"
              v-model="formData.direccion"
              placeholder="Ingresa tu dirección completa"
              rows="3"
              :class="{ 'error': formErrors.direccion }"
            ></textarea>
            <span v-if="formErrors.direccion" class="error-message">{{ formErrors.direccion }}</span>
          </div>

          <!-- Botón de Rellenar Formulario con Voz -->
          <button 
            v-if="browserSupported"
            type="button" 
            class="btn-voice" 
            :class="{ 'listening': isListening, 'processing': isProcessing }"
            @click="toggleVoiceInput"
            :disabled="isProcessing"
          >
            <div class="mic-icon">
              <svg v-if="!isProcessing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="31.4 31.4" />
              </svg>
            </div>
            <span class="btn-text">
              {{ isProcessing ? 'Procesando con IA...' : (isListening ? 'Detener Dictado' : 'Rellenar Formulario') }}
            </span>
          </button>

          <!-- Onda de voz - siempre visible -->
          <div class="voice-wave" :class="{ 'active': isListening || isProcessing }">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
          </div>

          <!-- Animación de procesamiento con IA -->
          <div v-if="isProcessing" class="processing-indicator">
            <div class="processing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p class="processing-text">Procesando con IA...</p>
          </div>
        </form>
      </div>

      <div v-else class="success-message">
        <div class="success-icon">✓</div>
        <h2>¡Formulario enviado con éxito!</h2>
        <div class="submitted-data">
          <h3>Datos ingresados:</h3>
          <p><strong>Nombre:</strong> {{ formData.nombre }}</p>
          <p><strong>Teléfono:</strong> {{ formData.telefono }}</p>
          <p><strong>Email:</strong> {{ formData.email }}</p>
          <p><strong>Dirección:</strong> {{ formData.direccion }}</p>
        </div>
        <button @click="resetForm" class="btn-reset">
          Enviar Otro Formulario
        </button>
      </div>
    </div>
  </div>
</template>
