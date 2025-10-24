import { MASTRA_CONFIG } from '../config/mastra.js'

/**
 * Cola de procesamiento para gestionar múltiples solicitudes
 */
class ProcessingQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.callbacks = {
      onStart: null,
      onComplete: null,
      onError: null
    }
  }

  /**
   * Añade un texto a la cola de procesamiento
   */
  enqueue(text, formDataRef, schema) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        text,
        formDataRef,
        schema,
        resolve,
        reject
      })
      
      // Si no hay procesamiento en curso, iniciar
      if (!this.isProcessing) {
        this.processNext()
      }
    })
  }

  /**
   * Procesa el siguiente elemento de la cola
   */
  async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    const item = this.queue.shift()
    
    // Llamar callback de inicio
    if (this.callbacks.onStart) {
      this.callbacks.onStart()
    }

    try {
      const result = await this._processItem(item)
      item.resolve(result)
      
      // Llamar callback de completado
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete(result)
      }
    } catch (error) {
      item.reject(error)
      
      // Llamar callback de error
      if (this.callbacks.onError) {
        this.callbacks.onError(error)
      }
    }

    // Continuar con el siguiente elemento
    setTimeout(() => this.processNext(), 100)
  }

  /**
   * Procesa un elemento individual
   */
  async _processItem(item) {
    const { text, formDataRef, schema } = item

    // Generar salida estructurada usando Mastra
    const structuredData = await mastraService.generateStructuredOutput(
      text,
      schema
    )

    // Mapear los datos al formulario
    // formDataRef es una referencia de Vue, necesitamos acceder a .value
    const targetData = formDataRef.value || formDataRef
    const mapping = mastraService.mapToFormData(
      structuredData,
      targetData,
      schema
    )

    return {
      success: true,
      data: structuredData,
      mapping,
      text
    }
  }

  /**
   * Limpia la cola
   */
  clear() {
    this.queue = []
    this.isProcessing = false
  }

  /**
   * Configura callbacks para eventos de la cola
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Obtiene el estado de la cola
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    }
  }
}

/**
 * Instancia única de la cola de procesamiento
 */
const processingQueue = new ProcessingQueue()

/**
 * Servicio para interactuar con Mastra AI
 */
export const mastraService = {
  /**
   * Genera una respuesta estructurada usando un agente de Mastra
   * @param {string} message - El mensaje/texto a procesar
   * @param {object} schema - El schema JSON para la salida estructurada
   * @param {string} agentId - ID del agente (opcional, usa el de config por defecto)
   * @returns {Promise<object>} - Los datos estructurados parseados
   */
  async generateStructuredOutput(message, schema, agentId = MASTRA_CONFIG.agentId) {
    const url = `${MASTRA_CONFIG.serverUrl}/api/agents/${agentId}/generate`
    
    const payload = {
      messages: message,
      structuredOutput: {
        schema: schema
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`)
      }

      const data = await response.json()

      if (data.text) {
        return JSON.parse(data.text)
      }

      throw new Error('La respuesta no contiene el campo "text"')
    } catch (error) {
      console.error('❌ Error en generateStructuredOutput:', error)
      throw error
    }
  },

  /**
   * Mapea dinámicamente los datos recibidos a un objeto de formulario
   * Solo actualiza los campos que existen en el schema y tienen valor
   * @param {object} sourceData - Datos recibidos de Mastra
   * @param {object} targetData - Objeto reactivo del formulario (ref.value)
   * @param {object} schema - Schema usado para validar campos
   * @returns {object} - Objeto con estadísticas del mapeo
   */
  mapToFormData(sourceData, targetData, schema) {
    const stats = {
      total: 0,
      mapped: 0,
      empty: 0,
      fields: []
    }

    const schemaProperties = schema.properties || {}

    for (const fieldName in schemaProperties) {
      stats.total++

      if (fieldName in sourceData) {
        const value = sourceData[fieldName]

        if (value !== null && value !== undefined && value !== '') {
          targetData[fieldName] = value
          stats.mapped++
          stats.fields.push({
            name: fieldName,
            value: value,
            status: 'mapped'
          })
        } else {
          stats.empty++
          stats.fields.push({
            name: fieldName,
            value: null,
            status: 'empty'
          })
        }
      } else {
        stats.fields.push({
          name: fieldName,
          value: null,
          status: 'missing'
        })
      }
    }

    return stats
  },

  /**
   * Procesa un texto con reconocimiento de voz y llena un formulario automáticamente
   * @param {string} transcript - Texto transcrito del reconocimiento de voz
   * @param {object} formDataRef - Ref reactivo del formulario
   * @param {object} schema - Schema del formulario
   * @param {string} agentId - ID del agente
   * @returns {Promise<object>} - Estadísticas del proceso
   */
  async processVoiceToForm(transcript, formDataRef, schema, agentId = MASTRA_CONFIG.agentId) {
    try {
      const structuredData = await this.generateStructuredOutput(transcript, schema, agentId)
      const mappingStats = this.mapToFormData(structuredData, formDataRef.value, schema)

      return {
        success: true,
        data: structuredData,
        mapping: mappingStats
      }
    } catch (error) {
      console.error('❌ Error en processVoiceToForm:', error)
      return {
        success: false,
        error: error.message,
        mapping: null
      }
    }
  },

  /**
   * Procesa texto usando una cola para evitar pérdida de datos
   * Ideal para procesamiento en tiempo real con múltiples fragmentos de voz
   * @param {string} text - Texto a procesar
   * @param {object} formDataRef - Ref reactivo del formulario
   * @param {object} schema - Schema del formulario
   * @returns {Promise<object>} - Resultado del procesamiento
   */
  async processVoiceToFormQueued(text, formDataRef, schema) {
    try {
      return await processingQueue.enqueue(text, formDataRef, schema)
    } catch (error) {
      console.error('❌ Error en processVoiceToFormQueued:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Configura callbacks para eventos de procesamiento
   * @param {Object} callbacks - { onStart, onComplete, onError }
   */
  setProcessingCallbacks(callbacks) {
    processingQueue.setCallbacks(callbacks)
  },

  /**
   * Limpia la cola de procesamiento
   */
  clearProcessingQueue() {
    processingQueue.clear()
  },

  /**
   * Obtiene el estado de la cola de procesamiento
   * @returns {Object} - { queueLength, isProcessing }
   */
  getQueueStatus() {
    return processingQueue.getStatus()
  }
}
