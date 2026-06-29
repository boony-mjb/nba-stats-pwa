from flask import Flask, render_template, request, redirect, url_for, session
from dotenv import load_dotenv
import os
import secrets

import auth

load_dotenv()

app = Flask(__name__)
# SECRET_KEY signs the session cookie so it can't be tampered with client-side.
# Falls back to a random key if not set in .env — fine for local dev, but for
# a real deployment put a fixed SECRET_KEY in .env so sessions survive restarts.
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(16))

auth.init_db()

# Routes that don't require being logged in or in guest mode
PUBLIC_ROUTES = {'login', 'register', 'continue_as_guest', 'static'}


@app.before_request
def require_login():
    """Gate every route except login/register/static behind a session check."""
    if request.endpoint in PUBLIC_ROUTES or request.endpoint is None:
        return
    if 'username' not in session and not session.get('guest'):
        return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if auth.verify_user(username, password):
            session.clear()
            session['username'] = username
            return redirect(url_for('index'))
        else:
            error = 'Incorrect username or password.'

    return render_template('login.html', error=error)


@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm', '')

        if not username or not password:
            error = 'Username and password are required.'
        elif password != confirm:
            error = 'Passwords do not match.'
        elif len(password) < 6:
            error = 'Password must be at least 6 characters.'
        elif auth.create_user(username, password):
            session.clear()
            session['username'] = username
            return redirect(url_for('index'))
        else:
            error = 'That username is already taken.'

    return render_template('register.html', error=error)


@app.route('/guest')
def continue_as_guest():
    session.clear()
    session['guest'] = True
    return redirect(url_for('index'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


def current_user_label():
    """Used in templates to show 'Logged in as X' or 'Guest' in the nav."""
    if session.get('username'):
        return session['username']
    if session.get('guest'):
        return 'Guest'
    return None


app.jinja_env.globals['current_user_label'] = current_user_label


@app.route('/')
def index():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('index.html', api_key=api_key, active_page='scores')

@app.route('/playoffs')
def playoffs():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('playoffs.html', api_key=api_key, active_page='playoffs')

@app.route('/rules')
def rules():
    return render_template('rules.html', active_page='rules')

# --- NRL mini-app: its own nav, mirroring the NBA app's Scores/Teams/Standings ---

@app.route('/nrl')
def nrl():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('nrl.html', api_key=api_key, active_page='scores')

@app.route('/nrl/teams')
def nrl_teams():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('nrl_teams.html', api_key=api_key, active_page='teams')

@app.route('/nrl/standings')
def nrl_standings():
    return render_template('nrl_standings.html', active_page='standings')

@app.route('/nrl/rules')
def nrl_rules():
    return render_template('nrl_rules.html', active_page='rules')

@app.route('/bracket')
def bracket():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('bracket.html', api_key=api_key, active_page='bracket')

if __name__ == '__main__':
    app.run(debug=True)