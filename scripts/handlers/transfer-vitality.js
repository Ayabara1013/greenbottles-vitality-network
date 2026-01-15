import { rollHealing } from '../healing.js';

/**
 * Register hooks for handling Transfer Vitality action
 */
export function registerTransferVitalityHooks() {
  
  // Handle when Transfer Vitality action is used
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
      // Chat card style
      if (dialogStyle === 'chat') {
        await ChatMessage.create({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({actor: actor}),
          whisper: [game.user.id], // Only show to the user who has this character assigned
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
      // #endregion
      
      // #region popup
      // Popup dialog style
      else {
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
                    
                    // Check visibility setting
                    const showSpending = game.settings.get('greenbottles-vitality-network', 'showSpending');
                    
                    if (showSpending !== 'none') {
                      // Determine whisper recipients
                      let whisperTo = null;
                      const gmUsers = game.users.filter(u => u.isGM).map(u => u.id);
                      const actorOwners = game.users.filter(u => actor.testUserPermission(u, "OWNER")).map(u => u.id);
                      
                      switch (showSpending) {
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
                          whisperTo = null;
                          break;
                      }
                      
                      const messageData = {
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
                      };
                      
                      if (whisperTo) {
                        messageData.whisper = whisperTo;
                      }
                      
                      await ChatMessage.create(messageData);
                    }

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
  // #endregion

  // #region button clicks
  // Handle chat card button clicks
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
}
