import { NextRequest, NextResponse } from 'next/server';

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL!;

export async function POST(request: NextRequest) {
  try {
    const embed = {
      title: '🧪 Security System Test',
      color: 0x00FF00,
      fields: [
        { name: '✅ Status', value: 'All systems operational', inline: true },
        { name: '🕐 Time', value: new Date().toLocaleString(), inline: true },
        { name: '🔧 Test Type', value: 'Manual Discord Alert Test', inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Pageo Security System - Test Alert' }
    };

    const response = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
        content: '🧪 **Security System Test** - All systems operational!'
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Discord test alert sent' });
    } else {
      return NextResponse.json({ error: 'Failed to send Discord alert' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Discord test failed' }, { status: 500 });
  }
}
