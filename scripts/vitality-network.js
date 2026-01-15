import updateVitalityPool from './update-vitality-pool.js';




const rollHealing = async (actor, points) => {
  const damageRoll = CONFIG.Dice.rolls.find(r => r.name === "DamageRoll");
  const roll = await new damageRoll(`${points}[healing]`).evaluate();
  // const roll = await new damageRoll(`${actor.name} ${points}[healing]`).evaluate();

  console.log(actor);
  
  const message = await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `Vitality Network - Transfer Vitality`
  });

  // Use pf2e-toolbelt Target Helper to apply healing
  const targets = Array.from(game.user.targets);
  
  if (targets.length > 0 && game.modules.get('pf2e-toolbelt')?.active) {
    Hooks.call('pf2e-toolbelt.target-helper.damage-received', {
      message: message,
      targets: targets.map(t => t.document),
      roll: roll
    });
  } else if (targets.length === 0) {
    ui.notifications.warn('Please target at least one token to heal.');
  } else if (!game.modules.get('pf2e-toolbelt')?.active) {
    ui.notifications.warn('pf2e-toolbelt module is required for automated healing application.');
  }
}

// #region hooks
// Register settings when the module initializes
Hooks.once('init', () => {
  console.log("Greenbottle's Vitality Network | Initializing");
  
  // Register the setting
  game.settings.register('greenbottles-vitality-network', 'dialogStyle', {
    name: 'Dialog Style',
    hint: 'Choose how the vitality network spending prompt appears.',
    scope: 'client',     // Each user can set their own preference
    config: true,        // Shows in module settings
    type: String,
    choices: {
      'popup': 'Popup Dialog',
      'chat': 'Chat Message'
    },
    default: 'chat'
  });
});

Hooks.once('ready', () => {
  console.log("Greenbottle's Vitality Network | Ready");
  ui.notifications.info("Greenbottle's Vitality Network | Ready");
});


Hooks.on('combatTurn', (combat, updateData, updateOptions) => {
  console.log('=== COMBAT TURN HOOK FIRED === ------------------------------------');
  console.log('Combat object:', combat);
  console.log('Current turn index:', combat.turn);
  console.log('Current combatant:', combat.combatant);
  console.log('Combatant name:', combat.combatant?.name);
  console.log('All turns:', combat.turns.map(t => t.name));
  
  ui.notifications.info(`New turn started -- ${combat.combatant?.name || 'Unknown'}`);
});

// Hooks.on('combatTurn', (combat, updateData, updateOptions) => {
//   // const combat = game.combat;
//   ui.notifications.info(`new turn started -- ${game.combat.turns[game.combat.turn].name}`);


//   // const currentCombatant = combat.combatant;
  
//   // console.log(game.combat.turns[game.combat.turn].name, "current turn holder")
//   // console.log(currentCombatant, "current combatant")

//   // updateVitalityPool(currentCombatant);

//   // if (currentCombatant?.isOwner || currentCombatant?.actor?.hasPlayerOwner) {
// 	// 	console.log(`player turn started for ${currentCombatant.name}`);

//   //   let player = currentCombatant.actor;
    
//   //   // ui.notifications.info("on combat turn hook -- 2 - inside if ");

// 	// 	if (player) {
// 	// 		let level = player.level;
// 	// 		let playerClass = player.class.name;
// 	// 		let vitalityNetwork = player.system.resources.vitalityNetwork;

// 	// 		let newValue = vitalityNetwork.value;
//   //     if (level >= 19) {
//   //       // ui.notifications.info("on combat turn hook -- 3 - >= 19");
// 	// 			newValue += 8;
// 	// 		}
//   //     else if (level >= 15) {
//   //       // ui.notifications.info("on combat turn hook -- 3 - >= 15");
// 	// 			newValue += 6;
// 	// 		}
//   //     else {
//   //       // ui.notifications.info("on combat turn hook -- 3 - >= 1");
// 	// 			newValue += 4;
// 	// 		}

//   //     if (newValue > vitalityNetwork.max) {
//   //       // ui.notifications.info("on combat turn hook -- 3d - new value > network max");
// 	// 			newValue = vitalityNetwork.max;
// 	// 		}

// 	// 		// let newValue = player.system.resources.vitalityNetwork.value += 1;
// 	// 		player.updateResource('vitalityNetwork', newValue)
			
// 	// 		console.log(player.system.resources.vitalityNetwork.value);
// 	// 	}
// 	// }

	
// })



