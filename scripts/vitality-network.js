Hooks.once('init', () => {
  console.log("Greenbottle's Vitality Network | Initializing");
});

Hooks.once('ready', () => {
  console.log("Greenbottle's Vitality Network | Ready");
  ui.notifications.info("Greenbottle's Vitality Network | Ready");
});

Hooks.on('createChatMessage', async (message) => {
  console.log("Chat message hook fired!");
  const item = message.item;
  console.log("Item:", item);
  console.log("Item slug:", item?.slug);

  // detect transfer vitality action
  if (item?.slug === 'transfer-vitality') {
    console.log("Transfer Vitality detected!");
    const actor = message.actor;

    // get vitality network resource
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

    // show dialog
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
            console.log("Points to spend:", points);
            
            if (points > 0 && points <= currentPoints) {
              const newValue = currentPoints - points;
              console.log("New value will be:", newValue);
              
              try {
                // Update the resource
                await actor.updateResource('vitalityNetwork', newValue);
                console.log("Update result:");
                console.log("Actor resource after update:", actor.system.resources.vitalityNetwork.value);
                
                // Show notification
                ui.notifications.info(`Spent ${points} Vitality Network points. ${newValue} remaining.`);
                
                // Send chat message
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
});