from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import Session
from models.user import User
from config.database import get_db
import jwt

class AuthService:
    """Authentication service for user management"""
    
    def __init__(self):
        self.secret_key = "your-secret-key-change-in-production"  # Should come from config
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        try:
            db = next(get_db())
            
            # Check if user already exists
            existing_user = db.query(User).filter(
                (User.username == user_data['username']) | 
                (User.email == user_data['email'])
            ).first()
            
            if existing_user:
                return {
                    'success': False,
                    'error': 'Username or email already exists'
                }
            
            # Create new user
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data.get('full_name'),
                role=user_data.get('role', 'user')
            )
            user.set_password(user_data['password'])
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            return {
                'success': True,
                'user': user.to_dict(),
                'message': 'User created successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def authenticate_user(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return JWT tokens"""
        try:
            db = next(get_db())
            
            # Find user by username or email
            user = db.query(User).filter(
                (User.username == username) | (User.email == username)
            ).first()
            
            if not user or not user.check_password(password):
                return {
                    'success': False,
                    'error': 'Invalid username or password'
                }
            
            if not user.is_active:
                return {
                    'success': False,
                    'error': 'User account is deactivated'
                }
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.commit()
            
            # Generate JWT tokens
            access_token = create_access_token(
                identity=user.id,
                additional_claims={
                    'username': user.username,
                    'role': user.role
                }
            )
            
            refresh_token = create_refresh_token(
                identity=user.id,
                additional_claims={
                    'username': user.username,
                    'role': user.role
                }
            )
            
            return {
                'success': True,
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token,
                'message': 'Authentication successful'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            # Decode refresh token
            decoded = decode_token(refresh_token)
            user_id = decoded['sub']
            
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.is_active:
                return {
                    'success': False,
                    'error': 'Invalid or expired refresh token'
                }
            
            # Generate new access token
            new_access_token = create_access_token(
                identity=user.id,
                additional_claims={
                    'username': user.username,
                    'role': user.role
                }
            )
            
            return {
                'success': True,
                'access_token': new_access_token,
                'message': 'Token refreshed successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            db = next(get_db())
            return db.query(User).filter(User.id == user_id).first()
        except Exception:
            return None
        finally:
            db.close()
    
    def update_user_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            # Update allowed fields
            allowed_fields = ['full_name', 'email']
            for field in allowed_fields:
                if field in profile_data:
                    setattr(user, field, profile_data[field])
            
            user.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'user': user.to_dict(),
                'message': 'Profile updated successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def change_password(self, user_id: int, current_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password"""
        try:
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            # Verify current password
            if not user.check_password(current_password):
                return {
                    'success': False,
                    'error': 'Current password is incorrect'
                }
            
            # Set new password
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'message': 'Password changed successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

# Create global instance
auth_service = AuthService()
