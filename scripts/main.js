/**
 * Greenbottle's Vitality Network
 * Main entry point for the module
 */



import { registerSettings } from './settings.js';
import { registerCombatHooks } from './handlers/combat.js';
import { registerTransferVitalityHooks } from './handlers/transfer-vitality.js';

// Initialize module
Hooks.once('init', () => {
  console.log("Greenbottle's Vitality Network | Initializing");
  
  // Register all settings
  registerSettings();
});

// Setup module when ready
Hooks.once('ready', () => {
  console.log("Greenbottle's Vitality Network | Ready");
  ui.notifications.info("Greenbottle's Vitality Network | Ready");
  
  // Register combat hooks
  registerCombatHooks();
  
  // Register transfer vitality hooks
  registerTransferVitalityHooks();
});
