const axios = require('axios')
const passport = require('passport')
const Logger = require('../Logger')
const requestIp = require('../libs/requestIp')

class EmosAuthStrategy extends passport.Strategy {
  constructor() {
    super()
    this.name = 'emos'
    this.http = axios.create({ timeout: 10000, maxRedirects: 0 })
  }

  get isEnabled() {
    return !!this.baseUrl
  }

  get baseUrl() {
    return process.env.EMOS_URL?.trim().replace(/\/+$/, '')
  }

  get signUrl() {
    return process.env.EMOS_URL_LINK
  }

  init() {
    passport.use(this)
  }

  async authenticate(req) {
    const body = req.body || {}
    const isTokenLogin = 'token' in body
    let profile
    if (isTokenLogin) {
      if (typeof body.token !== 'string' || !body.token.trim()) return this.fail({ message: '缺少登录凭证' }, 401)
      profile = await this.fetchUser('/api/user/base', {
        method: 'get',
        headers: { Authorization: `Bearer ${body.token}` }
      })
      if (profile && (!profile.user_id || !profile.username)) return this.fail({ message: 'EMOS 用户信息无效' }, 502)
    } else {
      const { username, password } = body
      if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password.trim()) {
        return this.fail({ message: '用户名和密码不能为空' }, 400)
      }
      profile = await this.fetchUser('/server/abs/userLogin', {
        method: 'post',
        data: {
          username,
          password,
          client_ip: requestIp.getClientIp(req) || req.ip || '',
          ua: req.headers['user-agent'] || ''
        }
      })
    }
    if (!profile) return

    const userModel = require('../Database').userModel
    try {
      const user = isTokenLogin ? await userModel.getOrCreateEmosUser(profile) : await userModel.syncEmosUser(profile)
      if (!user.isActive) return this.fail({ message: '账号已停用，请联系管理员' }, 403)
      return this.success(user)
    } catch (error) {
      Logger.error('[EmosAuth] Failed to load user:', error.message)
      return this.fail({ message: '用户信息读取失败' }, 500)
    }
  }

  async fetchUser(path, options) {
    let response
    try {
      response = await this.http.request({
        url: `${this.baseUrl}${path}`,
        ...options,
        validateStatus: () => true
      })
    } catch {
      this.fail({ message: 'EMOS 暂时不可用' }, 503)
      return null
    }

    if (response.status === 200) return response.data || {}
    const status = response.status === 401 ? 401 : 503
    const message = status === 401 ? response.data?.message || '登录已失效，请重新登录' : 'EMOS 鉴权暂时不可用'
    this.fail({ message }, status)
    return null
  }
}

module.exports = EmosAuthStrategy
