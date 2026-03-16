/**
 * vitality-network.js — Greenbottle's Vitality Network
 *
 * Watches for "Transfer Vitality" action rolls in the chat. When one is detected,
 * pops up a dialog letting the player choose how many Vitality Network points to spend,
 * then deducts that amount from their character sheet.
 *
 * Vitality Network is a custom resource on SF2e characters, stored at:
 *   actor.system.resources.vitalityNetwork.value  (current points)
 *   actor.system.resources.vitalityNetwork.max    (maximum points)
 */

// Runs once when Foundry first loads the module — just logs that we're alive.
Hooks.once('init', () => {
  console.log('Greenbottle\'s Vitality Network | Initializing');
});

// Listens for every new chat message. We only care about "Transfer Vitality" actions.
Hooks.on('createChatMessage', async (message) => {
  const item = message.item;

  // Check if the chat message came from the "transfer-vitality" item/action.
  // item.slug is the system identifier for the item — more reliable than checking the name.
  if (item?.slug === 'transfer-vitality') {
    const actor = message.actor;

    // Look up the actor's Vitality Network resource on their sheet.
    const vitalityResource = actor.system.resources?.vitalityNetwork;

    // If this character doesn't have the resource at all, warn and bail out.
    if (!vitalityResource) {
      ui.notifications.warn('No Vitality Network resource found on this character.');
      return;
    }

    const currentPoints = vitalityResource.value || 0;
    const maxPoints = vitalityResource.max || 0;

    // Can't spend what you don't have.
    if (currentPoints === 0) {
      ui.notifications.warn('You have no Vitality Network points remaining!');
      return;
    }

    // Builds the HTML form shown inside the dialog.
    // Displays current/max and a number input capped at what's available.
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

    // Show the dialog. The "Spend" button deducts the chosen amount from the actor's sheet.
    new Dialog({
      title: "Vitality Network",
      content: createVitalityNetworkDialog(currentPoints, maxPoints),
      buttons: {
        spend: {
          icon: '<i class="fas fa-check"></i>',
          label: "Spend",
          callback: async (html) => {
            // Read the number the player typed in the dialog form.
            const points = parseInt(html.find('[name="points"]').val());

            // Validate: must be a positive number and within what they actually have.
            if (points > 0 && points <= currentPoints) {
              const newValue = currentPoints - points;

              // Write the new value back to the actor's character sheet.
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
      default: "spend"  // "Spend" is pre-selected as the default button
    }).render(true);
  }
});
