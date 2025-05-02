import { createHmac } from 'crypto';

// Base32 decoding function
const base32Decode = (input) => {
  try {
    // Remove any spaces from the input
    const cleanInput = input.replace(/\s+/g, '');
    console.log('Cleaned input:', cleanInput);
    
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < cleanInput.length; i++) {
      const val = base32Chars.indexOf(cleanInput.charAt(i).toUpperCase());
      if (val === -1) {
        console.error('Invalid base32 character:', cleanInput.charAt(i));
        return null;
      }
      bits += val.toString(2).padStart(5, '0');
    }
    console.log('Decoded bits length:', bits.length);
    return bits;
  } catch (error) {
    console.error('Error in base32Decode:', error);
    return null;
  }
};

// Convert binary string to bytes
const binaryToBytes = (binary) => {
  try {
    const bytes = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      bytes.push(parseInt(byte, 2));
    }
    console.log('Converted bytes:', bytes);
    return Buffer.from(bytes);
  } catch (error) {
    console.error('Error in binaryToBytes:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({ error: 'Secret is required' });
    }

    console.log('Received secret:', secret);

    // Decode base32 secret
    const bits = base32Decode(secret);
    if (!bits) {
      console.error('Failed to decode base32 secret');
      return res.status(400).json({ error: 'Invalid base32 secret' });
    }

    // Get current time in 30-second intervals
    const time = Math.floor(Date.now() / 1000 / 30);
    console.log('Time value:', time);
    
    // Create time bytes without modifying the time variable
    const timeBytes = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      timeBytes[7 - i] = (time >>> (i * 8)) & 0xff;
    }
    console.log('Time bytes:', timeBytes);

    // Create HMAC-SHA1 hash
    const key = binaryToBytes(bits);
    console.log('Key length:', key.length);
    
    const hmac = createHmac('sha1', key);
    hmac.update(timeBytes);
    const hash = hmac.digest();
    console.log('Hash length:', hash.length);

    // Get offset from last 4 bits
    const offset = hash[hash.length - 1] & 0xf;
    console.log('Offset:', offset);
    
    // Get 4 bytes starting at offset
    const binary = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    );
    console.log('Binary value:', binary);

    // Generate 6-digit code
    const code = (binary % 1000000).toString().padStart(6, '0');
    console.log('Generated TOTP code:', code);
    
    return res.status(200).json({ code });
  } catch (error) {
    console.error('Error generating TOTP:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to generate TOTP code',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 