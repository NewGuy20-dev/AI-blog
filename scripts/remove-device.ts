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

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SSH_PRIVATE_KEY_PATH = process.env.SSH_PRIVATE_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa');

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function removeDevice() {
  try {
    console.log('🗑️  SSH Device Removal (Dual Authentication Required)\n');

    if (!fs.existsSync(SSH_PRIVATE_KEY_PATH)) {
      console.error(`❌ Private key not found at: ${SSH_PRIVATE_KEY_PATH}`);
      process.exit(1);
    }

    // Step 1: Get challenge
    console.log('📡 Requesting challenge...');
    const challengeRes = await fetch(`${API_URL}/api/security/lockdown-challenge`, { method: 'POST' });
    if (!challengeRes.ok) {
      console.error('❌ Failed to get challenge');
      process.exit(1);
    }
    const { challenge } = await challengeRes.json();
    console.log('✅ Challenge received');

    // Step 2: Sign with private key
    console.log('✍️  Signing challenge...');
    const privateKeyData = fs.readFileSync(SSH_PRIVATE_KEY_PATH, 'utf8');
    const privateKey = sshpk.parsePrivateKey(privateKeyData, 'auto');
    const signer = privateKey.createSign('sha256');
    signer.update(Buffer.from(challenge));
    const signature = signer.sign().toBuffer('ssh').toString('base64');
    console.log('✅ Challenge signed');

    // Step 3: Get master key
    const masterKey = await prompt('\nEnter master key: ');
    if (!masterKey.trim()) {
      console.error('❌ Master key is required');
      process.exit(1);
    }

    // Step 4: Confirm
    const confirm = await prompt('\n⚠️  This will remove the authorized device. Type "REMOVE" to confirm: ');
    if (confirm !== 'REMOVE') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    // Step 5: Call removal endpoint
    console.log('\n📡 Removing device...');
    const removeRes = await fetch(`${API_URL}/api/security/device-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge, signature, masterKey: masterKey.trim() })
    });

    const result = await removeRes.json();
    if (!removeRes.ok) {
      console.error('❌ Failed to remove device:', result.error);
      process.exit(1);
    }

    console.log('\n✅ Device removed successfully!');
    console.log('⚠️  No device is now authorized for lockdown control.');
    console.log('   Run: npm run lockdown:register to register a new device.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDevice();
