const fs = require('fs');
const path = require('path');

// Função para encontrar e atualizar arquivos
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituições de imports
    const replacements = [
      // Import básico
      [/import\s*{\s*useAuthV2\s*}\s*from\s*['"][^'"]*useAuthV2['"]/, "import { useAuth } from '../auth'"],
      [/import\s*{\s*useAuthV2\s*}\s*from\s*['"][^'"]*\/useAuthV2['"]/, "import { useAuth } from '../auth'"],
      [/import\s*{\s*useAuthV2\s*}\s*from\s*['"]\.\.\/\.\.\/hooks\/useAuthV2['"]/, "import { useAuth } from '../../auth'"],
      [/import\s*{\s*useAuthV2\s*}\s*from\s*['"]\.\.\/\.\.\/\.\.\/hooks\/useAuthV2['"]/, "import { useAuth } from '../../../auth'"],
      
      // Import com UserType
      [/import\s*{\s*useAuthV2,\s*UserType\s*}\s*from\s*['"][^'"]*useAuthV2['"]/, "import { useAuth, UserRole as UserType } from '../auth'"],
      [/import\s*{\s*UserProfile,\s*UserType\s*}\s*from\s*['"][^'"]*useAuthV2['"]/, "import { UserProfile, UserRole as UserType } from '../auth'"],
      
      // Hooks usage
      [/const\s*{\s*([^}]+)\s*}\s*=\s*useAuthV2\(\)/, (match, props) => {
        const propsList = props.split(',').map(p => p.trim());
        const newProps = propsList.map(prop => {
          if (prop === 'loading') return 'isLoading: loading';
          if (prop === 'signIn') return 'login: signIn';
          if (prop === 'signOut') return 'logout: signOut';
          if (prop === 'user') return 'profile: user';
          return prop;
        });
        return `const { ${newProps.join(', ')} } = useAuth()`;
      }],
      
      // Métodos específicos
      [/\.signIn\(/g, '.login('],
      [/\.signOut\(/g, '.logout('],
      [/isAuthenticated\(\)/g, 'isAuthenticated'],
    ];

    // Aplicar substituições
    for (const [pattern, replacement] of replacements) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    // Salvar se modificado
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro em ${filePath}:`, error.message);
  }
}

// Função para percorrer diretórios
function walkDir(dir, exclude = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!exclude.includes(file)) {
        walkDir(filePath, exclude);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      // Pular arquivos de backup
      if (!filePath.includes('auth-backup')) {
        updateFile(filePath);
      }
    }
  }
}

// Executar migração
console.log('🚀 Iniciando migração de imports...');
walkDir('./src', ['node_modules', 'dist', 'build', 'auth-backup']);
console.log('✅ Migração completa!');