const token = process.env.TOKEN || JSON.parse(process.env.npm_config_argv).remain
require('fs').writeFileSync('token.txt', token)