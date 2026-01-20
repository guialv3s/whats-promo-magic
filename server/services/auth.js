import crypto from 'crypto';

// Fixed credentials
const FIXED_USERNAME = 'ShazamOfertas';
const FIXED_PASSWORD = 'Pipokets26042003!';
const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class AuthService {
    constructor() {
        this.sessions = new Map(); // sessionToken -> { username, expiresAt }
        this.cleanupInterval = setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000); // Cleanup every hour
    }

    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    login(username, password) {
        // Validate against fixed credentials
        if (username !== FIXED_USERNAME || password !== FIXED_PASSWORD) {
            throw new Error('Usuário ou senha inválidos');
        }

        // Generate session token with expiration
        const token = this.generateToken();
        const expiresAt = Date.now() + TOKEN_EXPIRATION_MS;

        this.sessions.set(token, {
            username: FIXED_USERNAME,
            expiresAt
        });

        console.log(`✅ Login realizado: ${username} (expira em 24h)`);

        return {
            token,
            username: FIXED_USERNAME,
            expiresAt
        };
    }

    validateToken(token) {
        const session = this.sessions.get(token);

        if (!session) {
            return false;
        }

        // Check if token has expired
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(token);
            console.log('⏰ Token expirado e removido');
            return false;
        }

        return true;
    }

    getUserFromToken(token) {
        const session = this.sessions.get(token);
        return session?.username;
    }

    logout(token) {
        this.sessions.delete(token);
        console.log('👋 Logout realizado');
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        let cleaned = 0;

        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} token(s) expirado(s) removido(s)`);
        }
    }

    // Cleanup on shutdown
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
