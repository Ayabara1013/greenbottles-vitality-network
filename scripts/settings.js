/**
 * Register all module settings
 */
export function registerSettings() {
  // Dialog style preference (client-side)
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

  // Visibility setting for vitality spending
  game.settings.register('greenbottles-vitality-network', 'showSpending', {
    name: 'Show Vitality Spending',
    hint: 'Controls who sees when vitality points are spent and the healing roll.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'all': 'Everyone (Public Chat)',
      'owner': 'Owner Only (Whisper)',
      'gm': 'GM Only (Whisper)',
      'owner-gm': 'Owner and GM (Whisper)',
      'none': 'No One (Silent)'
    },
    default: 'all'
  });

  // Visibility setting for vitality network updates
  game.settings.register('greenbottles-vitality-network', 'showUpdates', {
    name: 'Show Vitality Network Updates',
    hint: 'Show a notification when vitality network points are restored at turn start.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'all': 'Everyone',
      'owner': 'Owner Only',
      'gm': 'GM Only',
      'owner-gm': 'Owner and GM',
      'none': 'No One'
    },
    default: 'owner'
  });
}
