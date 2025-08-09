/**
 * 🔄 Dialogue Services Export
 * 
 * Central export point for dialogue migration and enhancement services
 */

export { 
  DialogueMigrationService, 
  getDialogueMigrationService,
  useDialogueMigrationService 
} from './DialogueMigrationService'

export type {
  DialogueMigrationConfig,
  DialogueContext
} from './DialogueMigrationService'