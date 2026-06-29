"""
Login / session handling for the app.

Passwords are HASHED, not encrypted, and that distinction matters: hashing
(via werkzeug's generate_password_hash, which uses a salted algorithm) is
one-way — there's no way to recover the original password from the hash,
even for us. Encryption would be reversible, which is the wrong tool for
storing passwords: nobody, including the app itself, should ever be able
to read a password back out. This is standard practice and is what every
production login system does.

Storage is a small SQLite database (users.db), created automatically on
first run. No extra dependencies beyond what's already in requirements.txt
since sqlite3 and werkzeug both ship with Flask.
"""

import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = 'users.db'


def init_db():
    """Creates the users table if it doesn't already exist. Safe to call every startup."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def create_user(username, password):
    """Returns True on success, False if the username is already taken."""
    password_hash = generate_password_hash(password)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # UNIQUE constraint failed — username taken
        return False
    finally:
        conn.close()


def verify_user(username, password):
    """Returns True if the username exists and the password matches its hash."""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        'SELECT password_hash FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if row is None:
        return False
    return check_password_hash(row[0], password)