module.exports = {
  default: {
    require: ['src/steps/**/*.ts', 'src/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    timeout: 30000 // 30 segundos timeout global
  }
};
