from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory, jsonify
from dotenv import load_dotenv
import os
import secrets
import urllib.request
import json

import auth

load_dotenv()

app = Flask(__name__)
# SECRET_KEY signs the session cookie so it can't be tampered with client-side.
# Falls back to a random key if not set in .env — fine for local dev, but for
# a real deployment put a fixed SECRET_KEY in .env so sessions survive restarts.
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(16))

auth.init_db()

# Routes that don't require being logged in or in guest mode
PUBLIC_ROUTES = {'login', 'register', 'continue_as_guest', 'static', 'manifest', 'service_worker'}


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


@app.route('/api/predict', methods=['POST'])
def predict():
    anthropic_key = os.getenv('ANTHROPIC_API_KEY', '')
    print(f"[predict] API key loaded: {'YES (len=' + str(len(anthropic_key)) + ')' if anthropic_key else 'NO - key is empty'}")

    if not anthropic_key:
        return jsonify({'error': 'ANTHROPIC_API_KEY not set in .env'}), 500

    body = request.get_json(silent=True) or {}
    home_team = body.get('homeTeam', '')
    away_team = body.get('awayTeam', '')
    league    = body.get('league', 'NBA')

    if not home_team or not away_team:
        return jsonify({'error': 'homeTeam and awayTeam are required'}), 400

    prompt = f"""You are a sports analytics assistant. Given a {league} matchup, generate a win-probability prediction.

Matchup: {home_team} (Home) vs {away_team} (Away)

Respond with ONLY valid JSON, no extra text, no markdown. Use this exact format:
{{"homePct": <integer 0-100>, "awayPct": <integer 0-100>, "factors": ["<factor 1>", "<factor 2>", "<factor 3>"]}}

homePct + awayPct must equal exactly 100."""

    payload = json.dumps({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 300,
        'messages': [{'role': 'user', 'content': prompt}]
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'Content-Type':      'application/json',
            'x-api-key':         anthropic_key,
            'anthropic-version': '2023-06-01'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data    = json.loads(resp.read().decode('utf-8'))
            text    = ''.join(b.get('text', '') for b in data.get('content', []))
            clean   = text.strip().lstrip('```json').rstrip('```').strip()
            parsed  = json.loads(clean)
            print(f"[predict] Success: {parsed}")
            return jsonify(parsed)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[predict] Anthropic HTTP error {e.code}: {error_body}")
        return jsonify({'error': f'Anthropic API error {e.code}: {error_body}'}), 500
    except Exception as e:
        print(f"[predict] Unexpected error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json', mimetype='application/manifest+json')

@app.route('/sw.js')
def service_worker():
    return send_from_directory('.', 'sw.js', mimetype='application/javascript')

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