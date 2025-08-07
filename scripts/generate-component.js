import fs from 'fs/promises'
import path from 'path'

const componentTemplate = (name, type) => `import React from 'react'
import { motion } from 'framer-motion'

interface ${name}Props {
  // TODO: Define props
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-gray-900 rounded-lg border border-gray-700"
    >
      <h2 className="text-xl font-bold text-white mb-4">${name}</h2>
      {/* TODO: Implement ${name} */}
    </motion.div>
  )
}

export default ${name}
`

async function generateComponent() {
  const [,, name, type = 'components'] = process.argv
  
  if (!name) {
    console.error('Usage: node generate-component.js <ComponentName> [type]')
    process.exit(1)
  }
  
  const filePath = path.join(process.cwd(), 'src/components', type, `${name}.tsx`)
  
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, componentTemplate(name, type))
  
  console.log(`✅ Component created: ${filePath}`)
}

generateComponent()
