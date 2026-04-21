"""Network API Routes"""
from flask import Blueprint, jsonify, request
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from generators.wsn_network import get_nodes, get_node, flag_node, get_topology_stats, ZONES

network_bp = Blueprint('network', __name__)

@network_bp.route('/nodes')
def nodes():
    n = get_nodes()
    return jsonify({'success': True, 'count': len(n), 'nodes': n, 'zones': ZONES})

@network_bp.route('/nodes/<node_id>')
def node_detail(node_id):
    n = get_node(node_id)
    if not n:
        return jsonify({'success': False, 'error': 'Node not found'}), 404
    return jsonify({'success': True, 'node': n})

@network_bp.route('/nodes/<node_id>/flag', methods=['POST'])
def flag(node_id):
    reason = (request.get_json(silent=True) or {}).get('reason', 'Manual flag')
    n = flag_node(node_id, reason)
    if not n:
        return jsonify({'success': False, 'error': 'Node not found'}), 404
    return jsonify({'success': True, 'node': n})

@network_bp.route('/stats')
def stats():
    n = get_nodes()
    return jsonify({'success': True, 'stats': get_topology_stats(n)})