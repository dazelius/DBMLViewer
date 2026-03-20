import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import gitPlugin from './vite-git-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = parseInt(env.PORT || '5173')

  return {
    plugins: [
      react(),
      tailwindcss(),
      gitPlugin({
        repoUrl: env.GITLAB_REPO_URL || '',
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
        webSearchApiKey: env.WEB_SEARCH_API_KEY || '',
        tableMasterUrl: env.TABLEMASTER_HOST
          ? `http://${env.TABLEMASTER_HOST}:${port}`
          : `http://localhost:${port}`,
      }),
    ],
    base: '/',
    server: {
      host: '0.0.0.0',
      port,
    },
    preview: {
      host: '0.0.0.0',
      port,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
              if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor-monaco';
              if (id.includes('/three/') || id.includes('3d-force-graph') || id.includes('three-spritetext')) return 'vendor-three';
              if (id.includes('alasql') || id.includes('/xlsx/')) return 'vendor-data';
              if (id.includes('@dbml/core') || id.includes('@dbml/parse')) return 'vendor-dbml';
            }
          },
        },
      },
    },
  }
})
