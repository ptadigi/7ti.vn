from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, Enum
from sqlalchemy.sql import func
from config.database import Base
from enum import Enum as PyEnum

class ProxyType(PyEnum):
    """Proxy type enumeration"""
    HTTP = "http"
    HTTPS = "https"
    SOCKS4 = "socks4"
    SOCKS5 = "socks5"

class ProxyStatus(PyEnum):
    """Proxy status enumeration"""
    UNTESTED = "untested"
    WORKING = "working"
    FAILED = "failed"
    TESTING = "testing"
    DISABLED = "disabled"

class Proxy(Base):
    """Proxy model for managing proxy servers"""
    
    __tablename__ = 'proxies'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Proxy configuration
    type = Column(Enum(ProxyType, name='proxy_type_enum'), nullable=False, default=ProxyType.HTTP)
    host = Column(String(100), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(100), nullable=True)
    password = Column(String(100), nullable=True)
    
    # Proxy metadata
    country = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    isp = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    
    # Status and testing
    status = Column(Enum(ProxyStatus, name='proxy_status_enum'), default=ProxyStatus.UNTESTED)
    is_active = Column(Boolean, default=True)
    
    # Performance metrics
    response_time = Column(Numeric(8, 3), nullable=True)  # Response time in seconds
    success_rate = Column(Numeric(5, 2), nullable=True)  # Success rate percentage
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    
    # Testing information
    last_tested = Column(DateTime(timezone=True), nullable=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    test_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def get_connection_string(self):
        """Get proxy connection string"""
        if self.username and self.password:
            return f"{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{self.host}:{self.port}"
    
    def get_dict_for_requests(self):
        """Get proxy dict for requests library"""
        proxy_dict = {
            'http': f"{self.type.value}://{self.get_connection_string()}",
            'https': f"{self.type.value}://{self.get_connection_string()}"
        }
        return proxy_dict
    
    def update_stats(self, success: bool, response_time: float = None):
        """Update proxy statistics"""
        self.total_requests += 1
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        
        if response_time:
            self.response_time = response_time
        
        # Calculate success rate
        if self.total_requests > 0:
            self.success_rate = (self.successful_requests / self.total_requests) * 100
        
        self.last_used = func.now()
    
    def test_proxy(self, success: bool, response_time: float = None, error: str = None):
        """Update proxy test results"""
        if success:
            self.status = ProxyStatus.WORKING
        else:
            self.status = ProxyStatus.FAILED
        
        self.last_tested = func.now()
        self.test_error = error
        
        if response_time:
            self.response_time = response_time
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'type': self.type.value if hasattr(self.type, 'value') else str(self.type) if self.type else None,
            'host': self.host,
            'port': self.port,
            'username': self.username,
            'password': self.password,
            'country': self.country,
            'city': self.city,
            'isp': self.isp,
            'note': self.note,
            'status': self.status.value if hasattr(self.status, 'value') else str(self.status) if self.status else None,
            'is_active': self.is_active,
            'response_time': float(self.response_time) if self.response_time else None,
            'success_rate': float(self.success_rate) if self.success_rate else None,
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'last_tested': self.last_tested.isoformat() if self.last_tested else None,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'test_error': self.test_error,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'connection_string': self.get_connection_string()
        }
    
    def __repr__(self):
        return f"<Proxy(id={self.id}, {self.host}:{self.port}, status='{self.status}', type='{self.type}')>"
