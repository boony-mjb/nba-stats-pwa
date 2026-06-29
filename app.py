from flask import Flask, render_template
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

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
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('nrl_standings.html', api_key=api_key, active_page='standings')

@app.route('/nrl/rules')
def nrl_rules():
    return render_template('nrl_rules.html', active_page='rules')

@app.route('/bracket')
def bracket():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('bracket.html', api_key=api_key, active_page='bracket')

if __name__ == '__main__':
    app.run(debug=True)