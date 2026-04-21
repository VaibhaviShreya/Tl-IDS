"""
WSN Network Topology Model
Generates and manages sensor node states, zones, and routing topology.
"""

import random
import math
from datetime import datetime

# Zone definitions
ZONES = {
    'A': {'label': 'Zone A', 'cx': 0.25, 'cy': 0.30, 'color': '#38bdf8'},
    'B': {'label': 'Zone B', 'cx': 0.75, 'cy': 0.30, 'color': '#f472b6'},
    'C': {'label': 'Zone C', 'cx': 0.25, 'cy': 0.75, 'color': '#34d399'},
    'D': {'label': 'Zone D', 'cx': 0.75, 'cy': 0.75, 'color': '#818cf8'},
}

NODE_STATES = ['active', 'active', 'active', 'active', 'active', 'sleep', 'compromised']


def generate_nodes(count: int = 48) -> list:
    """Generate WSN sensor nodes distributed across 4 zones."""
    nodes = []
    per_zone = count // 4
    node_id = 1
    for zone_key, zone in ZONES.items():
        for i in range(per_zone):
            angle = (2 * math.pi * i / per_zone) + random.uniform(-0.3, 0.3)
            radius = random.uniform(0.04, 0.14)
            x = zone['cx'] + radius * math.cos(angle)
            y = zone['cy'] + radius * math.sin(angle)
            state = random.choices(
                ['active', 'sleep', 'compromised'],
                weights=[0.88, 0.09, 0.03], k=1
            )[0]
            energy = round(random.uniform(0.2, 1.0), 2)
            nodes.append({
                'id':       f'SN-{node_id:03d}',
                'zone':     zone_key,
                'x':        round(max(0.02, min(0.98, x)), 4),
                'y':        round(max(0.02, min(0.98, y)), 4),
                'state':    state,
                'energy':   energy,
                'hops':     random.randint(1, 5),
                'rssi':     round(random.uniform(-90, -40), 1),
                'packets_sent':     random.randint(100, 5000),
                'packets_dropped':  random.randint(0, 50),
                'color':    zone['color'],
            })
            node_id += 1
    # Gateway
    nodes.append({
        'id': 'GW-001', 'zone': 'GW',
        'x': 0.50, 'y': 0.52,
        'state': 'active', 'energy': 1.0,
        'hops': 0, 'rssi': 0.0,
        'packets_sent': sum(n['packets_sent'] for n in nodes),
        'packets_dropped': 0,
        'color': '#facc15',
    })
    return nodes


def get_topology_stats(nodes: list) -> dict:
    sensor_nodes = [n for n in nodes if n['zone'] != 'GW']
    return {
        'total_nodes':      len(sensor_nodes),
        'active_nodes':     sum(1 for n in sensor_nodes if n['state'] == 'active'),
        'sleeping_nodes':   sum(1 for n in sensor_nodes if n['state'] == 'sleep'),
        'compromised':      sum(1 for n in sensor_nodes if n['state'] == 'compromised'),
        'avg_energy':       round(sum(n['energy'] for n in sensor_nodes) / len(sensor_nodes), 3),
        'avg_hops':         round(sum(n['hops']   for n in sensor_nodes) / len(sensor_nodes), 2),
        'zones':            list(ZONES.keys()),
    }


# Singleton node list (simulates in-memory state)
_nodes = generate_nodes(48)


def get_nodes():
    return _nodes


def get_node(node_id: str):
    return next((n for n in _nodes if n['id'] == node_id), None)


def flag_node(node_id: str, reason: str):
    node = get_node(node_id)
    if node:
        node['state'] = 'compromised'
        node['flag_reason'] = reason
        node['flagged_at'] = datetime.utcnow().isoformat()
    return node