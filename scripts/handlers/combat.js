import { updateVitalityPool } from '../update-vitality-pool.js';

/**
 * Register combat-related hooks for vitality network updates
 */
export function registerCombatHooks() {
  
  // Handle combat start (first turn of first round)
  Hooks.on('combatStart', (combat, updateData) => {
    console.log('=== COMBAT START HOOK FIRED ===');
    console.log('Combat started, first turn:', combat.combatant?.name);
    
    const currentCombatant = combat.combatant;
    
    // Update vitality pool for the first combatant when combat starts
    if (currentCombatant) {
      console.log(`Updating vitality pool for ${currentCombatant.name} at START of combat`);
      updateVitalityPool(currentCombatant);
    }
  });

  // Handle turn changes
  Hooks.on('combatTurn', (combat, updateData, updateOptions) => {
    console.log('=== COMBAT TURN HOOK FIRED ===');
    console.log('Combat object:', combat);
    console.log('Update data:', updateData);
    console.log('Current turn index:', combat.turn);
    console.log('Current combatant:', combat.combatant);
    console.log('Combatant name:', combat.combatant?.name);
    console.log('All turns:', combat.turns.map(t => t.name));
    
    const currentCombatant = combat.combatant;
    
    // The combatTurn hook fires AFTER the turn changes, so combat.combatant
    // is already the combatant whose turn is starting
    if (currentCombatant) {
      console.log(`Updating vitality pool for ${currentCombatant.name} at START of their turn`);
      updateVitalityPool(currentCombatant);
    }
  });
}
