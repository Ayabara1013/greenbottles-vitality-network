/**
 * update-vitality-pool.js — Greenbottle's Vitality Network
 *
 * Runs at the start of every combatant's turn (triggered by combat.js).
 * If the combatant is a player character with a Vitality Network resource,
 * it adds points back based on their level:
 *
 *   Level  1–14 → +4 points per turn
 *   Level 15–18 → +6 points per turn
 *   Level 19+   → +8 points per turn
 *
 * Points are capped at the character's vitalityNetwork.max.
 * A notification (UI popup or chat message) is shown based on module settings.
 *
 * Called from: handlers/combat.js on the 'combatTurnChange' hook.
 */
export function updateVitalityPool(currentCombatant) {

  // Only run for player-owned combatants (skip NPCs and unowned tokens).
  if (currentCombatant?.isOwner || currentCombatant?.actor?.hasPlayerOwner) {
    console.log(`Vitality Network | Player turn started for ${currentCombatant.name}`);

    const player = currentCombatant.actor;
    if (!player) return;

    const level = player.level;
    const vitalityNetwork = player.system.resources?.vitalityNetwork;

    // Skip characters who don't have the Vitality Network custom resource.
    if (!vitalityNetwork) {
      console.log(`Vitality Network | ${player.name} has no vitalityNetwork resource — skipping`);
      return;
    }

    const oldValue = vitalityNetwork.value;

    // Points gained per turn scale with character level.
    let pointsGained;
    if (level >= 19)      pointsGained = 8;
    else if (level >= 15) pointsGained = 6;
    else                  pointsGained = 4;

    // Cap at the resource maximum.
    const newValue = Math.min(oldValue + pointsGained, vitalityNetwork.max);

    player.updateResource('vitalityNetwork', newValue);

    // Show a notification only if points were actually gained (i.e. wasn't already at max).
    const actualGained = newValue - oldValue;
    if (actualGained > 0) {
      const showUpdates = game.settings.get('greenbottles-vitality-network', 'showUpdates');

      // Check whether this user should see the notification based on visibility setting.
      const shouldShow = (showUpdates === 'all') ||
                         (showUpdates === 'owner' && currentCombatant.isOwner) ||
                         (showUpdates === 'gm' && game.user.isGM) ||
                         (showUpdates === 'owner-gm' && (currentCombatant.isOwner || game.user.isGM));

      if (shouldShow) {
        const notificationStyle = game.settings.get('greenbottles-vitality-network', 'updateNotificationStyle');
        const notifText = `${player.name} regained ${actualGained} Vitality Network points (${newValue}/${vitalityNetwork.max})`;

        if (notificationStyle === 'chat') {
          // Build whisper list matching the showUpdates visibility setting.
          let whisperTo = null;
          const gmUsers = game.users.filter(u => u.isGM).map(u => u.id);
          const actorOwners = game.users.filter(u => player.testUserPermission(u, "OWNER")).map(u => u.id);

          switch (showUpdates) {
            case 'owner':     whisperTo = actorOwners; break;
            case 'gm':        whisperTo = gmUsers; break;
            case 'owner-gm':  whisperTo = [...new Set([...actorOwners, ...gmUsers])]; break;
            case 'all':
            default:          whisperTo = null; break; // Public
          }

          const messageData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: player }),
            content: `<div class="pf2e chat-card vitality-network-card">
              <header class="card-header flexrow">
                <img src="${player.img}" width="36" height="36"/>
                <h3>Vitality Network Restored</h3>
              </header>
              <div class="card-content">
                <p>${notifText}</p>
              </div>
            </div>`
          };

          if (whisperTo) messageData.whisper = whisperTo;
          ChatMessage.create(messageData);

        } else {
          // Default: show as a brief UI notification in the top-right corner.
          ui.notifications.info(notifText);
        }
      }
    }
  }
}
