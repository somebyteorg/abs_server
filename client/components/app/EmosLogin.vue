<template>
  <div class="min-h-screen flex items-center justify-center px-6 py-12">
    <section class="w-full max-w-sm rounded-2xl border border-white/10 bg-primary/30 px-8 py-10 text-center shadow-xl" aria-labelledby="emos-login-title">
      <p class="font-mono text-3xl tracking-widest text-white">emos</p>
      <div v-if="!error" class="mx-auto my-8 h-8 w-8 rounded-full border-2 border-white/15 border-t-white animate-spin" aria-hidden="true" />
      <div v-else class="mx-auto my-8 flex h-10 w-10 items-center justify-center rounded-full bg-error/15 text-error" aria-hidden="true">!</div>
      <h1 id="emos-login-title" class="text-lg font-medium text-white" role="status" aria-live="polite">{{ title }}</h1>
      <p class="mt-3 text-sm leading-6 text-gray-400" :role="error ? 'alert' : null">{{ error || '登录后继续收听' }}</p>
      <div v-if="error" class="mt-8 space-y-3">
        <ui-btn class="w-full" :loading="processing" @click="login">重试</ui-btn>
        <a :href="signUrl" class="block py-2 text-sm text-gray-400 hover:text-white">重新登录</a>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    signUrl: { type: String, default: null },
    token: { type: String, default: null }
  },
  data() {
    return { error: null, processing: false }
  },
  computed: {
    title() {
      if (this.error) return '暂时无法登录'
      return this.token && this.signUrl ? '正在完成登录…' : '正在连接…'
    },
    ready() {
      return !!(this.token && this.signUrl)
    }
  },
  watch: {
    ready: {
      immediate: true,
      handler(ready) {
        if (ready) this.login()
      }
    }
  },
  methods: {
    async login() {
      this.error = null
      this.processing = true
      try {
        const result = await this.$axios.$post('/login', { token: this.token }, { skipAuthRefresh: true })
        sessionStorage.removeItem('emos_abs_redirect')
        this.$emit('authenticated', result)
      } catch (error) {
        if (error.response?.status === 401) {
          this.$store.commit('user/setUser', null)
          this.$store.commit('user/setAccessToken', null)
          window.location.replace(this.$router.resolve('/login').href)
          return
        }
        this.error = error.response?.data || '登录服务暂时不可用，请稍后重试。'
      } finally {
        this.processing = false
      }
    }
  }
}
</script>