Hooks.on('createChatMessage', async (message, options, userId) => {
  const item = message.item;

  if (item?.slug === 'transfer-vitality') {
    const actor = message.actor;
    
    // TEST LOGGING - Remove after verification
    console.log('=== TRANSFER VITALITY DETECTED ===');
    console.log('Actor using Transfer Vitality:', actor.name);
    console.log('Actor ID:', actor.id);
    console.log('User ID who triggered the action:', userId);
    console.log('Current user ID:', game.user.id);
    console.log('Current user name:', game.user.name);
    console.log('Current user\'s assigned character:', game.user.character?.name || 'None');
    console.log('Current user\'s assigned character ID:', game.user.character?.id || 'None');
    console.log('Does assigned character match?', game.user.character?.id === actor.id ? 'YES - WILL SHOW PROMPT' : 'NO - WILL NOT SHOW PROMPT');
    console.log('All connected users:', game.users.map(u => `${u.name} (${u.id}${u.character ? ' - plays: ' + u.character.name : ''})`));
    console.log('=====================================');
    
    // Only show the dialog/chat card to the user who has this character assigned
    if (game.user.character?.id !== actor.id) {
      console.log(`Skipping prompt for ${game.user.name} - this character is not assigned to them`);
      return;
    }
    
    console.log(`Showing prompt to ${game.user.name} - this character is assigned to them`);
    
    const vitalityResource = actor.system.resources?.vitalityNetwork;

    if (!vitalityResource) {
      ui.notifications.warn('No Vitality Network resource found on this character.');
      return;
    }

    const currentPoints = vitalityResource.value || 0;
    const maxPoints = vitalityResource.max || 0;

    if (currentPoints === 0) {
      ui.notifications.warn('You have no Vitality Network points remaining!');
      return;
    }

    // Get the user's preference
    const dialogStyle = game.settings.get('greenbottles-vitality-network', 'dialogStyle');

		// #region chat card
    if (dialogStyle === 'chat') {
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        whisper: [game.user.id],
        content: `
          <div class="pf2e chat-card vitality-network-card">
            <header class="card-header flexrow">
              <img src="${actor.img}" width="36" height="36"/>
              <h3>Vitality Network</h3>
            </header>
            <div class="card-content">
              <p><strong>Available Points:</strong> ${currentPoints} / ${maxPoints}</p>
              <div class="form-group">
                <label>Points to spend:</label>
                <input 
                  type="number" 
                  class="vitality-points-input" 
                  data-actor-id="${actor.id}"
                  data-current="${currentPoints}"
                  data-max="${maxPoints}"
                  min="1" 
                  max="${currentPoints}" 
                  value="1"
                  style="width: 100%; margin: 0.5rem 0;"
                />
              </div>
              <button class="spend-vitality-btn" data-actor-id="${actor.id}">
                <i class="fas fa-check"></i> Spend Points
              </button>
            </div>
          </div>
        `,
        flags: {
          'greenbottles-vitality-network': {
            interactive: true
          }
        },
        // whisper: actorOwners.map(u => u.id),
      });
		}
		// #region popup dialog
		else {
      // Popup dialog version
      new Dialog({
        title: "Vitality Network",
        content: `
          <form>
            <div class="form-group">
              <label style="font-weight: bold; margin-bottom: 0.5rem; display: block;">
                Available Points: ${currentPoints} / ${maxPoints}
              </label>
              <label style="margin-bottom: 0.25rem; display: block;">
                How many points do you want to spend?
              </label>
              <input 
                type="number" 
                name="points" 
                min="1" 
                max="${currentPoints}" 
                value="1" 
                autofocus 
                style="width: 100%;"
              />
            </div>
          </form>
        `,
        buttons: {
          spend: {
            icon: '<i class="fas fa-check"></i>',
            label: "Spend",
            callback: async (html) => {
              const points = parseInt(html.find('[name="points"]').val());

              // ui.notifications.info("attempting to update vitality network -- p1");
              
              if (points > 0 && points <= currentPoints) {
                const newValue = currentPoints - points;
                
                // ui.notifications.info("attempting to update vitality network -- p2");

                try {
                  await actor.updateResource('vitalityNetwork', newValue);
                  
                  ui.notifications.info(`Spent ${points} Vitality Network points. ${newValue} remaining. -- p3a`);
                  
                  await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({actor: actor}),
                    content: `
                      <div class="pf2e chat-card">
                        <header class="card-header flexrow">
                          <img src="${actor.img}" width="36" height="36"/>
                          <h3>Vitality Network</h3>
                        </header>
                        <div class="card-content">
                          <p><strong>${actor.name}</strong> spent <strong>${points}</strong> Vitality Network points.</p>
                          <p>Remaining: <strong>${newValue}</strong> / ${maxPoints}</p>
                        </div>
                      </div>
                    `
                  });

                  await rollHealing(actor, points);

                } catch (error) {
                  console.error("Update failed:", error);
                  ui.notifications.error("Failed to update Vitality Network points!");
                }
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel"
          }
        },
        default: "spend"
      }).render(true);
    }
  }
});

// #region button handler
// // Handle chat card button clicks
Hooks.on('renderChatMessage', (message, html) => {
  html.find('.spend-vitality-btn').click(async (event) => {
    const button = event.currentTarget;
    const actorId = button.dataset.actorId;
    const input = html.find('.vitality-points-input')[0];
    const points = parseInt(input.value);
    const currentPoints = parseInt(input.dataset.current);
    const maxPoints = parseInt(input.dataset.max);

    // ui.notifications.info("attempting to update vitality network -- c1");
    
    if (points > 0 && points <= currentPoints) {
      const actor = game.actors.get(actorId);
      const newValue = currentPoints - points;
      
      // ui.notifications.info("attempting to update vitality network -- c2");
      
      try {
        await actor.updateResource('vitalityNetwork', newValue);
        ui.notifications.info(`Spent ${points} Vitality Network points. ${newValue} remaining.`);
        
        // Update the chat card to show it's been used
        html.find('.card-content').html(`
          <p><strong>${actor.name}</strong> spent <strong>${points}</strong> Vitality Network points.</p>
          <p>Remaining: <strong>${newValue}</strong> / ${maxPoints}</p>
        `);

				await rollHealing(actor, points);


      } catch (error) {
        console.error("Update failed:", error);
        ui.notifications.error("Failed to update Vitality Network points!");
      }
    }
  });
});


