#!/usr/bin/env node
/*
 * Reproduce the part of Publii's plugin loader that matters for development:
 * it scans the plugins directory, follows directory symlinks, validates that
 * plugin.json exists, requires main.js, and calls addEvents().
 *
 * Usage:
 *   node scripts/check-plugin-loader.js [pluginName]
 *
 * Environment:
 *   PUBLII_HOME   Override the Publii data directory
 *                 (default: ~/Documents/Publii)
 *
 * This is a local development smoke check. It is skipped automatically by
 * scripts/test-all.sh on machines without a Publii installation.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const pluginName = process.argv[2] || 'mirlaPlugin';
const publiiHome = process.env.PUBLII_HOME || path.join(os.homedir(), 'Documents', 'Publii');
const pluginsDir = path.join(publiiHome, 'plugins');
const pluginDir = path.join(pluginsDir, pluginName);

function fail(message) {
  console.error(`[check-plugin-loader] ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(pluginsDir)) {
  fail(`Publii plugins directory not found: ${pluginsDir}`);
}

const entries = fs.readdirSync(pluginsDir);
if (!entries.includes(pluginName)) {
  fail(`Plugin "${pluginName}" is not present in ${pluginsDir}. Run scripts/link-plugin.sh --apply.`);
}

const stat = fs.statSync(pluginDir); // follows symlinks, like Publii
if (!stat.isDirectory()) {
  fail(`${pluginDir} is not a directory (after following symlinks).`);
}

const manifestPath = path.join(pluginDir, 'plugin.json');
if (!fs.existsSync(manifestPath)) {
  fail(`Missing plugin manifest: ${manifestPath}`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`Invalid plugin.json: ${error.message}`);
}

if (!manifest.name || !manifest.version || !manifest.scope) {
  fail('plugin.json is missing name/version/scope.');
}

const mainPath = path.join(pluginDir, 'main.js');
if (!fs.existsSync(mainPath)) {
  fail(`Missing plugin entry point: ${mainPath}`);
}

const Plugin = require(mainPath);
if (typeof Plugin !== 'function') {
  fail('main.js does not export a constructor function.');
}

const registered = { events: [], insertions: [], modifiers: [] };
const api = {
  addEvent(name, callback, priority, instance) {
    registered.events.push({ name, callback, priority, instance });
  },
  addInsertion(name, callback, priority, instance) {
    registered.insertions.push({ name, callback, priority, instance });
  },
  addModifier(name, callback, priority, instance) {
    registered.modifiers.push({ name, callback, priority, instance });
  }
};

let instance;
try {
  instance = new Plugin(api, pluginName, {});
} catch (error) {
  fail(`Could not instantiate the plugin: ${error.message}`);
}

if (typeof instance.addEvents === 'function') {
  instance.addEvents();
}
if (typeof instance.addInsertions === 'function') {
  instance.addInsertions();
}
if (typeof instance.addModifiers === 'function') {
  instance.addModifiers();
}

const afterRender = registered.events.find(event => event.name === 'afterRender');
if (!afterRender) {
  fail('The plugin did not register an afterRender event.');
}

console.log('[check-plugin-loader] OK');
console.log(`  plugin       : ${manifest.name} v${manifest.version}`);
console.log(`  directory    : ${pluginDir}`);
console.log(`  resolved     : ${require.resolve(mainPath)}`);
console.log(`  is symlink   : ${fs.lstatSync(pluginDir).isSymbolicLink()}`);
console.log(`  afterRender  : priority ${afterRender.priority}`);
console.log(`  events       : ${registered.events.map(event => event.name).join(', ') || '(none)'}`);
if (registered.modifiers.length > 0) {
  console.log(`  modifiers    : ${registered.modifiers.map(modifier => modifier.name).join(', ')}`);
}
