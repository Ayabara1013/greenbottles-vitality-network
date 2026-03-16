/**
 * main.js — Greenbottle's Vitality Network
 *
 * Module entry point. Wires together settings, combat hooks, and transfer vitality hooks.
 *
 * Module architecture:
 *   main.js                          ← you are here (bootstraps everything)
 *   settings.js                      ← registers all Foundry module settings
 *   handlers/combat.js               ← fires updateVitalityPool on every combat turn
 *   handlers/transfer-vitality.js    ← detects Transfer Vitality action, shows spend UI
 *   healing.js                       ← rolls healing and passes it to pf2e-toolbelt targets
 *   update-vitality-pool.js          ← calculates and applies per-turn vitality regen
 *
 * The Vitality Network resource lives on SF2e characters at:
 *   actor.system.resources.vitalityNetwork.value  (current)
 *   actor.system.resources.vitalityNetwork.max    (maximum)
 */

import { registerSettings } from './settings.js';
import { registerCombatHooks } from './handlers/combat.js';
import { registerTransferVitalityHooks } from './handlers/transfer-vitality.js';

// 'init' fires before the game is fully loaded — safe place to register settings.
Hooks.once('init', () => {
  console.log("Greenbottle's Vitality Network | Initializing");
  registerSettings();
});

// 'ready' fires after all modules and the game world are loaded.
Hooks.once('ready', () => {
  console.log("Greenbottle's Vitality Network | Ready");
  ui.notifications.info("Greenbottle's Vitality Network | Ready");
  registerCombatHooks();
  registerTransferVitalityHooks();
});





