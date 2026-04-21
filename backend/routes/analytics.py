"""
Analytics API Routes
GET /api/analytics/metrics        - model performance metrics
GET /api/analytics/training       - training history curves
GET /api/analytics/confusion      - confusion matrix
GET /api/analytics/baselines      - baseline model comparison
GET /api/analytics/features       - SHAP feature importances
GET /api/analytics/timeline       - hourly attack timeline
"""

from flask import Blueprint, jsonify, request
import random
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.ids_model import (
    TRAINING_HISTORY, CONFUSION_MATRIX, MODEL_METRICS,
    BASELINE_COMPARISON, FEATURE_IMPORTANCES, ATTACK_CLASSES
)

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/metrics')
def metrics():
    return jsonify({'success': True, 'metrics': MODEL_METRICS})


@analytics_bp.route('/training')
def training():
    return jsonify({'success': True, 'history': TRAINING_HISTORY})


@analytics_bp.route('/confusion')
def confusion():
    labels = [ATTACK_CLASSES[i] for i in range(6)]
    return jsonify({
        'success': True,
        'labels':  labels,
        'matrix':  CONFUSION_MATRIX,
    })


@analytics_bp.route('/baselines')
def baselines():
    return jsonify({'success': True, 'baselines': BASELINE_COMPARISON})


@analytics_bp.route('/features')
def features():
    fi = sorted(FEATURE_IMPORTANCES.items(), key=lambda x: x[1], reverse=True)
    return jsonify({
        'success':  True,
        'features': [{'name': k, 'importance': v} for k, v in fi],
    })


@analytics_bp.route('/timeline')
def timeline():
    """24-hour attack timeline (hourly buckets)."""
    hours = []
    base = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    for i in range(24, 0, -1):
        t = base - timedelta(hours=i)
        normal  = random.randint(80, 180)
        attacks = random.randint(0, 15)
        hours.append({
            'hour':    t.strftime('%H:00'),
            'normal':  normal,
            'attacks': attacks,
            'total':   normal + attacks,
        })
    return jsonify({'success': True, 'timeline': hours})


@analytics_bp.route('/roc')
def roc():
    """Synthetic ROC curve points per class."""
    import math
    curves = {}
    aucs   = {
        'Normal': 0.999, 'DoS/DDoS': 0.994, 'Sinkhole': 0.981,
        'Replay': 0.987, 'Blackhole': 0.992, 'Wormhole': 0.972,
    }
    for cls, auc in aucs.items():
        pts = []
        for fpr in [i/100 for i in range(0, 101, 5)]:
            tpr = min(1.0, fpr + auc * (1 - fpr) + random.uniform(-0.005, 0.005))
            pts.append({'fpr': round(fpr, 3), 'tpr': round(max(fpr, tpr), 3)})
        curves[cls] = {'points': pts, 'auc': auc}
    return jsonify({'success': True, 'curves': curves})