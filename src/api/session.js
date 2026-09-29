// Session and sign-in.
// Thin wrappers over the Axios client in client.js, grouped by area.
import web from './client.js'

export const sso = (...args) => web.sso(...args)
export const ready = (...args) => web.ready(...args)
export const getMe = (...args) => web.getMe(...args)
export const getInitData = (...args) => web.getInitData(...args)
export const addPermissionRequest = (...args) => web.addPermissionRequest(...args)

// The SSO identity (mail, and name when the identity provider sends one) of
// someone signed in through SSO, whether or not they have a MessyDesk account.
export async function getSsoUser() {
  const response = await web.sso()
  return response.data || {}
}
