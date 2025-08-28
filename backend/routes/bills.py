from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.bill_service import bill_service

bills_bp = Blueprint('bills', __name__, url_prefix='/api/bills')

@bills_bp.route('/warehouse', methods=['GET'])
@jwt_required()
def get_warehouse_bills():
    """Get bills in warehouse with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        limit = int(request.args.get('limit', per_page))  # Support both per_page and limit
        search = request.args.get('search', None)
        min_amount = request.args.get('min_amount', None)
        max_amount = request.args.get('max_amount', None)
        status = request.args.get('status', None)
        customer_name = request.args.get('customer_name', None)
        
        # Convert numeric parameters
        if min_amount is not None:
            min_amount = float(min_amount)
        if max_amount is not None:
            max_amount = float(max_amount)
        
        # Get bills
        result = bill_service.get_warehouse_bills(
            page=page,
            per_page=limit,  # Use limit parameter
            search=search,
            min_amount=min_amount,
            max_amount=max_amount,
            status=status,
            customer_name=customer_name
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/<int:bill_id>', methods=['GET'])
@jwt_required()
def get_warehouse_bill(bill_id):
    """Get bill by ID"""
    try:
        result = bill_service.get_bill_by_id(bill_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_bills():
    """Get all bills with all statuses"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        all_statuses = request.args.get('all_statuses', 'true', type=str).lower() == 'true'
        
        # Get bills
        result = bill_service.get_all_bills(
            page=page,
            limit=limit,
            all_statuses=all_statuses
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse', methods=['POST'])
@jwt_required()
def add_bill_to_warehouse():
    """Add bill to warehouse"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['contract_code', 'customer_name', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Add bill
        result = bill_service.add_bill_to_warehouse(data, user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/<int:bill_id>', methods=['PUT'])
@jwt_required()
def update_warehouse_bill(bill_id):
    """Update bill in warehouse"""
    try:
        data = request.get_json()
        
        # Validate amount if provided
        if 'amount' in data:
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    return jsonify({'error': 'Amount must be positive'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid amount format'}), 400
        
        # Update bill
        result = bill_service.update_bill(bill_id, data)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/<int:bill_id>', methods=['DELETE'])
@jwt_required()
def remove_bill_from_warehouse(bill_id):
    """Remove bill from warehouse"""
    try:
        result = bill_service.remove_bill_from_warehouse(bill_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/combinations', methods=['POST'])
@jwt_required()
def find_bill_combinations():
    """Find bill combinations for target amount"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('target_amount'):
            return jsonify({'error': 'target_amount is required'}), 400
        
        # Validate target amount
        try:
            target_amount = float(data['target_amount'])
            if target_amount <= 0:
                return jsonify({'error': 'Target amount must be positive'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid target amount format'}), 400
        
        # Get tolerance (optional)
        tolerance = float(data.get('tolerance', 0.1))
        if tolerance < 0 or tolerance > 1:
            return jsonify({'error': 'Tolerance must be between 0 and 1'}), 400
        
        # Find combinations
        result = bill_service.find_bill_combinations(target_amount, tolerance)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/statistics', methods=['GET'])
@jwt_required()
def get_warehouse_statistics():
    """Get warehouse statistics"""
    try:
        result = bill_service.get_warehouse_statistics()
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/export', methods=['GET'])
@jwt_required()
def export_warehouse_bills():
    """Export warehouse bills"""
    try:
        format_type = request.args.get('format', 'json')
        
        result = bill_service.export_warehouse_bills(format_type)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/bulk-add', methods=['POST'])
@jwt_required()
def bulk_add_bills():
    """Add multiple bills to warehouse"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not data.get('bills') or not isinstance(data['bills'], list):
            return jsonify({'error': 'bills array is required'}), 400
        
        bills = data['bills']
        if len(bills) > 100:  # Limit bulk operations
            return jsonify({'error': 'Maximum 100 bills per bulk operation'}), 400
        
        results = []
        success_count = 0
        error_count = 0
        
        for bill_data in bills:
            try:
                # Validate required fields
                required_fields = ['contract_code', 'customer_name', 'amount']
                if all(field in bill_data for field in required_fields):
                    result = bill_service.add_bill_to_warehouse(bill_data, user_id)
                    if result['success']:
                        success_count += 1
                    else:
                        error_count += 1
                    results.append(result)
                else:
                    error_count += 1
                    results.append({
                        'success': False,
                        'error': 'Missing required fields'
                    })
            except Exception as e:
                error_count += 1
                results.append({
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'bulk_results': results,
            'summary': {
                'total': len(bills),
                'successful': success_count,
                'failed': error_count
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/warehouse/bulk-status', methods=['PUT'])
@jwt_required()
def bulk_update_bill_status():
    """Update status of multiple bills"""
    try:
        data = request.get_json()
        
        if not data.get('billIds') or not isinstance(data['billIds'], list):
            return jsonify({'error': 'billIds array is required'}), 400
        
        if not data.get('status'):
            return jsonify({'error': 'status is required'}), 400
        
        bill_ids = data['billIds']
        new_status = data['status']
        
        if len(bill_ids) > 100:  # Limit bulk operations
            return jsonify({'error': 'Maximum 100 bills per bulk operation'}), 400
        
        # Validate status
        valid_statuses = ['IN_WAREHOUSE', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'EXPIRED', 'CANCELLED']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        results = []
        success_count = 0
        error_count = 0
        
        for bill_id in bill_ids:
            try:
                result = bill_service.update_bill_status(bill_id, new_status)
                if result['success']:
                    success_count += 1
                else:
                    error_count += 1
                results.append(result)
            except Exception as e:
                error_count += 1
                results.append({
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'bulk_results': results,
            'summary': {
                'total': len(bill_ids),
                'successful': success_count,
                'failed': error_count
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bills_bp.route('/customer/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_bills(customer_id):
    """Get all bills for a specific customer"""
    try:
        result = bill_service.get_bills_by_customer(customer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


