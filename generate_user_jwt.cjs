const crypto = require('crypto');

function base64urlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function createUserJWT() {
    const secret = 'LmGZykjzjOhAxAVIMxzEFZUbNxneDAvr1mUvaO4WV5QJ35rUQV609NJ3HcemTC07';
    
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    // Simular um usuário autenticado
    const payload = {
        iss: 'supabase',
        ref: 'supabase-instance-manager',
        role: 'authenticated',
        sub: 'b5e765f5-b0f0-49c8-b1e0-b205c452d956', // ID do super admin
        aud: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(encodedHeader + '.' + encodedPayload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    return encodedHeader + '.' + encodedPayload + '.' + signature;
}

console.log(createUserJWT());