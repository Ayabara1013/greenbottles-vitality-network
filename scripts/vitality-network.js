Hooks.once('init', () => {
  console.log('Greenbottle\'s Vitality Network | Initializing');
});

Hooks.on('createChatMessage', async (message) => {
  const item = message.item;

  // detect transfer vitality action
  if (item?.slug === 'transfer-vitality') {
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

    const createVitalityNetworkDialog = (currentPoints, maxPoints) => {
      return `
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
      `;
    };

    // show dialog
    new Dialog({
      title: "Vitality Network",
      content: createVitalityNetworkDialog(currentPoints, maxPoints),
      buttons: {
        spend: {
          icon: '<i class="fas fa-check"></i>',
          label: "Spend",
          callback: async (html) => {
            const points = parseInt(html.find('[name="points"]').val());
            if (points > 0 && points <= currentPoints) {
              const newValue = currentPoints - points;
              await actor.update({
                "system.resources.vitalityNetwork.value": newValue
              });
              ui.notifications.info(`Spent ${points} Vitality Network points. ${newValue} remaining.`);
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