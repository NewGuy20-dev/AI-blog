#!/usr/bin/env node
import * as sshpk from 'sshpk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const SSH_PUBLIC_KEY_PATH = process.env.SSH_PUBLIC_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa.pub');

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function registerDevice() {
  try {
    console.log('🔐 SSH Device Registration\n');

    // Check if public key exists
    if (!fs.existsSync(SSH_PUBLIC_KEY_PATH)) {
      console.error(`❌ Public key not found at: ${SSH_PUBLIC_KEY_PATH}`);
      console.error('Set SSH_PUBLIC_KEY_PATH environment variable to specify a different path');
      process.exit(1);
    }

    // Read and parse public key
    const publicKeyData = fs.readFileSync(SSH_PUBLIC_KEY_PATH, 'utf8');
    const publicKey = sshpk.parseKey(publicKeyData, 'ssh');

    console.log(`📁 Public key: ${SSH_PUBLIC_KEY_PATH}`);
    console.log(`🔑 Key type: ${publicKey.type}`);
    console.log(`📏 Key size: ${publicKey.size} bits`);
    console.log(`🔍 Fingerprint: ${publicKey.fingerprint().toString()}\n`);

    // Get device name
    const deviceName = await prompt('Enter device name (e.g., "Admin Laptop"): ');
    if (!deviceName.trim()) {
      console.error('❌ Device name is required');
      process.exit(1);
    }

    // Get master key
    const masterKey = await prompt('Enter master key: ');
    if (!masterKey.trim()) {
      console.error('❌ Master key is required');
      process.exit(1);
    }

    console.log('\n📡 Registering device with Convex...');

    // Call Convex mutation directly
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'security:addAuthorizedDevice',
        args: {
          name: deviceName.trim(),
          publicKey: publicKeyData.trim(),
          keyType: publicKey.type,
          fingerprint: publicKey.fingerprint().toString(),
          addedBy: 'admin'
        },
        format: 'json'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to register device:', error);
      process.exit(1);
    }

    console.log('\n✅ Device registered successfully!');
    console.log(`📱 Device: ${deviceName}`);
    console.log(`🔑 Fingerprint: ${publicKey.fingerprint().toString()}`);
    console.log('\n🎉 You can now use: npm run lockdown:toggle <on|off>');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

registerDevice();
