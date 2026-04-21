"""Model Info API Routes"""
from flask import Blueprint, jsonify
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from models.ids_model import (
    ATTACK_CLASSES, FEATURE_NAMES, MODEL_METRICS,
    BASELINE_COMPARISON, FEATURE_IMPORTANCES
)

model_bp = Blueprint('model', __name__)

@model_bp.route('/info')
def info():
    return jsonify({
        'success': True,
        'model': {
            'name':           'TL-IDS v1.0',
            'architecture':   'Domain-Adversarial CNN + Fine-tuned on WSN',
            'source_domains': ['NSL-KDD', 'UNSW-NB15', 'IoT-23', 'SCADA'],
            'target_domain':  'WSN (Contiki/COOJA)',
            'classes':        list(ATTACK_CLASSES.values()),
            'n_features':     len(FEATURE_NAMES),
            'feature_names':  FEATURE_NAMES,
            'layers': [
                {'name': 'Input',      'units': 41,  'frozen': True},
                {'name': 'Dense-256',  'units': 256, 'frozen': True},
                {'name': 'BatchNorm',  'units': 256, 'frozen': True},
                {'name': 'Dense-128',  'units': 128, 'frozen': True},
                {'name': 'BatchNorm',  'units': 128, 'frozen': True},
                {'name': 'Dense-64',   'units': 64,  'frozen': False},
                {'name': 'Dropout-0.3','units': 64,  'frozen': False},
                {'name': 'Dense-32',   'units': 32,  'frozen': False},
                {'name': 'Softmax-6',  'units': 6,   'frozen': False},
            ],
            'hyperparams': {
                'optimizer':     'Adam',
                'lr_pretrain':   '1e-4',
                'lr_finetune':   '1e-5',
                'batch_size':    64,
                'epochs_pretrain': 50,
                'epochs_finetune': 30,
                'loss':          'categorical_crossentropy',
                'regularization':'dropout + L2',
                'normalization': 'min-max',
                'split':         '70/15/15',
                'smote':         True,
            },
            'metrics': MODEL_METRICS,
        }
    })

@model_bp.route('/baselines')
def baselines():
    return jsonify({'success': True, 'baselines': BASELINE_COMPARISON})