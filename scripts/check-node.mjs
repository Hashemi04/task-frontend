const [major, minor] = process.versions.node.split('.').map(Number)

if (major < 22 || (major === 22 && minor < 12)) {
  console.error(
    `Node ${process.versions.node} is too old: this project needs Node 22.12 or newer.\nRun \`nvm use\` in the project folder, then commit again.`
  )
  process.exit(1)
}
