# Simulate Build Failures

This plugin wil fail a build such that the `netlify-plugin-deployed` can process it `onError` and send to Deployed.

```
[[plugins]]
package = "./netlify-plugin-deployed"
  [plugins.inputs]
  url = 'https://deployed.netlify.app'
  #url = 'http://localhost:8910'

[[plugins]]
package = "./netlify-plugin-deploy-simulator"
```
