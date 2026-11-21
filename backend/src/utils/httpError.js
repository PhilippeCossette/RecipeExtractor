/** An Error the error handler turns into that status: throw httpError(409, "You already have a list called Quick"). */
export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
