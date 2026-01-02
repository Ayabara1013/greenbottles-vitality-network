const rollHealing = async (actor, points) => {
  const damageRoll = CONFIG.Dice.rolls.find(r => r.name === "DamageRoll");
  const roll = await new damageRoll(`${points}[healing]`).evaluate();
  
  const message = await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Vitality Network - Transfer Vitality"
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
    ui.notifications.warn('pf2e-toolbelt module is required for automatic healing application.');
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
    default: 'popup'
  });
});

Hooks.once('ready', () => {
  console.log("Greenbottle's Vitality Network | Ready");
  ui.notifications.info("Greenbottle's Vitality Network | Ready");
});

Hooks.on('combatTurn', (combat, updateData, updateOptions) => {
	const currentCombatant = combat.combatant;

	if (currentCombatant?.isOwner || currentCombatant?.actor?.hasPlayerOwner) {
		console.log(`player turn started for ${currentCombatant.name}`);

		let player = currentCombatant.actor;

		if (player) {
			let level = player.level;
			let playerClass = player.class.name;
			let vitalityNetwork = player.system.resources.vitalityNetwork;

			let newValue = 0;
			if (level >= 19) {
				newValue = vitalityNetwork.value += 8;
			}
			else if (level >= 15) {
				newValue = vitalityNetwork.value += 6;
			}
			else {
				newValue = vitalityNetwork.value += 4;
			}

			if (newValue > vitalityNetwork.max) {
				newValue = vitalityNetwork.max;
			}

			// let newValue = player.system.resources.vitalityNetwork.value += 1;
			player.updateResource('vitalityNetwork', newValue)
			
			console.log(player.system.resources.vitalityNetwork.value);
		}
	}
})

Hooks.on('createChatMessage', async (message) => {
  const item = message.item;

  if (item?.slug === 'transfer-vitality') {
    const actor = message.actor;
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
        speaker: ChatMessage.getSpeaker({actor: actor}),
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
        }
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
              
              if (points > 0 && points <= currentPoints) {
                const newValue = currentPoints - points;
                
                try {
                  await actor.updateResource('vitalityNetwork', newValue);
                  
                  ui.notifications.info(`Spent ${points} Vitality Network points. ${newValue} remaining.`);
                  
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
    
    if (points > 0 && points <= currentPoints) {
      const actor = game.actors.get(actorId);
      const newValue = currentPoints - points;
      
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


