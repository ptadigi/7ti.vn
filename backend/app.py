from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
import sys
import os
import json
import threading
import time
from datetime import datetime

# Import our agents from backend directory
from final_agent import FinalAgent
# from proxy_agent import ProxyAgent  # Comment out for now

# Import our new modules
from config.config import get_config
from config.database import init_db, get_db
from models import User, Customer, Bill, Sale, Proxy
from services.auth_service import auth_service
from services.customer_service import customer_service

# Import routes
from routes.auth import auth_bp
from routes.customers import customers_bp
from routes.bills import bills_bp
from routes.sales import sales_bp
from routes.reports import reports_bp
from routes.enhanced_proxy import enhanced_proxy_bp

# Initialize Flask app
app = Flask(__name__, 
           template_folder='../frontend/templates',
           static_folder='../frontend/static')

# Load configuration
config = get_config()
app.config.from_object(config)

# Initialize extensions (CORS for frontend dev + production)
allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
]
try:
    if isinstance(config.CORS_ORIGINS, (list, tuple)):
        for o in config.CORS_ORIGINS:
            if o not in allowed_origins:
                allowed_origins.append(o)
except Exception:
    pass

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)

jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins=allowed_origins)

@app.after_request
def apply_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    return response

# Initialize database (only when needed)
# init_db()

# Global variables for batch processing
batch_status = {
    'running': False,
    'progress': 0,
    'total': 0,
    'results': [],
    'errors': [],
    'start_time': None
}

# Proxy management
proxy_list = []

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(customers_bp)
app.register_blueprint(bills_bp)
app.register_blueprint(sales_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(enhanced_proxy_bp)

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'FPT Bill Manager API'
    })

