


/**
 * Update the vitality network pool for a combatant at the start of their turn
 */
export function updateVitalityPool(currentCombatant) {
  console.log(`attempting to update vitality pool`)

  if (currentCombatant?.isOwner || currentCombatant?.actor?.hasPlayerOwner) {
		console.log(`player turn started for ${currentCombatant.name}`);

    let player = currentCombatant.actor;
    
    // ui.notifications.info("on combat turn hook -- 2 - inside if ");

		if (player) {
			let level = player.level;
			let playerClass = player.class.name;
			let vitalityNetwork = player.system.resources?.vitalityNetwork;
      
      // Skip if this character doesn't have a vitality network resource
      if (!vitalityNetwork) {
        console.log(`${player.name} does not have a vitalityNetwork resource - skipping`);
        return;
      }
      
      let oldValue = vitalityNetwork.value;

			let newValue = vitalityNetwork.value;
      let pointsGained = 0;
      
      if (level >= 19) {
        // ui.notifications.info("on combat turn hook -- 3 - >= 19");
				pointsGained = 8;
			}
      else if (level >= 15) {
        // ui.notifications.info("on combat turn hook -- 3 - >= 15");
				pointsGained = 6;
			}
      else {
        // ui.notifications.info("on combat turn hook -- 3 - >= 1");
				pointsGained = 4;
			}
      
      newValue += pointsGained;

      if (newValue > vitalityNetwork.max) {
        // ui.notifications.info("on combat turn hook -- 3d - new value > network max");
				newValue = vitalityNetwork.max;
			}

			// let newValue = player.system.resources.vitalityNetwork.value += 1;
			player.updateResource('vitalityNetwork', newValue)
			
			console.log(player.system.resources.vitalityNetwork.value);
      
      // Show notification based on settings
      const actualGained = newValue - oldValue;
      if (actualGained > 0) {
        const showUpdates = game.settings.get('greenbottles-vitality-network', 'showUpdates');
        
        const shouldShow = (showUpdates === 'all') ||
                          (showUpdates === 'owner' && currentCombatant.isOwner) ||
                          (showUpdates === 'gm' && game.user.isGM) ||
                          (showUpdates === 'owner-gm' && (currentCombatant.isOwner || game.user.isGM));
        
        if (shouldShow) {
          const notificationStyle = game.settings.get('greenbottles-vitality-network', 'updateNotificationStyle');
          const message = `${player.name} regained ${actualGained} Vitality Network points (${newValue}/${vitalityNetwork.max})`;
          
          if (notificationStyle === 'chat') {
            // Send as chat message
            let whisperTo = null;
            const gmUsers = game.users.filter(u => u.isGM).map(u => u.id);
            const actorOwners = game.users.filter(u => player.testUserPermission(u, "OWNER")).map(u => u.id);
            
            // Determine whisper based on showUpdates setting
            switch (showUpdates) {
              case 'owner':
                whisperTo = actorOwners;
                break;
              case 'gm':
                whisperTo = gmUsers;
                break;
              case 'owner-gm':
                whisperTo = [...new Set([...actorOwners, ...gmUsers])];
                break;
              case 'all':
              default:
                whisperTo = null; // Public
                break;
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
                  <p>${message}</p>
                </div>
              </div>`
            };
            
            if (whisperTo) {
              messageData.whisper = whisperTo;
            }
            
            ChatMessage.create(messageData);
          } else {
            // Show as UI notification (default)
            ui.notifications.info(message);
          }
        }
      }
		}
	}
}