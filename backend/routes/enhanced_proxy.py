from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.enhanced_proxy_service import enhanced_proxy_service
from datetime import datetime

enhanced_proxy_bp = Blueprint('enhanced_proxy', __name__, url_prefix='/api/enhanced-proxy')

@enhanced_proxy_bp.route('/bulk-add', methods=['POST'])
@jwt_required()
def bulk_add_proxies():
    """Add multiple proxies in bulk"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not data.get('proxies') or not isinstance(data['proxies'], list):
            return jsonify({'error': 'proxies array is required'}), 400
        
        proxy_list = data['proxies']
        if len(proxy_list) == 0:
            return jsonify({'error': 'proxies array cannot be empty'}), 400
        
        # Validate each proxy has required fields
        for proxy_data in proxy_list:
            if not proxy_data.get('host') or not proxy_data.get('port'):
                return jsonify({'error': 'Each proxy must have host and port'}), 400
        
        result = enhanced_proxy_service.bulk_add_proxies(proxy_list, user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/bulk-test', methods=['POST'])
@jwt_required()
def bulk_test_proxies():
    """Test multiple proxies in bulk"""
    try:
        data = request.get_json()
        
        proxy_ids = data.get('proxy_ids', None)
        test_all = data.get('test_all', False)
        
        if not test_all and (not proxy_ids or not isinstance(proxy_ids, list)):
            return jsonify({'error': 'Must specify proxy_ids array or test_all=true'}), 400
        
        result = enhanced_proxy_service.bulk_test_proxies(proxy_ids, test_all)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/rotate', methods=['POST'])
@jwt_required()
def rotate_proxies():
    """Rotate proxies for load balancing"""
    try:
        data = request.get_json() or {}
        
        rotation_type = data.get('rotation_type', 'round_robin')
        max_concurrent = data.get('max_concurrent', 5)
        
        # Validate rotation type
        valid_types = ['round_robin', 'performance_based', 'random']
        if rotation_type not in valid_types:
            return jsonify({'error': f'Invalid rotation_type. Must be one of: {valid_types}'}), 400
        
        # Validate max_concurrent
        try:
            max_concurrent = int(max_concurrent)
            if max_concurrent < 1 or max_concurrent > 20:
                return jsonify({'error': 'max_concurrent must be between 1 and 20'}), 400
        except ValueError:
            return jsonify({'error': 'max_concurrent must be a valid integer'}), 400
        
        result = enhanced_proxy_service.rotate_proxies(rotation_type, max_concurrent)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_proxy_statistics():
    """Get comprehensive proxy statistics"""
    try:
        result = enhanced_proxy_service.get_proxy_statistics()
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_inactive_proxies():
    """Clean up inactive proxies"""
    try:
        data = request.get_json() or {}
        days_inactive = data.get('days_inactive', 30)
        
        # Validate days_inactive
        try:
            days_inactive = int(days_inactive)
            if days_inactive < 1 or days_inactive > 365:
                return jsonify({'error': 'days_inactive must be between 1 and 365'}), 400
        except ValueError:
            return jsonify({'error': 'days_inactive must be a valid integer'}), 400
        
        result = enhanced_proxy_service.cleanup_inactive_proxies(days_inactive)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/export', methods=['GET'])
@jwt_required()
def export_proxy_list():
    """Export proxy list"""
    try:
        format_type = request.args.get('format', 'json')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        # Validate format
        valid_formats = ['json', 'txt']
        if format_type not in valid_formats:
            return jsonify({'error': f'Invalid format. Must be one of: {valid_formats}'}), 400
        
        result = enhanced_proxy_service.export_proxy_list(format_type, include_inactive)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/health-check', methods=['GET'])
@jwt_required()
def proxy_health_check():
    """Check health of proxy system"""
    try:
        # Get basic statistics
        stats_result = enhanced_proxy_service.get_proxy_statistics()
        
        if not stats_result['success']:
            return jsonify(stats_result), 400
        
        # Check if we have any active proxies
        active_count = stats_result['statistics']['active_proxies']
        
        health_status = 'healthy' if active_count > 0 else 'warning'
        health_message = f'Proxy system is {health_status}. {active_count} active proxies available.'
        
        return jsonify({
            'success': True,
            'health': {
                'status': health_status,
                'message': health_message,
                'active_proxies': active_count,
                'total_proxies': stats_result['statistics']['total_proxies'],
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_proxy_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_proxy_performance():
    """Get detailed proxy performance metrics"""
    try:
        # Get statistics
        stats_result = enhanced_proxy_service.get_proxy_statistics()
        
        if not stats_result['success']:
            return jsonify(stats_result), 400
        
        # Calculate performance metrics
        stats = stats_result['statistics']
        
        # Performance score (0-100)
        if stats['active_proxies'] > 0:
            avg_response_time = stats['performance']['average_response_time']
            avg_success_rate = stats['performance']['average_success_rate']
            
            # Calculate performance score based on response time and success rate
            response_score = max(0, 100 - (avg_response_time * 10))  # Lower response time = higher score
            success_score = avg_success_rate
            
            performance_score = (response_score + success_score) / 2
        else:
            performance_score = 0
        
        # Performance recommendations
        recommendations = []
        if stats['active_proxies'] == 0:
            recommendations.append("No active proxies. Consider adding new proxies.")
        
        if stats['performance']['average_response_time'] > 5.0:
            recommendations.append("High response times detected. Consider testing and replacing slow proxies.")
        
        if stats['performance']['average_success_rate'] < 80:
            recommendations.append("Low success rate detected. Consider testing and cleaning up failed proxies.")
        
        return jsonify({
            'success': True,
            'performance': {
                'score': round(performance_score, 2),
                'metrics': {
                    'response_time': stats['performance']['average_response_time'],
                    'success_rate': stats['performance']['average_success_rate'],
                    'total_requests': stats['performance']['total_requests']
                },
                'recommendations': recommendations,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