@app.route('/api/check-single', methods=['POST'])
def check_single_contract():
    """Check a single contract code"""
    try:
        data = request.get_json()
        contract_code = data.get('contract_code', '').strip()
        
        if not contract_code:
            return jsonify({'error': 'Contract code is required'}), 400
        
        # Use FinalAgent for single check
        agent = FinalAgent()
        result = agent.query_bill(contract_code)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'message': 'Contract found successfully'
            })
        else:
            # Kiểm tra nếu là lỗi HTTP 400 từ API FPT Shop
            if 'HTTP 400' in result.get('error', ''):
                return jsonify({
                    'success': False,
                    'error': 'Mã hợp đồng không tồn tại hoặc không hợp lệ',
                    'message': 'Vui lòng kiểm tra lại mã hợp đồng',
                    'details': result.get('raw_response', '')
                }), 404
            else:
                return jsonify({
                    'success': False,
                    'error': result['error'],
                    'message': 'Failed to find contract'
                }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proxy/list', methods=['GET'])
def get_proxy_list():
    """Get current proxy list"""
    return jsonify({'proxies': proxy_list})

@app.route('/api/proxy/add', methods=['POST'])
def add_proxy():
    """Add a new proxy"""
    try:
        data = request.get_json()
        proxy = {
            'id': len(proxy_list) + 1,
            'type': data.get('type', 'http'),
            'host': data.get('host'),
            'port': int(data.get('port')),
            'username': data.get('username', ''),
            'password': data.get('password', ''),
            'note': data.get('note', ''),
            'status': 'untested',
            'added_at': datetime.now().isoformat()
        }
        
        if not proxy['host'] or not proxy['port']:
            return jsonify({'error': 'Host and port are required'}), 400
        
        proxy_list.append(proxy)
        return jsonify({'success': True, 'proxy': proxy})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proxy/remove/<int:proxy_id>', methods=['DELETE'])
def remove_proxy(proxy_id):
    """Remove a proxy"""
    global proxy_list
    proxy_list = [p for p in proxy_list if p['id'] != proxy_id]
    return jsonify({'success': True})

@app.route('/api/proxy/test/<int:proxy_id>', methods=['POST'])
def test_proxy(proxy_id):
    """Test a specific proxy"""
    try:
        proxy = next((p for p in proxy_list if p['id'] == proxy_id), None)
        if not proxy:
            return jsonify({'error': 'Proxy not found'}), 404
        
        # Simple test - just return proxy info for now
        return jsonify({
            'success': True,
            'proxy': proxy,
            'message': 'Proxy test endpoint (not implemented yet)'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/bulk-status', methods=['PUT'])
def test_bulk_status():
    """Test endpoint for bulk status update (no auth required)"""
    try:
        data = request.get_json()
        
        if not data.get('billIds') or not isinstance(data['billIds'], list):
            return jsonify({'error': 'billIds array is required'}), 400
        
        if not data.get('status'):
            return jsonify({'error': 'status is required'}), 400
        
        bill_ids = data['billIds']
        new_status = data['status']
        
        # Validate status
        valid_statuses = ['IN_WAREHOUSE', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'EXPIRED', 'CANCELLED']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        return jsonify({
            'success': True,
            'message': f'Test endpoint working. Would update {len(bill_ids)} bills to {new_status}',
            'billIds': bill_ids,
            'status': new_status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch/start', methods=['POST'])
def start_batch_processing():
    """Start batch processing of contract codes"""
    global batch_status
    
    if batch_status['running']:
        return jsonify({'error': 'Batch processing already running'}), 400
    
    try:
        data = request.get_json()
        contract_codes = data.get('contract_codes', [])
        use_proxy = data.get('use_proxy', False)
        
        if not contract_codes:
            return jsonify({'error': 'Contract codes are required'}), 400
        
        # Reset batch status
        batch_status = {
            'running': True,
            'progress': 0,
            'total': len(contract_codes),
            'results': [],
            'errors': [],
            'start_time': datetime.now().isoformat()
        }
        
        # Start batch processing in background thread
        thread = threading.Thread(
            target=process_batch_contracts,
            args=(contract_codes, use_proxy)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'message': 'Batch processing started'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch/status', methods=['GET'])
def get_batch_status():
    """Get current batch processing status"""
    return jsonify(batch_status)

@app.route('/api/batch/stop', methods=['POST'])
def stop_batch_processing():
    """Stop batch processing"""
    global batch_status
    batch_status['running'] = False
    return jsonify({'success': True, 'message': 'Batch processing stopped'})

def process_batch_contracts(contract_codes, use_proxy):
    """Process contracts in batch (runs in background thread)"""
    global batch_status
    
    try:
        # Choose agent based on proxy usage
        if use_proxy and proxy_list:
            # Convert proxy_list to format expected by ProxyAgent
            proxies = [{
                'type': p['type'],
                'host': p['host'],
                'port': p['port'],
                'username': p['username'],
                'password': p['password']
            } for p in proxy_list if p['status'] == 'working']
            
            if proxies:
                agent = ProxyAgent(proxy_list=proxies)
            else:
                agent = FinalAgent()  # Fallback to no proxy
        else:
            agent = FinalAgent()
        
        for i, contract_code in enumerate(contract_codes):
            if not batch_status['running']:
                break
            
            try:
                result = agent.query_bill(contract_code.strip())
                
                if result['success']:
                    batch_status['results'].append({
                        'contract_code': contract_code,
                        'success': True,
                        'data': result['data'],
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Emit real-time update
                    socketio.emit('batch_update', {
                        'type': 'success',
                        'contract_code': contract_code,
                        'data': result['data'],
                        'progress': i + 1,
                        'total': len(contract_codes)
                    })
                else:
                    batch_status['errors'].append({
                        'contract_code': contract_code,
                        'error': result['error'],
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Emit real-time update
                    socketio.emit('batch_update', {
                        'type': 'error',
                        'contract_code': contract_code,
                        'error': result['error'],
                        'progress': i + 1,
                        'total': len(contract_codes)
                    })
                
                batch_status['progress'] = i + 1
                
                # Add delay between requests
                time.sleep(1)
                
            except Exception as e:
                batch_status['errors'].append({
                    'contract_code': contract_code,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        batch_status['running'] = False
        batch_status['end_time'] = datetime.now().isoformat()
        
        # Emit completion
        socketio.emit('batch_complete', {
            'total_processed': batch_status['progress'],
            'successful': len(batch_status['results']),
            'failed': len(batch_status['errors'])
        })
        
    except Exception as e:
        batch_status['running'] = False
        batch_status['error'] = str(e)
        socketio.emit('batch_error', {'error': str(e)})

@app.route('/api/export/<format>', methods=['GET'])
def export_results(format):
    """Export batch results in different formats"""
    try:
        if format == 'json':
            return jsonify({
                'results': batch_status['results'],
                'errors': batch_status['errors'],
                'summary': {
                    'total': batch_status['total'],
                    'successful': len(batch_status['results']),
                    'failed': len(batch_status['errors']),
                    'start_time': batch_status.get('start_time'),
                    'end_time': batch_status.get('end_time')
                }
            })
        else:
            return jsonify({'error': 'Unsupported format'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 FPT Shop Contract Checker API - Enhanced Backend")
    print("📱 Frontend: http://localhost:3000")
    print("🔌 API: http://localhost:5001/api")
    print("🔐 Authentication: Enabled")
    print("🗄️ Database: PostgreSQL")
    print("👥 Customer Management: Enabled")
    socketio.run(app, debug=False, host='0.0.0.0', port=5001)