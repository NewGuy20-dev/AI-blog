#!/usr/bin/env node
import * as sshpk from 'sshpk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

// Environment validation
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SSH_PUBLIC_KEY_PATH = process.env.SSH_PUBLIC_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa.pub');
const SSH_PRIVATE_KEY_PATH = process.env.SSH_PRIVATE_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa');

if (!CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL is not set');
  process.exit(1);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function convexQuery(fnPath: string, args: object = {}) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).value;
}

async function convexMutation(fnPath: string, args: object) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).value;
}

async function registerDevice() {
  try {
    console.log('🔐 SSH Device Registration\n');

    if (!fs.existsSync(SSH_PUBLIC_KEY_PATH)) {
      console.error(`❌ Public key not found at: ${SSH_PUBLIC_KEY_PATH}`);
      process.exit(1);
    }

    const publicKeyData = fs.readFileSync(SSH_PUBLIC_KEY_PATH, 'utf8');
    const publicKey = sshpk.parseKey(publicKeyData, 'ssh');
    const fingerprint = publicKey.fingerprint().toString();

    console.log(`📁 Public key: ${SSH_PUBLIC_KEY_PATH}`);
    console.log(`🔑 Key type: ${publicKey.type}`);
    console.log(`🔍 Fingerprint: ${fingerprint}\n`);

    // Check if device already exists
    const existingDevice = await convexQuery('security:getAuthorizedDevice');

    if (existingDevice) {
      console.log('⚠️  A device is already registered!');
      console.log(`   Name: ${existingDevice.name}`);
      console.log(`   Fingerprint: ${existingDevice.fingerprint}\n`);
      console.log('To replace it, you must prove ownership of the existing device.\n');

      // Check if private key exists for signing
      if (!fs.existsSync(SSH_PRIVATE_KEY_PATH)) {
        console.error(`❌ Private key not found at: ${SSH_PRIVATE_KEY_PATH}`);
        console.error('You need the existing device\'s private key to replace it.');
        process.exit(1);
      }

      // Get challenge
      console.log('📡 Requesting challenge...');
      const challengeRes = await fetch(`${API_URL}/api/security/lockdown-challenge`, { method: 'POST' });
      if (!challengeRes.ok) {
        console.error('❌ Failed to get challenge');
        process.exit(1);
      }
      const { challenge } = await challengeRes.json();

      // Sign with existing private key
      console.log('✍️  Sign with your EXISTING device\'s private key to authorize replacement...');
      const privateKeyData = fs.readFileSync(SSH_PRIVATE_KEY_PATH, 'utf8');
      const privateKey = sshpk.parsePrivateKey(privateKeyData, 'auto');
      const signer = privateKey.createSign('sha256');
      signer.update(Buffer.from(challenge));
      const signature = signer.sign().toBuffer('ssh').toString('base64');

      // Get new device name
      const deviceName = await prompt('Enter NEW device name: ');
      if (!deviceName.trim()) {
        console.error('❌ Device name is required');
        process.exit(1);
      }

      // Call replace endpoint
      console.log('\n📡 Replacing device...');
      const replaceRes = await fetch(`${API_URL}/api/security/device-replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          signature,
          newDevice: {
            name: deviceName.trim(),
            publicKey: publicKeyData.trim(),
            keyType: publicKey.type,
            fingerprint
          }
        })
      });

      if (!replaceRes.ok) {
        const err = await replaceRes.json();
        console.error('❌ Failed to replace device:', err.error);
        process.exit(1);
      }

      console.log('\n✅ Device replaced successfully!');
    } else {
      // First registration - requires master key
      const deviceName = await prompt('Enter device name (e.g., "Admin Laptop"): ');
      if (!deviceName.trim()) {
        console.error('❌ Device name is required');
        process.exit(1);
      }

      const masterKey = await prompt('Enter master key: ');
      if (!masterKey.trim()) {
        console.error('❌ Master key is required');
        process.exit(1);
      }

      // Validate master key
      console.log('\n🔑 Validating master key...');
      const isValid = await convexQuery('admin:validateMasterKey', { key: masterKey.trim() });
      if (!isValid) {
        console.error('❌ Invalid master key');
        process.exit(1);
      }

      // Register device
      console.log('📡 Registering device...');
      await convexMutation('security:addAuthorizedDevice', {
        name: deviceName.trim(),
        publicKey: publicKeyData.trim(),
        keyType: publicKey.type,
        fingerprint,
        addedBy: 'admin'
      });

      console.log('\n✅ Device registered successfully!');
    }

    console.log(`📱 Device fingerprint: ${fingerprint}`);
    console.log('\n🎉 You can now use: npm run lockdown:toggle <on|off>');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

registerDevice();
