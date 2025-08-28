from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.sales_service import sales_service

sales_bp = Blueprint('sales', __name__, url_prefix='/api/sales')

@sales_bp.route('/', methods=['POST'])
@jwt_required()
def create_sale():
    """Create a new sale transaction"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['customer_id', 'bill_ids', 'profit_percentage']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate profit percentage
        try:
            profit_percentage = float(data['profit_percentage'])
            if profit_percentage < 0 or profit_percentage > 100:
                return jsonify({'error': 'Profit percentage must be between 0 and 100'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid profit percentage format'}), 400
        
        # Validate bill_ids is a list
        if not isinstance(data['bill_ids'], list) or len(data['bill_ids']) == 0:
            return jsonify({'error': 'bill_ids must be a non-empty list'}), 400
        
        # Create sale
        result = sales_service.create_sale(data, user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale(sale_id):
    """Get sale by ID"""
    try:
        result = sales_service.get_sale_by_id(sale_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_sales():
    """Get all sales with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status', None)
        customer_id = request.args.get('customer_id', None)
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        # Convert customer_id to int if provided
        if customer_id is not None:
            try:
                customer_id = int(customer_id)
            except ValueError:
                return jsonify({'error': 'Invalid customer_id format'}), 400
        
        # Get sales
        result = sales_service.get_all_sales(
            page=page,
            per_page=per_page,
            status=status,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment(sale_id):
    """Confirm customer has paid - chuyển từ pending_payment sang paid"""
    try:
        result = sales_service.confirm_payment(sale_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>/complete', methods=['POST'])
@jwt_required()
def complete_sale(sale_id):
    """Complete sale - mình đã thanh lại cho khách"""
    try:
        result = sales_service.complete_sale(sale_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>/status', methods=['PUT'])
@jwt_required()
def update_sale_status(sale_id):
    """Update sale status"""
    try:
        data = request.get_json()
        
        if not data.get('status'):
            return jsonify({'error': 'status is required'}), 400
        
        status = data['status']
        notes = data.get('notes')
        
        # Update status
        result = sales_service.update_sale_status(sale_id, status, notes)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>/payment', methods=['PUT'])
@jwt_required()
def update_payment_status(sale_id):
    """Update payment status"""
    try:
        data = request.get_json()
        
        if not data.get('payment_status'):
            return jsonify({'error': 'payment_status is required'}), 400
        
        payment_status = data['payment_status']
        payment_date = data.get('payment_date')
        
        # Update payment status
        result = sales_service.update_payment_status(sale_id, payment_status, payment_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_sales_statistics():
    """Get sales statistics"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        result = sales_service.get_sales_statistics(start_date, end_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/export', methods=['GET'])
@jwt_required()
def export_sales():
    """Export sales data"""
    try:
        format_type = request.args.get('format', 'json')
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        result = sales_service.export_sales(format_type, start_date, end_date)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_sale(sale_id):
    """Cancel a sale"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason')
        
        result = sales_service.cancel_sale(sale_id, reason)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/<int:sale_id>', methods=['DELETE'])
@jwt_required()
def delete_sale(sale_id):
    """Delete a sale (soft delete)"""
    try:
        # For now, we'll use cancel as a soft delete
        result = sales_service.cancel_sale(sale_id, "Deleted by user")
        
        if result['success']:
            return jsonify({'message': 'Sale deleted successfully'})
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/bulk-status-update', methods=['PUT'])
@jwt_required()
def bulk_update_sales_status():
    """Update status for multiple sales"""
    try:
        data = request.get_json()
        
        if not data.get('sale_ids') or not isinstance(data['sale_ids'], list):
            return jsonify({'error': 'sale_ids array is required'}), 400
        
        if not data.get('status'):
            return jsonify({'error': 'status is required'}), 400
        
        sale_ids = data['sale_ids']
        status = data['status']
        notes = data.get('notes')
        
        if len(sale_ids) > 50:  # Limit bulk operations
            return jsonify({'error': 'Maximum 50 sales per bulk operation'}), 400
        
        results = []
        success_count = 0
        error_count = 0
        
        for sale_id in sale_ids:
            try:
                result = sales_service.update_sale_status(sale_id, status, notes)
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
                'total': len(sale_ids),
                'successful': success_count,
                'failed': error_count
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customer/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_sales(customer_id):
    """Get all sales for a specific customer"""
    try:
        result = sales_service.get_sales_by_customer(customer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
