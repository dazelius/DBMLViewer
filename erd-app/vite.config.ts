import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import gitPlugin from './vite-git-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      gitPlugin({
        repoUrl: env.GITLAB_REPO_URL || 'http://13.209.114.157/projectaegis/projectaegisdata.git',
        localDir: resolve(process.cwd(), '.git-repo'),
        token: env.GITLAB_TOKEN || '',
        claudeApiKey: env.CLAUDE_API_KEY || '',
        repo2Url: env.GITLAB_REPO2_URL || '',
        repo2LocalDir: resolve(process.cwd(), '.git-repo-aegis'),
        repo2Token: env.GITLAB_REPO2_TOKEN || env.GITLAB_TOKEN || '',
        jiraBaseUrl: env.JIRA_BASE_URL || '',
        confluenceBaseUrl: env.CONFLUENCE_BASE_URL || env.JIRA_BASE_URL || '',
        jiraUserEmail: env.JIRA_USER_EMAIL || '',
        jiraApiToken: env.JIRA_API_TOKEN || '',
        jiraDefaultProject: env.JIRA_DEFAULT_PROJECT || '',
        confluenceUserEmail: env.CONFLUENCE_USER_EMAIL || '',
        confluenceApiToken: env.CONFLUENCE_API_TOKEN || '',
      }),
    ],
    base: '/TableMaster',
    server: {
      host: '0.0.0.0',
      port: 5173,
      // /api/claude 프록시는 vite-git-plugin 미들웨어에서 SSE 스트리밍 지원으로 직접 처리
      // Vite 내장 http-proxy는 SSE 응답을 버퍼링하므로 사용하지 않음
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
    },
  }
})
