from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.reports_service import reports_service
from datetime import datetime, timedelta

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    """Get dashboard summary statistics"""
    try:
        result = reports_service.get_dashboard_summary()
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/sales-analytics', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    """Get sales analytics"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        result = reports_service.get_sales_analytics(start_date, end_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/customer-analytics', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    """Get customer analytics"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        result = reports_service.get_customer_analytics(start_date, end_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/warehouse-analytics', methods=['GET'])
@jwt_required()
def get_warehouse_analytics():
    """Get warehouse analytics"""
    try:
        result = reports_service.get_warehouse_analytics()
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/comprehensive', methods=['GET'])
@jwt_required()
def get_comprehensive_report():
    """Get comprehensive report with all analytics"""
    try:
        format_type = request.args.get('format', 'json')
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        result = reports_service.export_comprehensive_report(format_type, start_date, end_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/export', methods=['GET'])
@jwt_required()
def export_reports():
    """Export reports in various formats"""
    try:
        report_type = request.args.get('type', 'comprehensive')
        format_type = request.args.get('format', 'json')
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        if report_type == 'comprehensive':
            result = reports_service.export_comprehensive_report(format_type, start_date, end_date)
        elif report_type == 'sales':
            result = reports_service.get_sales_analytics(start_date, end_date)
        elif report_type == 'customers':
            result = reports_service.get_customer_analytics(start_date, end_date)
        elif report_type == 'warehouse':
            result = reports_service.get_warehouse_analytics()
        else:
            return jsonify({'error': f'Unknown report type: {report_type}'}), 400
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/real-time', methods=['GET'])
@jwt_required()
def get_real_time_stats():
    """Get real-time statistics for dashboard"""
    try:
        # Get basic real-time stats
        dashboard_summary = reports_service.get_dashboard_summary()
        
        if not dashboard_summary['success']:
            return jsonify(dashboard_summary), 400
        
        # Add real-time indicators
        real_time_stats = {
            'success': True,
            'real_time': {
                'current_time': datetime.utcnow().isoformat(),
                'system_status': 'online',
                'last_updated': datetime.utcnow().isoformat()
            },
            'summary': dashboard_summary['summary']
        }
        
        return jsonify(real_time_stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trend_analysis():
    """Get trend analysis for various metrics"""
    try:
        period = request.args.get('period', '30d')  # 7d, 30d, 90d, 1y
        metric = request.args.get('metric', 'revenue')  # revenue, sales_count, profit
        
        # Calculate period dates
        now = datetime.utcnow()
        if period == '7d':
            start_date = (now - timedelta(days=7)).isoformat()
        elif period == '30d':
            start_date = (now - timedelta(days=30)).isoformat()
        elif period == '90d':
            start_date = (now - timedelta(days=90)).isoformat()
        elif period == '1y':
            start_date = (now - timedelta(days=365)).isoformat()
        else:
            start_date = (now - timedelta(days=30)).isoformat()
        
        end_date = now.isoformat()
        
        # Get analytics for trend analysis
        if metric == 'revenue':
            result = reports_service.get_sales_analytics(start_date, end_date)
        elif metric == 'customers':
            result = reports_service.get_customer_analytics(start_date, end_date)
        else:
            result = reports_service.get_sales_analytics(start_date, end_date)
        
        if result['success']:
            # Add trend analysis
            trend_data = {
                'success': True,
                'trend_analysis': {
                    'period': period,
                    'metric': metric,
                    'start_date': start_date,
                    'end_date': end_date,
                    'data': result.get('analytics', {})
                }
            }
            return jsonify(trend_data)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
