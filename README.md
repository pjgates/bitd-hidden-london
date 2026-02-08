# Hidden London

A [Foundry VTT](https://foundryvtt.com/) module for the [Blades in the Dark](https://github.com/Dez384/foundryvtt-blades-in-the-dark) system, implementing the **Hidden London** setting — occult-industrial 1820s London where criminal crews navigate both the mundane underworld and a hidden world of spirits, bargains, and ancient debts.

## Features

### Push Yourself Buttons

When an action roll results in a **failure** or **partial success**, this module injects attribute buttons directly onto the chat card so players can quickly push themselves without navigating back to the character sheet.

- Three buttons appear — **Insight**, **Prowess**, **Resolve** — each showing the actor's current dice pool
- Clicking a button opens the system's standard attribute roll dialog for that attribute
- All push mechanics (stress calculation, chat output) are handled by the upstream Blades in the Dark system
- Controlled by the **Enable Push Yourself** world setting

> **Note:** The upstream system's **Push Yourself** setting (from Deep Cuts) must be enabled for push rolls to use the Deep Cuts stress table. Otherwise the system treats attribute rolls as standard resistance rolls.

### Compendium Packs

Three compendium packs built from vault markdown:

- **Hidden London — Factions**: Criminal gangs, occult organisations, spirit courts, and institutions
- **Hidden London — Locations**: London districts from Mayfair to Jacob's Island
- **Hidden London — Reference**: Faction directory, spirits, the hidden world, heritages & backgrounds

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

# Build (TypeScript + SCSS + lang merge)
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
  push-yourself/         # Push yourself chat button feature
    chat.ts              # Injects buttons into system action roll cards
    settings.ts          # Module settings
    styles/              # Feature-scoped SCSS
    lang/                # i18n strings
  shared/                # Cross-cutting styles, lang
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
