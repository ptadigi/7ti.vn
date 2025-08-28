from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.customer_service import customer_service

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('/', methods=['GET'])
@jwt_required()
def get_customers():
    """Get all customers with pagination and filtering"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', None)
        is_active = request.args.get('is_active', None)
        
        # Convert is_active to boolean if provided
        if is_active is not None:
            is_active = is_active.lower() == 'true'
        
        # Get customers
        result = customer_service.get_all_customers(
            page=page,
            per_page=per_page,
            search=search,
            is_active=is_active
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """Get customer by ID"""
    try:
        result = customer_service.get_customer_by_id(customer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    """Create a new customer"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['name', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate phone format (basic validation)
        if not data['phone'].replace('+', '').replace('-', '').replace(' ', '').isdigit():
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        # Create customer
        result = customer_service.create_customer(data, user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Update customer information"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'name' in data and not data['name']:
            return jsonify({'error': 'Name cannot be empty'}), 400
        
        if 'phone' in data and not data['phone']:
            return jsonify({'error': 'Phone cannot be empty'}), 400
        
        # Validate phone format if being updated
        if 'phone' in data:
            if not data['phone'].replace('+', '').replace('-', '').replace(' ', '').isdigit():
                return jsonify({'error': 'Invalid phone number format'}), 400
        
        # Update customer
        result = customer_service.update_customer(customer_id, data)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Delete customer (soft delete)"""
    try:
        result = customer_service.delete_customer(customer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/search', methods=['GET'])
@jwt_required()
def search_customers():
    """Search customers by name, phone, or email"""
    try:
        search_term = request.args.get('q', '')
        
        if not search_term or len(search_term) < 2:
            return jsonify({
                'success': True,
                'customers': [],
                'count': 0
            })
        
        result = customer_service.search_customers(search_term)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_customer_statistics():
    """Get customer statistics"""
    try:
        result = customer_service.get_customer_statistics()
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/export', methods=['GET'])
@jwt_required()
def export_customers():
    """Export customers to CSV/Excel"""
    try:
        # Get all customers for export
        result = customer_service.get_all_customers(page=1, per_page=10000)
        
        if not result['success']:
            return jsonify(result), 400
        
        # Format for export
        customers = result['customers']
        
        # For now, return JSON. In production, you'd generate CSV/Excel
        return jsonify({
            'success': True,
            'customers': customers,
            'total': len(customers),
            'format': 'json',
            'message': 'Export completed. In production, this would return CSV/Excel file.'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
