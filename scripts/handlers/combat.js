import { updateVitalityPool } from '../update-vitality-pool.js';

/**
 * Register combat-related hooks for vitality network updates
 */
export function registerCombatHooks() {
  console.log('Greenbottle\'s Vitality Network | Registering combat hooks');
  
  // Handle all turn changes (fires for every turn including the first)
  Hooks.on('combatTurnChange', (combat, updateData) => {
    const currentCombatant = combat.combatant;
    
    // Skip if no active combatant
    if (!currentCombatant) {
      console.log('⚠️ combatTurn fired but no active combatant');
      return;
    }
    
    // console.log(`turn change for ${currentCombatant.name}`);
    
    // Update vitality network points for this combatant
    updateVitalityPool(currentCombatant);
  });
  
  // console.log('Greenbottle\'s Vitality Network | Combat hooks registered');
}