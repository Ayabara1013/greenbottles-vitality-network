/**
 * Roll healing and apply it to targets using pf2e-toolbelt
 * Respects visibility settings for who can see the roll
 */
export async function rollHealing(actor, points) {
  const showSpending = game.settings.get('greenbottles-vitality-network', 'showSpending');
  
  // If set to 'none', don't create any chat message
  if (showSpending === 'none') {
    // Still apply healing if targets exist
    const targets = Array.from(game.user.targets);
    if (targets.length > 0 && game.modules.get('pf2e-toolbelt')?.active) {
      const damageRoll = CONFIG.Dice.rolls.find(r => r.name === "DamageRoll");
      const roll = await new damageRoll(`${points}[healing]`).evaluate();
      
      // Create a hidden message for the toolbelt to process
      const message = await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `Vitality Network - Transfer Vitality`,
        whisper: [game.user.id] // Whisper to self so only we process it
      });
      
      Hooks.call('pf2e-toolbelt.target-helper.damage-received', {
        message: message,
        targets: targets.map(t => t.document),
        roll: roll
      });
    }
    return;
  }
  
  // Determine whisper recipients based on settings
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
      whisperTo = null; // Public message
      break;
  }
  
  const damageRoll = CONFIG.Dice.rolls.find(r => r.name === "DamageRoll");
  const roll = await new damageRoll(`${points}[healing]`).evaluate();

  console.log(actor);
  
  const messageData = {
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `Vitality Network - Transfer Vitality`
  };
  
  if (whisperTo) {
    messageData.whisper = whisperTo;
  }
  
  const message = await roll.toMessage(messageData);

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
