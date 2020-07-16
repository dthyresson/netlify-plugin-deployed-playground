module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('>>> Failing in prebuild')
    return utils.build.failBuild('Failure message')
  }
}
