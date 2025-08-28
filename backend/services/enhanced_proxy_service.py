from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, or_
from models.proxy import Proxy, ProxyStatus, ProxyType
from config.database import get_db
from datetime import datetime, timedelta
import json
import random
import time

class EnhancedProxyService:
    """Enhanced service for proxy management operations"""
    
    def bulk_add_proxies(self, proxy_list: List[Dict[str, Any]], user_id: int) -> Dict[str, Any]:
        """Add multiple proxies in bulk"""
        try:
            db = next(get_db())
            
            if len(proxy_list) > 100:  # Limit bulk operations
                return {
                    'success': False,
                    'error': 'Maximum 100 proxies per bulk operation'
                }
            
            results = []
            success_count = 0
            error_count = 0
            
            for proxy_data in proxy_list:
                try:
                    # Validate required fields
                    if not proxy_data.get('host') or not proxy_data.get('port'):
                        error_count += 1
                        results.append({
                            'success': False,
                            'error': 'Missing host or port',
                            'data': proxy_data
                        })
                        continue
                    
                    # Check if proxy already exists
                    existing_proxy = db.query(Proxy).filter(
                        and_(
                            Proxy.host == proxy_data['host'],
                            Proxy.port == proxy_data['port']
                        )
                    ).first()
                    
                    if existing_proxy:
                        error_count += 1
                        results.append({
                            'success': False,
                            'error': 'Proxy already exists',
                            'data': proxy_data
                        })
                        continue
                    
                    # Create proxy
                    proxy = Proxy(
                        type=proxy_data.get('type', ProxyType.HTTP),
                        host=proxy_data['host'],
                        port=proxy_data['port'],
                        username=proxy_data.get('username'),
                        password=proxy_data.get('password'),
                        country=proxy_data.get('country'),
                        city=proxy_data.get('city'),
                        isp=proxy_data.get('isp'),
                        note=proxy_data.get('note'),
                        status=ProxyStatus.ACTIVE,
                        is_active=True,
                        created_at=datetime.utcnow()
                    )
                    
                    db.add(proxy)
                    success_count += 1
                    results.append({
                        'success': True,
                        'proxy': proxy.to_dict()
                    })
                    
                except Exception as e:
                    error_count += 1
                    results.append({
                        'success': False,
                        'error': str(e),
                        'data': proxy_data
                    })
            
            db.commit()
            
            return {
                'success': True,
                'bulk_results': results,
                'summary': {
                    'total': len(proxy_list),
                    'successful': success_count,
                    'failed': error_count
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def bulk_test_proxies(self, proxy_ids: List[int] = None, test_all: bool = False) -> Dict[str, Any]:
        """Test multiple proxies in bulk"""
        try:
            db = next(get_db())
            
            # Get proxies to test
            if test_all:
                proxies = db.query(Proxy).filter(Proxy.is_active == True).all()
            elif proxy_ids:
                proxies = db.query(Proxy).filter(Proxy.id.in_(proxy_ids)).all()
            else:
                return {
                    'success': False,
                    'error': 'Must specify proxy_ids or test_all=True'
                }
            
            if len(proxies) > 50:  # Limit concurrent testing
                return {
                    'success': False,
                    'error': 'Maximum 50 proxies can be tested simultaneously'
                }
            
            # Test proxies
            test_results = []
            success_count = 0
            error_count = 0
            
            for proxy in proxies:
                try:
                    # Test proxy
                    test_result = self._test_single_proxy(proxy)
                    
                    # Update proxy stats
                    if test_result['success']:
                        proxy.status = ProxyStatus.ACTIVE
                        proxy.response_time = test_result['response_time']
                        proxy.success_rate = 100.0
                        proxy.last_tested = datetime.utcnow()
                        proxy.test_error = None
                        success_count += 1
                    else:
                        proxy.status = ProxyStatus.INACTIVE
                        proxy.test_error = test_result['error']
                        proxy.last_tested = datetime.utcnow()
                        error_count += 1
                    
                    proxy.updated_at = datetime.utcnow()
                    test_results.append(test_result)
                    
                except Exception as e:
                    error_count += 1
                    test_results.append({
                        'success': False,
                        'error': str(e),
                        'proxy_id': proxy.id
                    })
            
            db.commit()
            
            return {
                'success': True,
                'test_results': test_results,
                'summary': {
                    'total_tested': len(proxies),
                    'successful': success_count,
                    'failed': error_count
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def _test_single_proxy(self, proxy: Proxy) -> Dict[str, Any]:
        """Test a single proxy"""
        try:
            start_time = time.time()
            
            # Prepare proxy URL
            if proxy.username and proxy.password:
                proxy_url = f"http://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
            else:
                proxy_url = f"http://{proxy.host}:{proxy.port}"
            
            # Test with a simple HTTP request
            import requests
            from requests.exceptions import RequestException
            
            proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
            
            # Test with a reliable test URL
            test_urls = [
                'http://httpbin.org/ip',
                'http://httpbin.org/get',
                'https://api.ipify.org?format=json'
            ]
            
            for test_url in test_urls:
                try:
                    response = requests.get(
                        test_url,
                        proxies=proxies,
                        timeout=10,
                        verify=False
                    )
                    
                    if response.status_code == 200:
                        response_time = time.time() - start_time
                        return {
                            'success': True,
                            'proxy_id': proxy.id,
                            'response_time': response_time,
                            'test_url': test_url,
                            'status_code': response.status_code
                        }
                        
                except RequestException:
                    continue
            
            # If all URLs failed
            return {
                'success': False,
                'proxy_id': proxy.id,
                'error': 'All test URLs failed',
                'response_time': None
            }
            
        except Exception as e:
            return {
                'success': False,
                'proxy_id': proxy.id,
                'error': str(e),
                'response_time': None
            }
    
    def rotate_proxies(self, rotation_type: str = 'round_robin', max_concurrent: int = 5) -> Dict[str, Any]:
        """Rotate proxies for load balancing"""
        try:
            db = next(get_db())
            
            # Get active proxies
            active_proxies = db.query(Proxy).filter(
                and_(
                    Proxy.is_active == True,
                    Proxy.status == ProxyStatus.ACTIVE
                )
            ).order_by(Proxy.last_used.asc()).all()
            
            if not active_proxies:
                return {
                    'success': False,
                    'error': 'No active proxies available'
                }
            
            if rotation_type == 'round_robin':
                # Simple round-robin rotation
                selected_proxies = active_proxies[:max_concurrent]
                
                # Update last_used timestamp
                for proxy in selected_proxies:
                    proxy.last_used = datetime.utcnow()
                    proxy.total_requests += 1
                
            elif rotation_type == 'performance_based':
                # Rotate based on performance (response time, success rate)
                selected_proxies = sorted(
                    active_proxies,
                    key=lambda p: (p.success_rate or 0, -(p.response_time or 999))
                )[:max_concurrent]
                
                # Update last_used timestamp
                for proxy in selected_proxies:
                    proxy.last_used = datetime.utcnow()
                    proxy.total_requests += 1
                
            elif rotation_type == 'random':
                # Random rotation
                selected_proxies = random.sample(active_proxies, min(max_concurrent, len(active_proxies)))
                
                # Update last_used timestamp
                for proxy in selected_proxies:
                    proxy.last_used = datetime.utcnow()
                    proxy.total_requests += 1
                
            else:
                return {
                    'success': False,
                    'error': f'Unknown rotation type: {rotation_type}'
                }
            
            db.commit()
            
            return {
                'success': True,
                'rotation_type': rotation_type,
                'selected_proxies': [p.to_dict() for p in selected_proxies],
                'total_available': len(active_proxies),
                'selected_count': len(selected_proxies)
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_proxy_statistics(self) -> Dict[str, Any]:
        """Get comprehensive proxy statistics"""
        try:
            db = next(get_db())
            
            # Total proxies
            total_proxies = db.query(Proxy).count()
            active_proxies = db.query(Proxy).filter(Proxy.is_active == True).count()
            inactive_proxies = db.query(Proxy).filter(Proxy.is_active == False).count()
            
            # Status breakdown
            status_stats = {}
            for status in ProxyStatus:
                count = db.query(Proxy).filter(Proxy.status == status).count()
                status_stats[status.value] = count
            
            # Type breakdown
            type_stats = {}
            for proxy_type in ProxyType:
                count = db.query(Proxy).filter(Proxy.type == proxy_type).count()
                type_stats[proxy_type.value] = count
            
            # Performance statistics
            active_proxy_list = db.query(Proxy).filter(
                and_(
                    Proxy.is_active == True,
                    Proxy.status == ProxyStatus.ACTIVE
                )
            ).all()
            
            if active_proxy_list:
                avg_response_time = sum(p.response_time or 0 for p in active_proxy_list) / len(active_proxy_list)
                avg_success_rate = sum(p.success_rate or 0 for p in active_proxy_list) / len(active_proxy_list)
                total_requests = sum(p.total_requests or 0 for p in active_proxy_list)
            else:
                avg_response_time = 0
                avg_success_rate = 0
                total_requests = 0
            
            # Recent activity
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_tests = db.query(Proxy).filter(
                and_(
                    Proxy.last_tested >= week_ago,
                    Proxy.is_active == True
                )
            ).count()
            
            recent_usage = db.query(Proxy).filter(
                and_(
                    Proxy.last_used >= week_ago,
                    Proxy.is_active == True
                )
            ).count()
            
            return {
                'success': True,
                'statistics': {
                    'total_proxies': total_proxies,
                    'active_proxies': active_proxies,
                    'inactive_proxies': inactive_proxies,
                    'status_breakdown': status_stats,
                    'type_breakdown': type_stats,
                    'performance': {
                        'average_response_time': float(avg_response_time),
                        'average_success_rate': float(avg_success_rate),
                        'total_requests': total_requests
                    },
                    'recent_activity': {
                        'tested_last_7_days': recent_tests,
                        'used_last_7_days': recent_usage
                    }
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def cleanup_inactive_proxies(self, days_inactive: int = 30) -> Dict[str, Any]:
        """Clean up proxies that have been inactive for specified days"""
        try:
            db = next(get_db())
            
            cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)
            
            # Find inactive proxies
            inactive_proxies = db.query(Proxy).filter(
                and_(
                    Proxy.is_active == False,
                    Proxy.last_tested < cutoff_date,
                    Proxy.last_used < cutoff_date
                )
            ).all()
            
            if not inactive_proxies:
                return {
                    'success': True,
                    'message': 'No inactive proxies to clean up',
                    'cleaned_count': 0
                }
            
            # Soft delete by marking as inactive
            for proxy in inactive_proxies:
                proxy.is_active = False
                proxy.status = ProxyStatus.INACTIVE
                proxy.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                'success': True,
                'message': f'Cleaned up {len(inactive_proxies)} inactive proxies',
                'cleaned_count': len(inactive_proxies)
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def export_proxy_list(self, format: str = 'json', include_inactive: bool = False) -> Dict[str, Any]:
        """Export proxy list"""
        try:
            db = next(get_db())
            
            # Build query
            query = db.query(Proxy)
            if not include_inactive:
                query = query.filter(Proxy.is_active == True)
            
            proxies = query.order_by(desc(Proxy.created_at)).all()
            
            if format == 'json':
                proxy_list = [proxy.to_dict() for proxy in proxies]
                return {
                    'success': True,
                    'proxies': proxy_list,
                    'total': len(proxy_list),
                    'format': 'json'
                }
            elif format == 'txt':
                # Export as plain text with one proxy per line
                proxy_lines = []
                for proxy in proxies:
                    if proxy.username and proxy.password:
                        line = f"{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
                    else:
                        line = f"{proxy.host}:{proxy.port}"
                    proxy_lines.append(line)
                
                return {
                    'success': True,
                    'content': '\n'.join(proxy_lines),
                    'total': len(proxy_lines),
                    'format': 'txt'
                }
            else:
                return {
                    'success': False,
                    'error': f'Unsupported format: {format}'
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

# Create global instance
enhanced_proxy_service = EnhancedProxyService()
