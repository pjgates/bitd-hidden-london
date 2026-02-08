# Hidden London

A [Foundry VTT](https://foundryvtt.com/) module for the [Blades in the Dark](https://github.com/Dez384/foundryvtt-blades-in-the-dark) system, implementing the **Hidden London** setting — occult-industrial 1820s London where criminal crews navigate both the mundane underworld and a hidden world of spirits, bargains, and ancient debts.

## Features

### Threat Rolls

A custom roll dialog and chat output implementing Hidden London's threat roll mechanics:

- **Dice pool** selection (0d–10d), with zero-mode (2d6 take lowest)
- **Position**: Standard (6 = Success, 4–5 = Peril, 1–3 = Threat) or Desperate (6 = Success, 1–5 = Threat, marks XP)
- **Additional threats**: Accept extra risks for bonus dice — each additional threat adds +1d, and dice are assigned to threats after rolling (highest first)
- **Effect levels**: Limited / Standard / Great / Extreme
- **Situational modifiers**: Home turf, spirit pact, operating blind, hostile territory, target vulnerable/prepared — displayed on the chat card
- **Critical**: Two 6s = critical success
- **Push Yourself**: Button on the chat card opens a secondary roll to determine stress cost (Critical = 0, 6 = 1, 4–5 = 2, 1–3 = 3) using Insight, Prowess, or Resolve

### Compendium Packs

Three compendium packs built from vault markdown:

- **Hidden London — Factions**: Criminal gangs, occult organisations, spirit courts, and institutions
- **Hidden London — Locations**: London districts from Mayfair to Jacob's Island
- **Hidden London — Reference**: Threat roll rules, faction directory, spirits, the hidden world, heritages & backgrounds

## Installation

### Manifest URL

In Foundry VTT, go to **Add-on Modules → Install Module** and paste:

```
https://github.com/pjgates/bitd-hidden-london/releases/latest/download/module.json
```

### Manual

1. Clone or download this repository
2. Run `npm install && npm run build`
3. Symlink or copy the project folder into your Foundry `Data/modules/` directory

## Development

Requires **Node.js 20+**.

```bash
# Install dependencies
npm install

# Build (TypeScript + SCSS + templates + lang merge)
npm run build

# Watch for changes
npm run watch

# Lint
npm run lint

# Convert vault markdown to compendium JSON
npm run convert -- --vault /path/to/vault/codex/hidden-london

# Compile JSON source into LevelDB packs
npm run compile-packs

# Symlink into Foundry
ln -s $(pwd) /path/to/foundryData/Data/modules/bitd-hidden-london
```

## Project Structure

```
src/
  module.ts              # Entry point (init + ready hooks)
  constants.ts           # Module ID
  hooks/                 # Foundry hook handlers
  threat-roll/           # Threat roll feature
    dialog.ts            # Roll configuration dialog
    roll.ts              # Dice execution + result interpretation
    push.ts              # Push yourself sub-roll
    chat.ts              # Chat message rendering
    scene-control.ts     # Scene control button registration
    settings.ts          # Module settings
    templates/           # Handlebars chat card templates
    styles/              # Feature-scoped SCSS
    lang/                # i18n strings
  shared/                # Cross-cutting types, styles, lang
  types/                 # Foundry/BitD type augmentations
scripts/
  convert-vault.ts       # Vault markdown → Foundry JSON
  compile-packs.ts       # JSON → LevelDB via fvtt CLI
```

## System Compatibility

- **Foundry VTT**: v12–v13
- **Blades in the Dark system**: v6.0.5+

## License

Content based on Blades in the Dark by John Harper, used under the Creative Commons Attribution 3.0 Unported license.
