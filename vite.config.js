import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import frappeui from 'frappe-ui/vite'

const frameworkUiPath = path.resolve(import.meta.dirname, 'framework-ui/src')

// https://vitejs.dev/config/
export default defineConfig(() => {
  const config = {
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        // point at the package src dir (not index.ts) so subpath imports like
        // `@framework/ui/components/Notifications` resolve. Importing subpaths avoids the
        // barrel, which `export *`s components (Grid/Phone/FormLayout) that need a newer
        // frappe-ui (`frappe-ui/internals`) than this app pins.
        '@framework/ui': frameworkUiPath,
      },
      // ensure the linked framework package reuses the host app's single copy of each peer.
      // `dompurify` is an implicit dep of @framework/ui's sanitize util (not declared in its
      // package.json); dedupe resolves it to the host's copy since the symlinked source has
      // no node_modules of its own.
      // the editor packages must resolve to one copy each: tiptap imports
      // `@tiptap/pm/model` while prosemirror-state/transform/tables import bare
      // `prosemirror-model`, so a nested install of either throws "multiple
      // versions of prosemirror-model were loaded" on mention insert. Unlike
      // optimizeDeps (dev-only) this also applies to the production build.
      // @framework/ui is aliased to frappe's ui/src, so its own direct deps
      // (leaflet, cropperjs, vuedraggable, marked, @codemirror/view) must also
      // come from here: a bench
      // build never installs apps/frappe/ui/node_modules.
      dedupe: [
        'vue',
        'vue-router',
        'frappe-ui',
        'reka-ui',
        // frappe's own node_modules has an old @vueuse/core without the exports frappe-ui needs
        '@vueuse/core',
        'dompurify',
        // ConditionBuilder's drag handles; resolved from the host for the same reason
        'vuedraggable',
        '@tiptap/core',
        '@tiptap/pm',
        '@tiptap/vue-3',
        'prosemirror-model',
        'prosemirror-state',
        'prosemirror-view',
        'prosemirror-transform',
        '@codemirror/view',
        'marked',
      ],
    },
    optimizeDeps: {
      include: [
        'tailwind.config.js',
        // pre-bundled together so prosemirror-state/view share the model and
        // transform the editor loads, instead of carrying their own copies
        'prosemirror-model',
        'prosemirror-state',
        'prosemirror-transform',
        'prosemirror-view',
        'lowlight',
        'interactjs',
      ],
      // frappe-ui ships source: pre-bundling it bundles the editor's scripts but
      // leaves its .vue files outside, so the editor code loads twice
      exclude: ['frappe-ui'],
    },
    server: {
      fs: {
        allow: [import.meta.dirname],
      },
    },
  }

  config.plugins.unshift(
    frappeui({
      frappeProxy: false,
      lucideIcons: true,
      jinjaBootData: false,
      // its esbuild helper breaks Vite 8's dependency scan
      codeLanguages: false,
      buildConfig: false,
    }),
  )

  return config
})
