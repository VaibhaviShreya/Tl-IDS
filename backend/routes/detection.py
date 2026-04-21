"""
Detection API Routes
POST /api/detection/predict      - classify a single packet
POST /api/detection/batch        - classify a batch of packets
GET  /api/detection/stream       - server-sent events live stream
GET  /api/detection/attacks      - recent attack log
GET  /api/detection/stats        - detection statistics
"""

from flask import Blueprint, jsonify, request, Response
import random
import time
import json
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.ids_model import (
    simulate_predict, generate_packet, batch_generate,
    ATTACK_CLASSES, ATTACK_COLORS, ATTACK_SEVERITY,
    CLASS_WEIGHTS, FEATURE_NAMES
)

detection_bp = Blueprint('detection', __name__)

# In-memory attack log (last 200 events)
_attack_log = []

NODES = [f'SN-{i:03d}' for i in range(1, 301)]


def _log_entry(pred: dict, packet: dict) -> dict:
    node = random.choice(NODES)
    ts   = datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'
    entry = {
        'id':          len(_attack_log) + 1,
        'timestamp':   ts,
        'node':        node,
        'zone':        random.choice(['A', 'B', 'C', 'D']),
        'attack_type': pred['class_name'],
        'confidence':  pred['confidence'],
        'is_attack':   pred['is_attack'],
        'severity':    pred['severity'],
        'action':      pred['action'],
        'color':       pred['color'],
        'probabilities': pred['probabilities'],
        'src_bytes':   packet.get('src_bytes', 0),
        'dst_bytes':   packet.get('dst_bytes', 0),
        'protocol':    packet.get('protocol_type', 'tcp'),
        'inference_ms': pred['inference_ms'],
    }
    _attack_log.insert(0, entry)
    if len(_attack_log) > 200:
        _attack_log.pop()
    return entry


@detection_bp.route('/predict', methods=['POST'])
def predict():
    """Classify a single packet."""
    data = request.get_json(silent=True) or {}
    features = {k: data.get(k, 0) for k in FEATURE_NAMES}
    pred = simulate_predict(features)
    entry = _log_entry(pred, features)
    return jsonify({'success': True, 'result': entry})


@detection_bp.route('/batch', methods=['POST'])
def batch():
    """Generate and classify n synthetic packets."""
    n = min(int(request.args.get('n', 50)), 500)
    results = []
    for _ in range(n):
        pkt  = generate_packet()
        pred = simulate_predict(pkt)
        entry = _log_entry(pred, pkt)
        results.append(entry)
    return jsonify({'success': True, 'count': n, 'results': results})


@detection_bp.route('/stream')
def stream():
    """Server-Sent Events: push one live detection per second."""
    def event_generator():
        while True:
            pkt  = generate_packet()
            pred = simulate_predict(pkt)
            entry = _log_entry(pred, pkt)
            yield f"data: {json.dumps(entry)}\n\n"
            time.sleep(random.uniform(0.8, 1.5))
    return Response(event_generator(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


@detection_bp.route('/attacks')
def attacks():
    """Return recent attack events."""
    limit  = min(int(request.args.get('limit', 50)), 200)
    only_attacks = request.args.get('only_attacks', 'false').lower() == 'true'

    # Seed log if empty
    if not _attack_log:
        for _ in range(80):
            pkt  = generate_packet()
            pred = simulate_predict(pkt)
            _log_entry(pred, pkt)

    log = [e for e in _attack_log if e['is_attack']] if only_attacks else _attack_log
    return jsonify({'success': True, 'count': len(log[:limit]), 'events': log[:limit]})


@detection_bp.route('/stats')
def stats():
    """Aggregate detection statistics."""
    if not _attack_log:
        for _ in range(80):
            pkt  = generate_packet()
            pred = simulate_predict(pkt)
            _log_entry(pred, pkt)

    total   = len(_attack_log)
    attacks = [e for e in _attack_log if e['is_attack']]
    by_type = {}
    for e in attacks:
        t = e['attack_type']
        by_type[t] = by_type.get(t, 0) + 1

    return jsonify({
        'success': True,
        'total_packets':  total,
        'total_attacks':  len(attacks),
        'attack_rate':    round(len(attacks) / max(total, 1), 4),
        'avg_confidence': round(sum(e['confidence'] for e in attacks) / max(len(attacks), 1), 4),
        'by_type':        by_type,
        'severity_counts': {
            'critical': sum(1 for e in attacks if e['severity'] == 'critical'),
            'high':     sum(1 for e in attacks if e['severity'] == 'high'),
            'medium':   sum(1 for e in attacks if e['severity'] == 'medium'),
        }
    })