// Thème visuel du projet - Basé sur les couleurs du Dashboard
export const theme = {
  // Couleurs principales
  colors: {
    // Doré/orangé - couleur principale du thème
    primary: '#d4af37',
    primaryLight: '#f4e4c1',
    primaryDark: '#b8941f',
    
    // Brun/marron - pour les textes
    textPrimary: '#5d4e37',
    textSecondary: '#8b7355',
    textMuted: '#a89276',
    
    // Fond
    background: '#faf8f3',
    backgroundWhite: '#ffffff',
    backgroundAlternate: '#faf8f3',
    
    // Bordures
    border: '#e8dcc0',
    borderDark: '#d4af37',
    
    // Boutons
    buttonPrimary: '#d4af37',
    buttonPrimaryHover: '#b8941f',
    buttonSecondary: '#8b7355',
    buttonSecondaryHover: '#6d5944',
    buttonDanger: '#ff4444',
    buttonDangerHover: '#cc0000',
    
    // États
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  
  // Espacements
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px'
  },
  
  // Bordures et ombres
  borders: {
    radius: '8px',
    radiusSmall: '4px',
    width: '1px',
    widthThick: '2px'
  },
  
  shadows: {
    card: '0 2px 8px rgba(0,0,0,0.1)',
    cardHover: '0 4px 16px rgba(0,0,0,0.15)',
    button: '0 1px 3px rgba(0,0,0,0.2)',
    modal: '0 8px 32px rgba(0,0,0,0.2)'
  },
  
  // Typographie
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px'
    },
    fontWeight: {
      normal: 'normal',
      bold: 'bold'
    }
  },
  
  // Transitions
  transitions: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s'
  },
  
  // Styles de composants
  components: {
    // Cartes
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e8dcc0',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '24px'
    },
    
    // Tableaux
    table: {
      backgroundColor: '#ffffff',
      borderCollapse: 'collapse',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    
    thead: {
      backgroundColor: '#f4e4c1',
      color: '#5d4e37',
      fontWeight: 'bold'
    },
    
    tbody: {
      backgroundColor: '#ffffff'
    },
    
    th: {
      padding: '12px 8px',
      border: '1px solid #d4af37',
      fontWeight: 'bold',
      color: '#5d4e37',
      backgroundColor: '#f4e4c1'
    },
    
    td: {
      padding: '12px 8px',
      border: '1px solid #e8dcc0',
      color: '#5d4e37'
    },
    
    // Boutons
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: 'normal'
    },
    
    buttonPrimary: {
      backgroundColor: '#d4af37',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: 'normal'
    },
    
    buttonPrimaryHover: {
      backgroundColor: '#b8941f'
    },
    
    buttonSecondary: {
      backgroundColor: '#8b7355',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: 'normal'
    },
    
    buttonSecondaryHover: {
      backgroundColor: '#6d5944'
    },
    
    buttonDanger: {
      backgroundColor: '#ff4444',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    
    buttonDangerHover: {
      backgroundColor: '#cc0000'
    },
    
    // Inputs
    input: {
      backgroundColor: '#ffffff',
      border: '1px solid #e8dcc0',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#5d4e37',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    
    inputFocus: {
      borderColor: '#d4af37'
    },
    
    // Modals
    modal: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000'
    },
    
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    }
  }
};

// Export des styles pour utilisation directe
export const styles = {
  // Page layout
  page: {
    minHeight: '100vh',
    backgroundColor: '#faf8f3',
    fontFamily: 'Arial, sans-serif'
  },
  
  // Container principal
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  
  // Header
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e8dcc0',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  // Card
  card: theme.components.card,
  
  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#5d4e37'
  },
  
  // Table styles
  table: theme.components.table,
  thead: theme.components.thead,
  tbody: theme.components.tbody,
  th: theme.components.th,
  td: theme.components.td
};
