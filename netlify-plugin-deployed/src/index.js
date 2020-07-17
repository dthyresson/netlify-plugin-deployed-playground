require('dotenv').config()

const got = require('got')
const jwt = require('jsonwebtoken')

let buildStartedAt = null
let buildEndedAt = null
let errorAt = null
let successAt = null

const now = () => {
  return (new Date()).toJSON()
}

const timestamps = () => {
  return {
    buildStartedAt: buildStartedAt,
    buildEndedAt: buildEndedAt,
    errorAt: errorAt,
    successAt: successAt,
  }
}

const netlifyEnvs = {
  id: process.env.DEPLOY_ID || 'aaa-bbb-ccc-111',
  nodeVersion: process.env.NODE_VERSION,
  nodeEnv: process.env.NODE_ENV,
  npmVersion: process.env.NPM_VERSION,
  npmFlags: process.env.NPM_FLAGS,
  npmToken: process.env.NPM_TOKEN,
  yarnVersion: process.env.YARN_VERSION,
  yarnFlags: process.env.YARN_FLAGS,
  rubyVersion: process.env.RUBY_VERSION,
  phpVersion: process.env.PHP_VERSION,
  hugoVersion: process.env.HUGO_VERSION,
  goVersion: process.env.GO_VERSION,
  goImportPath: process.env.GO_IMPORT_PATH,
  awsLambdaJsRuntime: process.env.AWS_LAMBDA_JS_RUNTIME,
  ci: (process.env.CI === 'true' ? true : false),
  gitLfsEnabled: process.env.GIT_LFS_ENABLED,
  gitLfsFetchInclude: process.env.GIT_LFS_FETCH_INCLUDE,
  netlify: (process.env.NETLIFY === 'true' ? true : false),
  buildId: process.env.BUILD_ID,
  context: process.env.CONTEXT,
  systemArch: process.env._system_arch,
  systemVersion: process.env._system_version,
  repositoryUrl: process.env.REPOSITORY_URL,
  branch: process.env.BRANCH,
  head: process.env.HEAD,
  commitRef: process.env.COMMIT_REF,
  cachedCommitRef: process.env.CACHED_COMMIT_REF,
  pullRequest: (process.env.PULL_REQUEST === 'true' ? true : false),
  reviewId: process.env.REVIEW_ID,
  url: process.env.URL,
  deployUrl: process.env.DEPLOY_URL,
  deployPrimeUrl: process.env.DEPLOY_PRIME_URL,
  siteName: process.env.SITE_NAME,
  siteId: process.env.SITE_ID,
  netlifyImagesCdnDomain: process.env.NETLIFY_IMAGES_CDN_DOMAIN,
  incomingHookTitle: process.env.INCOMING_HOOK_TITLE,
  incomingHookUrl: process.env.INCOMING_HOOK_URL,
  incomingHookBody: process.env.INCOMING_HOOK_BODY,
}

const payload = (options = {}) => {
  return { ...netlifyEnvs, ...options, ...timestamps() }
}

const deployEndpoint = ({ inputs }) => {
  const baseUrl = inputs.url
  console.log(baseUrl)
  return `${baseUrl}/.netlify/functions/deploy`
}

const send = async ({ inputs, payload }) => {
  try {
    const token = process.env.ACCESS_TOKEN
    const secret = process.env.SITE_SECRET
    const claims = {
      audience: inputs.url,
      issuer: 'netlify-plugin-deployed',
      subject: process.env.SITE_ID,
      expiresIn: '1h'
    }
    const signedPayload = jwt.sign({ data: payload }, secret, claims)

    const endpoint = deployEndpoint({ inputs })

    const { body } = await got.post(endpoint, {
      json: {
        payload: signedPayload,
      },
      headers: {
        'X-Netlify-Plugin': 'DEPLOYED',
        'Authorization': `Bearer ${token}`
      },
      responseType: 'json',
    })

    return body
  } catch (error) {
    console.log('Failed to send')
    console.log(error)
    return { data: null }
  }
}

module.exports = {
  onPreBuild: async () => {
    buildStartedAt = now()
    return
  },
  onPostBuild: async ({ inputs }) => {
    buildEndedAt = now()
    return
  },
  onError: async ({ inputs, error, loadedFrom, origin }) => {
    errorAt = now()

    const status = { status: 'error', errorName: error.name, errorMessage: error.message }
    const body = await send({ inputs, payload: payload(status) })

    console.log(body.data)

    return
  },
  onSuccess: async ({ inputs }) => {
    successAt = now()

    const body = await send({ inputs, payload: payload({ status: 'success' }) })

    console.log(body.data)

    return
  },
}
