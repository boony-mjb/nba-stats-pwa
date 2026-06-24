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

@app.route('/nrl')
def nrl():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('nrl.html', api_key=api_key, active_page='nrl')

@app.route('/bracket')
def bracket():
    api_key = os.getenv('SPORTS_DB_KEY', '')
    return render_template('bracket.html', api_key=api_key, active_page='bracket')

if __name__ == '__main__':
    app.run(debug=True)