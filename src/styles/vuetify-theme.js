// Vuetify themes built from the same values as tokens.css. Keep the two in
// step: Vuetify needs literal colours at build time, CSS reads the custom
// properties (switched with <html data-theme="fjord" | "fjord-dark" | "classic">).
// Teal (primary) is the action colour; navy (secondary) marks sets.

const variables = {
  'border-opacity': 0.12,
  'high-emphasis-opacity': 0.92,
  'medium-emphasis-opacity': 0.68,
}

export const fjord = {
  dark: false,
  colors: {
    background: '#eaf2f1',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    'surface-light': '#f3f8f7',
    'surface-variant': '#dcf0ed',
    'on-background': '#143532',
    'on-surface': '#143532',
    'on-surface-variant': '#143532',
    primary: '#0f6e6a',
    'primary-darken-1': '#0a504d',
    'on-primary': '#ffffff',
    secondary: '#1d5a8c',
    'secondary-darken-1': '#164a74',
    'on-secondary': '#ffffff',
    header: '#0d3b3a',
    'on-header': '#ffffff',
    graph: '#1d4f6e',
    'graph-light': '#8fd4c2',
    info: '#1d5a8c',
    success: '#2e7d32',
    warning: '#9a5b00',
    error: '#c62828',
    'on-error': '#ffffff',
  },
  variables: { ...variables, 'border-color': '#143532' },
}

export const fjordDark = {
  dark: true,
  colors: {
    background: '#0c1a19',
    surface: '#132625',
    'surface-bright': '#182e2d',
    'surface-light': '#182e2d',
    'surface-variant': '#173c39',
    'on-background': '#e4f1ee',
    'on-surface': '#e4f1ee',
    'on-surface-variant': '#e4f1ee',
    primary: '#5cc4b6',
    'primary-darken-1': '#86d6cb',
    'on-primary': '#0a1e1c',
    secondary: '#7fb2e3',
    'secondary-darken-1': '#5f97cc',
    'on-secondary': '#0b1a2a',
    header: '#0a2625',
    'on-header': '#e4f1ee',
    graph: '#2a6a8f',
    'graph-light': '#8fd4c2',
    info: '#7fb2e3',
    success: '#7cc98a',
    warning: '#f0b05a',
    error: '#ef7a7a',
    'on-error': '#0b1a2a',
  },
  variables: { ...variables, 'border-color': '#e4f1ee' },
}

// MessyDesk classic: the original navy and blue look.
export const classic = {
  dark: false,
  colors: {
    background: '#edf2f6',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    'surface-light': '#f5f8fb',
    'surface-variant': '#e3eefb',
    'on-background': '#17324f',
    'on-surface': '#17324f',
    'on-surface-variant': '#17324f',
    primary: '#1565c0',
    'primary-darken-1': '#0d4f9c',
    'on-primary': '#ffffff',
    secondary: '#187a62',
    'secondary-darken-1': '#11604c',
    'on-secondary': '#ffffff',
    header: '#002957',
    'on-header': '#ffffff',
    graph: '#13547a',
    'graph-light': '#80d0c7',
    info: '#1565c0',
    success: '#187a62',
    warning: '#b26a00',
    error: '#c62828',
    'on-error': '#ffffff',
  },
  variables: { ...variables, 'border-color': '#17324f' },
}

// Vuetify theme name → the data-theme value tokens.css uses.
export const themeAttribute = { fjord: 'fjord', fjordDark: 'fjord-dark', classic: 'classic' }
