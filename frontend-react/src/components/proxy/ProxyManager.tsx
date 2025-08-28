import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { 
  GlobeAltIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ProxyConfig {
  id: string
  host: string
  port: number
  username?: string
  password?: string
  type: 'http' | 'https' | 'socks4' | 'socks5'
  status: 'active' | 'inactive' | 'testing' | 'failed'
  lastTested?: Date
  responseTime?: number
  country?: string
  isp?: string
  enabled: boolean
}

const ProxyManager: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyConfig[]>([])
  const [newProxyInput, setNewProxyInput] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [selectedProxy, setSelectedProxy] = useState<ProxyConfig | null>(null)

  // Load saved proxies from localStorage
  useEffect(() => {
    const savedProxies = localStorage.getItem('fpt_proxies')
    if (savedProxies) {
      try {
        setProxies(JSON.parse(savedProxies))
      } catch (error) {
        console.error('Error loading saved proxies:', error)
      }
    }
  }, [])

  // Save proxies to localStorage
  const saveProxies = (proxyList: ProxyConfig[]) => {
    localStorage.setItem('fpt_proxies', JSON.stringify(proxyList))
  }

  // Smart proxy format detection
  const parseProxyInput = (input: string): Partial<ProxyConfig> | null => {
    const inputTrimmed = input.trim()
    
    // Pattern 1: username:password@host:port
    const pattern1 = /^([^:@]+):([^:@]+)@([^:]+):(\d+)$/
    const match1 = inputTrimmed.match(pattern1)
    if (match1) {
      return {
        username: match1[1],
        password: match1[2],
        host: match1[3],
        port: parseInt(match1[4])
      }
    }

    // Pattern 2: host:port:username:password
    const pattern2 = /^([^:]+):(\d+):([^:]+):(.+)$/
    const match2 = inputTrimmed.match(pattern2)
    if (match2) {
      return {
        host: match2[1],
        port: parseInt(match2[2]),
        username: match2[3],
        password: match2[4]
      }
    }

    // Pattern 3: username:password@host:port:type
    const pattern3 = /^([^:@]+):([^:@]+)@([^:]+):(\d+):(http|https|socks4|socks5)$/
    const match3 = inputTrimmed.match(pattern3)
    if (match3) {
      return {
        username: match3[1],
        password: match3[2],
        host: match3[3],
        port: parseInt(match3[4]),
        type: match3[5] as 'http' | 'https' | 'socks4' | 'socks5'
      }
    }

    // Pattern 4: host:port
    const pattern4 = /^([^:]+):(\d+)$/
    const match4 = inputTrimmed.match(pattern4)
    if (match4) {
      return {
        host: match4[1],
        port: parseInt(match4[2])
      }
    }

    // Pattern 5: host:port:type
    const pattern5 = /^([^:]+):(\d+):(http|https|socks4|socks5)$/
    const match5 = inputTrimmed.match(pattern5)
    if (match5) {
      return {
        host: match5[1],
        port: parseInt(match5[2]),
        type: match5[3] as 'http' | 'https' | 'socks4' | 'socks5'
      }
    }

    return null
  }

  const addProxy = () => {
    if (!newProxyInput.trim()) {
      toast.error('Vui lòng nhập thông tin proxy')
      return
    }

    const parsedProxy = parseProxyInput(newProxyInput)
    if (!parsedProxy) {
      toast.error('Định dạng proxy không hợp lệ. Hỗ trợ các format:\nusername:pass@ip:port\nip:port:user:pass\nip:port')
      return
    }

    const newProxy: ProxyConfig = {
      id: Date.now().toString(),
      host: parsedProxy.host!,
      port: parsedProxy.port!,
      username: parsedProxy.username,
      password: parsedProxy.password,
      type: parsedProxy.type || 'http',
      status: 'inactive',
      enabled: true,
      lastTested: new Date()
    }

    const updatedProxies = [...proxies, newProxy]
    setProxies(updatedProxies)
    saveProxies(updatedProxies)
    setNewProxyInput('')
    toast.success(`Đã thêm proxy ${newProxy.host}:${newProxy.port}`)
  }

  const testProxy = async (proxy: ProxyConfig) => {
    const updatedProxies = proxies.map(p => 
      p.id === proxy.id ? { ...p, status: 'testing' as const } : p
    )
    setProxies(updatedProxies)

    try {
      // Simulate proxy testing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const isWorking = Math.random() > 0.3 // 70% success rate for demo
      const responseTime = Math.floor(Math.random() * 2000) + 500 // 500-2500ms
      
      const updatedProxy = {
        ...proxy,
        status: isWorking ? 'active' : 'failed',
        responseTime: isWorking ? responseTime : undefined,
        lastTested: new Date()
      }

      const finalProxies = proxies.map(p => 
        p.id === proxy.id ? updatedProxy : p
      )
      setProxies(finalProxies)
      saveProxies(finalProxies)

      if (isWorking) {
        toast.success(`Proxy ${proxy.host}:${proxy.port} hoạt động tốt (${responseTime}ms)`)
      } else {
        toast.error(`Proxy ${proxy.host}:${proxy.port} không hoạt động`)
      }
    } catch (error) {
      const failedProxy = { ...proxy, status: 'failed' as const, lastTested: new Date() }
      const finalProxies = proxies.map(p => 
        p.id === proxy.id ? failedProxy : p
      )
      setProxies(finalProxies)
      saveProxies(finalProxies)
      toast.error(`Lỗi khi test proxy ${proxy.host}:${proxy.port}`)
    }
  }

  const testAllProxies = async () => {
    setIsTesting(true)
    const enabledProxies = proxies.filter(p => p.enabled)
    
    for (const proxy of enabledProxies) {
      await testProxy(proxy)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between tests
    }
    
    setIsTesting(false)
    toast.success('Đã test xong tất cả proxy!')
  }

  const toggleProxy = (proxyId: string) => {
    const updatedProxies = proxies.map(p => 
      p.id === proxyId ? { ...p, enabled: !p.enabled } : p
    )
    setProxies(updatedProxies)
    saveProxies(updatedProxies)
  }

  const deleteProxy = (proxyId: string) => {
    const updatedProxies = proxies.filter(p => p.id !== proxyId)
    setProxies(updatedProxies)
    saveProxies(updatedProxies)
    toast.success('Đã xóa proxy')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'testing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động'
      case 'failed':
        return 'Lỗi'
      case 'testing':
        return 'Đang test'
      default:
        return 'Chưa test'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'testing':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Proxy</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quản lý và test proxy cho FPT API với cơ chế tự nhận diện format
        </p>
      </div>

      {/* Add New Proxy */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thêm Proxy Mới</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thông Tin Proxy (Hỗ trợ nhiều format)
            </label>
            <div className="flex space-x-3">
              <Input
                value={newProxyInput}
                onChange={(e) => setNewProxyInput(e.target.value)}
                placeholder="username:pass@ip:port hoặc ip:port:user:pass hoặc ip:port"
                className="flex-1"
              />
              <Button
                onClick={addProxy}
                variant="primary"
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                Thêm
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              <strong>Hỗ trợ format:</strong><br/>
              • username:password@ip:port<br/>
              • ip:port:username:password<br/>
              • ip:port<br/>
              • username:pass@ip:port:type (http/https/socks4/socks5)
            </p>
          </div>
        </div>
      </div>

      {/* Proxy List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Danh Sách Proxy</h2>
          <div className="flex space-x-3">
            <Button
              onClick={testAllProxies}
              loading={isTesting}
              variant="secondary"
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Test Tất Cả
            </Button>
          </div>
        </div>

        {proxies.length === 0 ? (
          <div className="text-center py-8">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có proxy nào</h3>
            <p className="mt-1 text-sm text-gray-500">Thêm proxy để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proxies.map((proxy) => (
              <div key={proxy.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(proxy.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proxy.status)}`}>
                      {getStatusText(proxy.status)}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {proxy.username ? `${proxy.username}@` : ''}{proxy.host}:{proxy.port}
                    </div>
                    <div className="text-sm text-gray-500">
                      Type: {proxy.type.toUpperCase()}
                      {proxy.responseTime && ` • ${proxy.responseTime}ms`}
                      {proxy.lastTested && ` • Test: ${proxy.lastTested.toLocaleString('vi-VN')}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => toggleProxy(proxy.id)}
                    variant={proxy.enabled ? 'success' : 'ghost'}
                    size="sm"
                  >
                    {proxy.enabled ? 'Bật' : 'Tắt'}
                  </Button>
                  
                  <Button
                    onClick={() => testProxy(proxy)}
                    variant="secondary"
                    size="sm"
                    leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                  >
                    Test
                  </Button>
                  
                  <Button
                    onClick={() => deleteProxy(proxy.id)}
                    variant="danger"
                    size="sm"
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proxy Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng Proxy</p>
              <p className="text-2xl font-bold text-gray-900">{proxies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Hoạt Động</p>
              <p className="text-2xl font-bold text-gray-900">
                {proxies.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Lỗi</p>
              <p className="text-2xl font-bold text-gray-900">
                {proxies.filter(p => p.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ArrowPathIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đang Test</p>
              <p className="text-2xl font-bold text-gray-900">
                {proxies.filter(p => p.status === 'testing').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProxyManager
