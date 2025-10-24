import * as bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users.db');

// Créer le dossier data s'il n'existe pas
import * as fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialiser la base de données
const db = new Database(DB_PATH);

// Créer la table users si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Créer la table sessions si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Créer les index
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`);

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export class UserDB {
  /**
   * Créer un nouvel utilisateur
   */
  static createUser(username: string, password: string): User | null {
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      const result = stmt.run(username, hashedPassword);

      return this.getUserById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Vérifier les identifiants et retourner l'utilisateur si valides
   */
  static verifyUser(username: string, password: string): User | null {
    try {
      const user = this.getUserByUsername(username);
      if (!user) return null;

      const isValid = bcrypt.compareSync(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('Error verifying user:', error);
      return null;
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  static getUserById(id: number): User | null {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      return stmt.get(id) as User | null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  /**
   * Récupérer un utilisateur par son username
   */
  static getUserByUsername(username: string): User | null {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      return stmt.get(username) as User | null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  /**
   * Vérifier si un username existe déjà
   */
  static usernameExists(username: string): boolean {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
      const result = stmt.get(username) as { count: number };
      return result.count > 0;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  /**
   * Vérifier si au moins un utilisateur existe
   */
  static hasAnyUser(): boolean {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
      const result = stmt.get() as { count: number };
      return result.count > 0;
    } catch (error) {
      console.error('Error checking if users exist:', error);
      return false;
    }
  }

  /**
   * Créer une session pour un utilisateur
   */
  static createSession(userId: number): string | null {
    try {
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours

      const stmt = db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
      stmt.run(userId, token, expiresAt.toISOString());

      return token;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  /**
   * Récupérer un utilisateur à partir d'un token de session
   */
  static getUserByToken(token: string): User | null {
    try {
      const stmt = db.prepare(`
        SELECT u.* FROM users u
        INNER JOIN sessions s ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `);
      return stmt.get(token) as User | null;
    } catch (error) {
      console.error('Error getting user by token:', error);
      return null;
    }
  }

  /**
   * Supprimer une session (logout)
   */
  static deleteSession(token: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
      const result = stmt.run(token);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  /**
   * Nettoyer les sessions expirées
   */
  static cleanExpiredSessions(): void {
    try {
      const stmt = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')");
      stmt.run();
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  /**
   * Générer un token aléatoire
   */
  private static generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }
}

// Nettoyer les sessions expirées au démarrage
UserDB.cleanExpiredSessions();

export default db;
