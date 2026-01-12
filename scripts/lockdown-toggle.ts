#!/usr/bin/env node
import * as sshpk from 'sshpk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SSH_KEY_PATH = process.env.SSH_PRIVATE_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa');

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL is not set');
  process.exit(1);
}

async function toggleLockdown(action: 'on' | 'off') {
  try {
    // Read private key
    if (!fs.existsSync(SSH_KEY_PATH)) {
      console.error(`❌ Private key not found at: ${SSH_KEY_PATH}`);
      console.error('Set SSH_PRIVATE_KEY_PATH environment variable to specify a different path');
      process.exit(1);
    }

    const privateKeyData = fs.readFileSync(SSH_KEY_PATH, 'utf8');
    const privateKey = sshpk.parsePrivateKey(privateKeyData, 'auto');

    console.log(`🔑 Using SSH key: ${SSH_KEY_PATH}`);
    console.log(`🌐 API URL: ${API_URL}`);

    // Get challenge from server
    console.log('\n📡 Requesting challenge...');
    const challengeResponse = await fetch(`${API_URL}/api/security/lockdown-challenge`, {
      method: 'POST'
    });

    if (!challengeResponse.ok) {
      console.error('❌ Failed to get challenge:', await challengeResponse.text());
      process.exit(1);
    }

    const { challenge } = await challengeResponse.json();
    console.log('✅ Challenge received');

    // Sign challenge
    console.log('✍️  Signing challenge...');
    const signer = privateKey.createSign('sha256');
    signer.update(Buffer.from(challenge));
    const signature = signer.sign();
    const signatureBase64 = signature.toBuffer('ssh').toString('base64');
    console.log('✅ Challenge signed');

    // Send signature and toggle lockdown
    console.log(`\n🔄 Toggling lockdown ${action}...`);
    const toggleResponse = await fetch(`${API_URL}/api/security/lockdown-toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge,
        signature: signatureBase64,
        action
      })
    });

    const result = await toggleResponse.json();

    if (!toggleResponse.ok) {
      console.error('❌ Failed to toggle lockdown:', result.error);
      process.exit(1);
    }

    console.log(`\n✅ ${result.message}`);
    console.log(`⏰ Timestamp: ${result.timestamp}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const action = process.argv[2] as 'on' | 'off' | undefined;

if (!action || (action !== 'on' && action !== 'off')) {
  console.log('Usage: npm run lockdown:toggle <on|off>');
  console.log('');
  console.log('Examples:');
  console.log('  npm run lockdown:toggle on   - Activate lockdown');
  console.log('  npm run lockdown:toggle off  - Deactivate lockdown');
  process.exit(1);
}

toggleLockdown(action);
