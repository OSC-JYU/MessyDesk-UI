import { reactive } from 'vue'

// Shell-level UI state shared between the app header and the current screen.
export const ui = reactive({
  // Side drawer of the project workspace, toggled from the header.
  drawerOpen: false,
  // Name of the open project, shown in the header.
  projectLabel: '',
})
