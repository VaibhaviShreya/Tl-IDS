"""
TL-IDS: Transfer Learning Intrusion Detection System
Flask Backend API - Main Application Entry Point
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from routes.detection import detection_bp
from routes.analytics import analytics_bp
from routes.network import network_bp
from routes.model import model_bp

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static'),
    template_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'templates')
)
CORS(app)

# Register blueprints
app.register_blueprint(detection_bp,  url_prefix='/api/detection')
app.register_blueprint(analytics_bp,  url_prefix='/api/analytics')
app.register_blueprint(network_bp,    url_prefix='/api/network')
app.register_blueprint(model_bp,      url_prefix='/api/model')


@app.route('/')
def index():
    from flask import render_template
    return render_template('index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'version': '1.0.0', 'system': 'TL-IDS'})


if __name__ == '__main__':
    print("=" * 60)
    print("  TL-IDS — Transfer Learning Intrusion Detection System")
    print("  Starting server at http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)